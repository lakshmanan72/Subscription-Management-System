"""
Invoice Service
Manages tax invoice generation, Indian GST breakdowns (CGST/SGST/IGST),
status confirmations, cancellations, and customer balance updates.
"""

from datetime import date
from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import BusinessRuleViolationException, EntityNotFoundException, InvalidTransitionException
from app.models.invoice import Invoice
from app.models.invoice_line import InvoiceLine
from app.repositories import CustomerRepository, InvoiceRepository, SubscriptionRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from app.utils.calculations import calculate_document_totals, round_currency
from app.utils.invoice_number import generate_invoice_number


class InvoiceService:
    def __init__(
        self,
        invoice_repo: InvoiceRepository,
        customer_repo: CustomerRepository,
        subscription_repo: SubscriptionRepository
    ):
        self.invoice_repo = invoice_repo
        self.customer_repo = customer_repo
        self.subscription_repo = subscription_repo

    def list_invoices(self, customer_id: Optional[str] = None) -> List[Invoice]:
        if customer_id:
            return self.invoice_repo.get_by_customer(customer_id)
        return self.invoice_repo.get_all()

    def get_invoice(self, invoice_id: str) -> Invoice:
        inv = self.invoice_repo.get_by_id(invoice_id)
        if not inv:
            raise EntityNotFoundException("Invoice", invoice_id)
        return inv

    def create_invoice(self, request: InvoiceCreate) -> Invoice:
        customer = self.customer_repo.get_by_id(request.customer_id)
        if not customer:
            raise EntityNotFoundException("Customer", request.customer_id)

        raw_lines = [l.model_dump() for l in request.lines]
        totals = calculate_document_totals(
            raw_lines,
            document_discount=request.discount or Decimal("0.00"),
            is_interstate=request.is_interstate
        )

        count = self.invoice_repo.count()
        invoice_id = f"INV-{date.today().year}-{str(count + 1).zfill(3)}"
        invoice_number = generate_invoice_number(count + 81)  # Matches mock sequence INV-2024-0081

        new_inv = Invoice(
            id=invoice_id,
            invoice_number=invoice_number,
            customer_id=request.customer_id,
            subscription_id=request.subscription_id,
            invoice_date=request.invoice_date,
            due_date=request.due_date,
            subtotal=totals["subtotal"],
            tax=totals["tax"],
            cgst_amount=totals["cgst_amount"],
            sgst_amount=totals["sgst_amount"],
            igst_amount=totals["igst_amount"],
            discount=totals["discount"],
            total=totals["total"],
            paid_amount=Decimal("0.00"),
            outstanding_amount=totals["total"],
            status=request.status,
            payment_terms=request.payment_terms,
            notes=request.notes
        )
        self.invoice_repo.create(new_inv)

        for pline in totals["processed_lines"]:
            line_id = f"inv-l-{uuid.uuid4().hex[:6]}"
            new_line = InvoiceLine(
                id=line_id,
                invoice_id=invoice_id,
                description=pline["description"],
                quantity=pline["quantity"],
                unit_price=pline["unit_price"],
                amount=pline["subtotal"],
                tax_rate=pline["tax_rate"],
                tax_amount=pline["tax_amount"],
                discount=pline["discount"],
                sac_code=pline.get("sac_code", "998313")
            )
            self.invoice_repo.db.add(new_line)

        # If created directly as Confirmed, update customer balance
        if request.status in ["Confirmed", "Overdue"]:
            new_balance = customer.outstanding_balance + totals["total"]
            self.customer_repo.update(request.customer_id, {"outstanding_balance": new_balance})

        self.invoice_repo.db.flush()
        return self.get_invoice(invoice_id)

    def confirm_invoice(self, invoice_id: str) -> Invoice:
        inv = self.get_invoice(invoice_id)
        if inv.status in ["Confirmed", "Paid", "Partially Paid"]:
            return inv
        if inv.status in ["Cancelled"]:
            raise InvalidTransitionException("Invoice", inv.status, "Confirmed")

        self.invoice_repo.update(invoice_id, {"status": "Confirmed"})

        # Add to customer outstanding balance
        customer = self.customer_repo.get_by_id(inv.customer_id)
        if customer:
            new_balance = customer.outstanding_balance + inv.outstanding_amount
            self.customer_repo.update(inv.customer_id, {"outstanding_balance": new_balance})

        return self.get_invoice(invoice_id)

    def cancel_invoice(self, invoice_id: str, reason: Optional[str] = None) -> Invoice:
        inv = self.get_invoice(invoice_id)
        if inv.status == "Cancelled":
            return inv
        if inv.paid_amount > 0:
            raise BusinessRuleViolationException("Cannot cancel an invoice with recorded payments. Refund payments first.")

        # Revert customer balance if invoice was active
        if inv.status in ["Confirmed", "Overdue"]:
            customer = self.customer_repo.get_by_id(inv.customer_id)
            if customer:
                new_balance = max(Decimal("0.00"), customer.outstanding_balance - inv.outstanding_amount)
                self.customer_repo.update(inv.customer_id, {"outstanding_balance": new_balance})

        self.invoice_repo.update(invoice_id, {"status": "Cancelled"})
        return self.get_invoice(invoice_id)
