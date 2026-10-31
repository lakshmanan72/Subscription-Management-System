from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.customer import Customer
from backend.models.subscription import Subscription
from backend.models.invoice import Invoice
from backend.models.payment import Payment
from backend.schemas.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    SubscriptionResponse,
    InvoiceResponse,
    PaymentResponse,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(db: Session = Depends(get_db)):
    """Lists all customers with balance and subscription counts."""
    return db.query(Customer).order_by(Customer.name).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(cust_in: CustomerCreate, db: Session = Depends(get_db)):
    """Creates a new customer profile."""
    cust_id = f"cust-{int(datetime.utcnow().timestamp() * 1000)}"
    new_cust = Customer(
        id=cust_id,
        name=cust_in.name,
        company=cust_in.company,
        email=cust_in.email.lower().strip(),
        phone=cust_in.phone,
        gstin=cust_in.gstin,
        address=cust_in.address,
        city=cust_in.city,
        country=cust_in.country or "India",
        registration_date=datetime.utcnow().strftime("%Y-%m-%d"),
        active_subscriptions_count=0,
        total_invoices_count=0,
        outstanding_balance=0.0,
        avatar=cust_in.avatar or f"https://ui-avatars.com/api/?name={cust_in.name.replace(' ', '+')}&background=4f46e5&color=fff",
        is_portal_demo_user=False,
    )
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return new_cust


@router.get("/{id}", response_model=CustomerResponse)
def get_customer(id: str, db: Session = Depends(get_db)):
    """Retrieves customer by ID."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return cust


@router.put("/{id}", response_model=CustomerResponse)
def update_customer(id: str, update_in: CustomerUpdate, db: Session = Depends(get_db)):
    """Updates customer profile details."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    if not cust:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        if field == "email" and val:
            val = val.lower().strip()
        setattr(cust, field, val)

    db.commit()
    db.refresh(cust)
    return cust


@router.get("/{id}/subscriptions", response_model=List[SubscriptionResponse])
def get_customer_subscriptions(id: str, db: Session = Depends(get_db)):
    """Returns all subscriptions for a specific customer."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    email = cust.email if cust else None
    return db.query(Subscription).filter(
        (Subscription.customer_id == id) | (Subscription.customer_email == email)
    ).all()


@router.get("/{id}/invoices", response_model=List[InvoiceResponse])
def get_customer_invoices(id: str, db: Session = Depends(get_db)):
    """Returns all invoices for a specific customer."""
    cust = db.query(Customer).filter(Customer.id == id).first()
    email = cust.email if cust else None
    return db.query(Invoice).filter(
        (Invoice.customer_id == id) | (Invoice.customer_email == email)
    ).all()


@router.get("/{id}/payments", response_model=List[PaymentResponse])
def get_customer_payments(id: str, db: Session = Depends(get_db)):
    """Returns all payments for a specific customer."""
    return db.query(Payment).filter(Payment.customer_id == id).all()
