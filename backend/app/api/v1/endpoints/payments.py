"""
Payment Management Endpoints
Record settlements (UPI, Card, Bank transfer, Cash), reconciliation, and payment history.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import check_customer_data_isolation, require_authenticated
from app.database.session import get_db
from app.repositories import CustomerRepository, InvoiceRepository, PaymentRepository
from app.schemas.auth import TokenPayload
from app.schemas.payment import PaymentRecordRequest, PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(
        PaymentRepository(db),
        InvoiceRepository(db),
        CustomerRepository(db)
    )


@router.get("", response_model=List[PaymentResponse], summary="List Payments")
def list_payments(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    invoice_id: Optional[str] = Query(None, description="Filter by invoice ID"),
    current_user: TokenPayload = Depends(require_authenticated),
    service: PaymentService = Depends(get_payment_service)
):
    if customer_id:
        check_customer_data_isolation(current_user, customer_id)
        return service.list_payments(customer_id=customer_id, invoice_id=invoice_id)

    if current_user.role.upper() == "CUSTOMER":
        return service.list_payments(customer_id=current_user.customer_id, invoice_id=invoice_id)

    return service.list_payments(customer_id=None, invoice_id=invoice_id)


@router.post(
    "/record",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Payment / Pay Now",
    description="Records payment settlement against an invoice. Reconciles invoice balance and updates status to Paid/Partially Paid."
)
def record_payment(
    request: PaymentRecordRequest,
    current_user: TokenPayload = Depends(require_authenticated),
    service: PaymentService = Depends(get_payment_service)
):
    return service.record_payment(request)
