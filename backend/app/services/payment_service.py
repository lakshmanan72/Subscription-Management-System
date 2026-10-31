"""
Payment Settlement Service
Records collections across UPI, Card, NetBanking, and Cash.
Prevents overpayment, reconciles invoice balances, and adjusts customer accounts.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional

from app.core.exceptions import BusinessRuleViolationException, EntityNotFoundException
from app.models.payment import Payment
from app.repositories import CustomerRepository, InvoiceRepository, PaymentRepository
from app.schemas.payment import PaymentRecordRequest
from app.utils.calculations import round_currency
from app.utils.invoice_number import generate_payment_reference


class PaymentService:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        invoice_repo: InvoiceRepository,
        customer_repo: CustomerRepository
    ):
        self.payment_repo = payment_repo
        self.invoice_repo = invoice_repo
        self.customer_repo = customer_repo

    def list_payments(self, customer_id: Optional[str] = None, invoice_id: Optional[str] = None) -> List[Payment]:
        if invoice_id:
            return self.payment_repo.get_by_invoice(invoice_id)
        if customer_id:
            return self.payment_repo.get_by_customer(customer_id)
        return self.payment_repo.get_all()

    def record_payment(self, request: PaymentRecordRequest) -> Payment:
        """
        Processes a full or partial invoice payment.
        PREVENTS OVERPAYMENT:
        Rejects payments exceeding the current invoice outstanding amount.
        """
        inv = self.invoice_repo.get_by_id(request.invoice_id)
        if not inv:
            raise EntityNotFoundException("Invoice", request.invoice_id)

        pay_amount = round_currency(request.amount)
        if pay_amount <= 0:
            raise BusinessRuleViolationException("Payment amount must be greater than zero.")

        if pay_amount > inv.outstanding_amount:
            raise BusinessRuleViolationException(
                f"Payment amount ₹{pay_amount} exceeds invoice outstanding balance of ₹{inv.outstanding_amount}. "
                "Overpayments are not permitted."
            )

        count = self.payment_repo.count()
        pay_id = f"PAY-{date.today().year}-{str(count + 1).zfill(3)}"
        pay_ref = generate_payment_reference(count + 9021)  # Matches mock sequence PAY-REF-9021

        pay_date = request.payment_date or date.today()

        new_payment = Payment(
            id=pay_id,
            payment_reference=pay_ref,
            customer_id=inv.customer_id,
            invoice_id=inv.id,
            payment_method=request.payment_method,
            amount=pay_amount,
            payment_date=pay_date,
            transaction_id=request.transaction_id,
            status="Success",
            notes=request.notes
        )
        self.payment_repo.create(new_payment)

        # Update invoice balance and status
        new_paid = inv.paid_amount + pay_amount
        new_outstanding = inv.outstanding_amount - pay_amount
        new_status = "Paid" if new_outstanding == Decimal("0.00") else "Partially Paid"

        self.invoice_repo.update(inv.id, {
            "paid_amount": new_paid,
            "outstanding_amount": new_outstanding,
            "status": new_status
        })

        # Update customer outstanding balance
        customer = self.customer_repo.get_by_id(inv.customer_id)
        if customer:
            cust_balance = max(Decimal("0.00"), customer.outstanding_balance - pay_amount)
            self.customer_repo.update(inv.customer_id, {"outstanding_balance": cust_balance})

        self.payment_repo.db.flush()
        return new_payment
