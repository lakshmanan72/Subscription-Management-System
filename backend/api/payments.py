from datetime import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.payment import Payment
from backend.models.invoice import Invoice
from backend.models.customer import Customer
from backend.schemas.schemas import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(customer_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists payments. Optional customer_id filter."""
    query = db.query(Payment)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    return query.order_by(Payment.payment_date.desc()).all()


@router.post("/record", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(payment_in: PaymentCreate, db: Session = Depends(get_db)):
    """
    Records payment against invoice or customer.
    Reconciles invoice outstanding amount and customer balance.
    Prevents overpayment.
    """
    inv = None
    if payment_in.invoice_id:
        inv = db.query(Invoice).filter(
            (Invoice.id == payment_in.invoice_id) | (Invoice.invoice_number == payment_in.invoice_id)
        ).first()

    customer_id = payment_in.customer_id or (inv.customer_id if inv else "cust-1")
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    # Prevent overpayment if invoice exists
    if inv:
        if payment_in.amount > inv.outstanding_amount + 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount (₹{payment_in.amount:,.2f}) exceeds invoice outstanding balance (₹{inv.outstanding_amount:,.2f}).",
            )

    pay_ref = f"PAY-REF-{random.randint(1000, 9999)}"
    pay_id = f"PAY-{int(datetime.utcnow().timestamp() * 1000)}"
    method_abbr = payment_in.payment_method[:3].upper() if payment_in.payment_method else "UPI"
    txn_id = f"TXN-{method_abbr}-{int(datetime.utcnow().timestamp() * 1000)}"

    new_payment = Payment(
        id=pay_id,
        payment_reference=pay_ref,
        customer=inv.customer if inv else (customer.company if customer else "Enterprise Client"),
        customer_id=customer_id,
        invoice=inv.invoice_number if inv else "Manual Settlement",
        invoice_id=inv.id if inv else None,
        payment_method=payment_in.payment_method,
        amount=payment_in.amount,
        payment_date=datetime.utcnow().strftime("%Y-%m-%d"),
        transaction_id=txn_id,
        status="Success",
        notes=payment_in.notes or "Payment reconciled via billing portal.",
    )

    db.add(new_payment)

    # Reconcile invoice
    if inv:
        new_paid = (inv.paid_amount or 0.0) + payment_in.amount
        new_outstanding = max(0.0, (inv.total or 0.0) - new_paid)
        inv.paid_amount = round(new_paid, 2)
        inv.outstanding_amount = round(new_outstanding, 2)
        inv.status = "Paid" if new_outstanding <= 0.01 else "Confirmed"

    # Reconcile customer outstanding balance
    if customer:
        customer.outstanding_balance = max(0.0, (customer.outstanding_balance or 0.0) - payment_in.amount)

    db.commit()
    db.refresh(new_payment)
    return new_payment


@router.get("/{id}", response_model=PaymentResponse)
def get_payment(id: str, db: Session = Depends(get_db)):
    """Retrieves payment receipt by ID or reference."""
    pay = db.query(Payment).filter((Payment.id == id) | (Payment.payment_reference == id)).first()
    if not pay:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")
    return pay
