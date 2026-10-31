"""
Business Intelligence & Reports Endpoints
Aggregated metrics and tabular exports for revenue, contracts, payments, and dunning.
"""

from datetime import date
from decimal import Decimal
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import require_admin_or_staff
from app.database.session import get_db
from app.repositories import (
    CustomerRepository, InvoiceRepository, PaymentRepository, SubscriptionRepository
)
from app.schemas.auth import TokenPayload

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/revenue", response_model=Dict[str, Any], summary="Revenue & Collections Report")
def get_revenue_report(
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    pay_repo = PaymentRepository(db)
    payments = pay_repo.get_all()
    total_collected = sum((p.amount for p in payments if p.status == "Success"), Decimal("0.00"))

    inv_repo = InvoiceRepository(db)
    invoices = inv_repo.get_all()
    total_tax = sum((i.tax for i in invoices), Decimal("0.00"))

    return {
        "gross_collections": float(total_collected),
        "tax_liabilities": float(total_tax),
        "transaction_count": len(payments),
        "currency": "INR",
        "currency_symbol": "₹"
    }


@router.get("/subscriptions", response_model=Dict[str, Any], summary="Subscription Health Report")
def get_subscription_report(
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    sub_repo = SubscriptionRepository(db)
    subs = sub_repo.get_all()
    active_count = sum(1 for s in subs if s.status == "Active")
    paused_count = sum(1 for s in subs if s.status == "Paused")
    closed_count = sum(1 for s in subs if s.status == "Closed")

    return {
        "total_contracts": len(subs),
        "active": active_count,
        "paused": paused_count,
        "closed": closed_count,
        "retention_rate": round(active_count / len(subs) * 100, 2) if subs else 100.0
    }


@router.get("/payments", response_model=List[Dict[str, Any]], summary="Payment General Ledger")
def get_payments_ledger(
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    pay_repo = PaymentRepository(db)
    payments = pay_repo.get_all()
    return [
        {
            "id": p.id,
            "reference": p.payment_reference,
            "customer": p.customer_rel.company if p.customer_rel else "Customer",
            "invoice": p.invoice_rel.invoice_number if p.invoice_rel else "",
            "method": p.payment_method,
            "amount": float(p.amount),
            "date": str(p.payment_date),
            "status": p.status
        }
        for p in payments
    ]


@router.get("/overdue", response_model=List[Dict[str, Any]], summary="Delinquent Dunning Report")
def get_overdue_report(
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    inv_repo = InvoiceRepository(db)
    overdue = inv_repo.get_overdue(date.today())
    return [
        {
            "id": i.id,
            "invoice_number": i.invoice_number,
            "customer": i.customer_rel.company if i.customer_rel else "",
            "due_date": str(i.due_date),
            "outstanding": float(i.outstanding_amount),
            "days_overdue": (date.today() - i.due_date).days
        }
        for i in overdue
    ]


@router.get("/customers", response_model=List[Dict[str, Any]], summary="Customer Directory Cohort")
def get_customer_cohorts(
    current_user: TokenPayload = Depends(require_admin_or_staff),
    db: Session = Depends(get_db)
):
    cust_repo = CustomerRepository(db)
    customers = cust_repo.get_all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company": c.company,
            "email": c.email,
            "gstin": c.gstin,
            "outstanding_balance": float(c.outstanding_balance),
            "status": c.status
        }
        for c in customers
    ]
