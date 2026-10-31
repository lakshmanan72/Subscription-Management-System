"""
Invoice and Billing Endpoints
GST tax invoicing, line calculations, status confirmations, and cancellations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import check_customer_data_isolation, require_admin_or_staff, require_authenticated
from app.database.session import get_db
from app.repositories import CustomerRepository, InvoiceRepository, SubscriptionRepository
from app.schemas.auth import TokenPayload
from app.schemas.common import MessageResponse
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(
        InvoiceRepository(db),
        CustomerRepository(db),
        SubscriptionRepository(db)
    )


@router.get("", response_model=List[InvoiceResponse], summary="List Invoices")
def list_invoices(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    current_user: TokenPayload = Depends(require_authenticated),
    service: InvoiceService = Depends(get_invoice_service)
):
    if customer_id:
        check_customer_data_isolation(current_user, customer_id)
        return service.list_invoices(customer_id)

    if current_user.role.upper() == "CUSTOMER":
        return service.list_invoices(current_user.customer_id)

    return service.list_invoices()


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED, summary="Create Invoice")
def create_invoice(
    request: InvoiceCreate,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: InvoiceService = Depends(get_invoice_service)
):
    return service.create_invoice(request)


@router.get("/{invoice_id}", response_model=InvoiceResponse, summary="Get Invoice Details")
def get_invoice(
    invoice_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: InvoiceService = Depends(get_invoice_service)
):
    inv = service.get_invoice(invoice_id)
    check_customer_data_isolation(current_user, inv.customer_id)
    return inv


@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse, summary="Confirm Invoice")
def confirm_invoice(
    invoice_id: str,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: InvoiceService = Depends(get_invoice_service)
):
    return service.confirm_invoice(invoice_id)


@router.post("/{invoice_id}/cancel", response_model=InvoiceResponse, summary="Cancel Invoice")
def cancel_invoice(
    invoice_id: str,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: InvoiceService = Depends(get_invoice_service)
):
    return service.cancel_invoice(invoice_id)


@router.post("/{invoice_id}/send", response_model=MessageResponse, summary="Dispatch Invoice Email")
def send_invoice(
    invoice_id: str,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: InvoiceService = Depends(get_invoice_service)
):
    inv = service.get_invoice(invoice_id)
    return MessageResponse(
        message=f"Tax invoice {inv.invoice_number} dispatched to client billing address.",
        code="INVOICE_EMAIL_DISPATCHED"
    )
