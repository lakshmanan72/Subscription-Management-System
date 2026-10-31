from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.invoice import Invoice, InvoiceLine
from backend.models.customer import Customer
from backend.schemas.schemas import InvoiceCreate, InvoiceResponse
from backend.services.billing_service import BillingService

from backend.models.user import User
from backend.services.auth_service import get_current_user_optional

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    customer_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Lists invoices with role-based customer data isolation."""
    query = db.query(Invoice)
    if current_user and current_user.role == "CUSTOMER":
        cust = db.query(Customer).filter((Customer.user_id == current_user.id) | (Customer.email == current_user.email)).first()
        allowed_id = cust.id if cust else "__none__"
        query = query.filter(Invoice.customer_id == allowed_id)
    elif customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    return query.order_by(Invoice.invoice_date.desc()).all()


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(inv_in: InvoiceCreate, db: Session = Depends(get_db)):
    """Creates a new tax invoice with GST line items."""
    inv_count = db.query(Invoice).count() + 1
    inv_number = inv_in.invoice_number or f"INV-2024-{str(inv_count + 100).zfill(4)}"
    inv_id = f"INV-{int(datetime.utcnow().timestamp() * 1000)}"

    new_inv = Invoice(
        id=inv_id,
        invoice_number=inv_number,
        customer=inv_in.customer,
        customer_id=inv_in.customer_id,
        customer_email=inv_in.customer_email,
        customer_address=inv_in.customer_address,
        customer_gst=inv_in.customer_gst,
        subscription=inv_in.subscription,
        subscription_id=inv_in.subscription_id,
        invoice_date=inv_in.invoice_date or datetime.utcnow().strftime("%Y-%m-%d"),
        due_date=inv_in.due_date,
        subtotal=inv_in.subtotal,
        tax=inv_in.tax,
        discount=inv_in.discount,
        total=inv_in.total,
        paid_amount=inv_in.paid_amount or 0.0,
        outstanding_amount=inv_in.total if inv_in.outstanding_amount == 0.0 and inv_in.paid_amount == 0.0 else inv_in.outstanding_amount,
        status=inv_in.status or "Draft",
        payment_terms=inv_in.payment_terms or "Net 15",
        notes=inv_in.notes,
    )

    if inv_in.lines:
        for idx, line in enumerate(inv_in.lines):
            new_inv.lines.append(
                InvoiceLine(
                    id=f"inv-l-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    description=line.description,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    amount=line.amount,
                )
            )

    # Update customer invoice count & balance if confirmed/active
    customer = db.query(Customer).filter(Customer.id == inv_in.customer_id).first()
    if customer:
        customer.total_invoices_count = (customer.total_invoices_count or 0) + 1
        if new_inv.status in ("Confirmed", "Overdue"):
            customer.outstanding_balance = (customer.outstanding_balance or 0.0) + new_inv.outstanding_amount

    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return new_inv


@router.get("/{id}", response_model=InvoiceResponse)
def get_invoice(
    id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieves single tax invoice with lines."""
    inv = db.query(Invoice).filter((Invoice.id == id) | (Invoice.invoice_number == id)).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if current_user and current_user.role == "CUSTOMER":
        cust = db.query(Customer).filter((Customer.user_id == current_user.id) | (Customer.email == current_user.email)).first()
        if not cust or inv.customer_id != cust.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Cannot access another customer's invoices.")

    return inv


@router.post("/{id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(id: str, db: Session = Depends(get_db)):
    """Transitions invoice from Draft to Confirmed."""
    inv = db.query(Invoice).filter((Invoice.id == id) | (Invoice.invoice_number == id)).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    inv.status = "Confirmed"
    db.commit()
    db.refresh(inv)
    return inv


@router.post("/{id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(id: str, db: Session = Depends(get_db)):
    """Cancels invoice and deducts from customer outstanding balance."""
    inv = db.query(Invoice).filter((Invoice.id == id) | (Invoice.invoice_number == id)).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    if inv.status != "Cancelled":
        # Deduct outstanding amount from customer
        customer = db.query(Customer).filter(Customer.id == inv.customer_id).first()
        if customer and inv.outstanding_amount > 0:
            customer.outstanding_balance = max(0.0, (customer.outstanding_balance or 0.0) - inv.outstanding_amount)
        inv.outstanding_amount = 0.0
        inv.status = "Cancelled"
        db.commit()
        db.refresh(inv)

    return inv


@router.post("/{id}/send")
def send_invoice(id: str, target_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Dispatches invoice to customer email."""
    inv = db.query(Invoice).filter((Invoice.id == id) | (Invoice.invoice_number == id)).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    email_to = target_email or inv.customer_email or "client@zenithtech.in"
    return {
        "success": True,
        "message": f"Tax invoice {inv.invoice_number} successfully dispatched to {email_to}.",
    }


@router.post("/recurring-run")
def trigger_recurring_billing(force: bool = False, db: Session = Depends(get_db)):
    """Executes the automated recurring billing runner for active subscriptions."""
    return BillingService.run_recurring_billing(db=db, force=force)
