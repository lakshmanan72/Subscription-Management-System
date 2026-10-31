"""
Recurring Billing Engine
Scans for due subscription contracts, generates cycle tax invoices, advances next billing dates,
and maintains billing history.
"""

from datetime import date, timedelta
from decimal import Decimal
import logging
from typing import List, Optional

from app.models.invoice import Invoice
from app.models.invoice_line import InvoiceLine
from app.models.subscription import Subscription
from app.repositories import AuditLogRepository, CustomerRepository, InvoiceRepository, SubscriptionRepository
from app.utils.calculations import calculate_document_totals
from app.utils.date_utils import calculate_next_billing_date
from app.utils.invoice_number import generate_invoice_number

logger = logging.getLogger(__name__)


class BillingService:
    def __init__(
        self,
        subscription_repo: SubscriptionRepository,
        invoice_repo: InvoiceRepository,
        customer_repo: CustomerRepository,
        audit_repo: AuditLogRepository
    ):
        self.subscription_repo = subscription_repo
        self.invoice_repo = invoice_repo
        self.customer_repo = customer_repo
        self.audit_repo = audit_repo

    def run_recurring_billing_cycle(self, target_date: Optional[date] = None) -> List[Invoice]:
        """
        Executes automated recurring billing run:
        1. Identifies active subscriptions where next_billing_date <= target_date.
        2. Generates itemized cycle invoice.
        3. Updates customer outstanding balance.
        4. Calculates and schedules subsequent next_billing_date.
        5. Logs chronological audit event.
        """
        eval_date = target_date or date.today()
        due_subscriptions = self.subscription_repo.get_active_due_for_billing(eval_date)
        generated_invoices = []

        for sub in due_subscriptions:
            try:
                inv = self._generate_cycle_invoice(sub, eval_date)
                if inv:
                    generated_invoices.append(inv)
            except Exception as exc:
                logger.error(f"Failed to generate recurring billing invoice for sub {sub.id}: {exc}")

        return generated_invoices

    def _generate_cycle_invoice(self, sub: Subscription, billing_date: date) -> Optional[Invoice]:
        # Payment terms offset calculation
        due_days = 15
        if "30" in sub.payment_terms:
            due_days = 30
        elif "Immediate" in sub.payment_terms:
            due_days = 0
        due_date = billing_date + timedelta(days=due_days)

        # Build lines from subscription lines
        raw_lines = []
        for line in sub.lines:
            raw_lines.append({
                "description": f"{line.product_name} ({line.variant_name or 'Standard'}) - {sub.billing_frequency}",
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "tax_rate": line.tax_rate,
                "discount": Decimal("0.00")
            })

        totals = calculate_document_totals(raw_lines)

        count = self.invoice_repo.count()
        invoice_id = f"INV-{date.today().year}-{str(count + 1).zfill(3)}"
        invoice_number = generate_invoice_number(count + 81)

        new_inv = Invoice(
            id=invoice_id,
            invoice_number=invoice_number,
            customer_id=sub.customer_id,
            subscription_id=sub.id,
            invoice_date=billing_date,
            due_date=due_date,
            subtotal=totals["subtotal"],
            tax=totals["tax"],
            cgst_amount=totals["cgst_amount"],
            sgst_amount=totals["sgst_amount"],
            igst_amount=totals["igst_amount"],
            discount=Decimal("0.00"),
            total=totals["total"],
            paid_amount=Decimal("0.00"),
            outstanding_amount=totals["total"],
            status="Confirmed",
            payment_terms=sub.payment_terms,
            notes=f"Automated cycle invoice for {sub.subscription_number}."
        )
        self.invoice_repo.create(new_inv)

        for pline in totals["processed_lines"]:
            new_line = InvoiceLine(
                id=f"inv-l-{invoice_id}-{count}",
                invoice_id=invoice_id,
                description=pline["description"],
                quantity=pline["quantity"],
                unit_price=pline["unit_price"],
                amount=pline["subtotal"],
                tax_rate=pline["tax_rate"],
                tax_amount=pline["tax_amount"],
                discount=Decimal("0.00"),
                sac_code="998313"
            )
            self.invoice_repo.db.add(new_line)

        # Update customer outstanding balance
        customer = self.customer_repo.get_by_id(sub.customer_id)
        if customer:
            new_balance = customer.outstanding_balance + totals["total"]
            self.customer_repo.update(sub.customer_id, {"outstanding_balance": new_balance})

        # Advance subscription next_billing_date
        next_billing = calculate_next_billing_date(billing_date, sub.billing_frequency)
        self.subscription_repo.update(sub.id, {"next_billing_date": next_billing})

        self.subscription_repo.db.flush()
        return new_inv
