"""
Quotation Endpoints
Proposals creation, multi-line builder, confirmation, and 1-click subscription conversion.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin_or_staff
from app.database.session import get_db
from app.repositories import CustomerRepository, QuotationRepository, SubscriptionRepository
from app.schemas.auth import TokenPayload
from app.schemas.quotation import (
    ConvertQuotationRequest, QuotationCreate,
    QuotationResponse, QuotationUpdate
)
from app.schemas.subscription import SubscriptionResponse
from app.services.quotation_service import QuotationService

router = APIRouter(prefix="/quotations", tags=["Quotations"])


def get_quotation_service(db: Session = Depends(get_db)) -> QuotationService:
    return QuotationService(
        QuotationRepository(db),
        CustomerRepository(db),
        SubscriptionRepository(db)
    )


@router.get("", response_model=List[QuotationResponse], summary="List Quotations")
def list_quotations(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: QuotationService = Depends(get_quotation_service)
):
    return service.list_quotations(customer_id)


@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED, summary="Create Quotation")
def create_quotation(
    request: QuotationCreate,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: QuotationService = Depends(get_quotation_service)
):
    return service.create_quotation(request)


@router.get("/{quotation_id}", response_model=QuotationResponse, summary="Get Quotation Detail")
def get_quotation(
    quotation_id: str,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: QuotationService = Depends(get_quotation_service)
):
    return service.get_quotation(quotation_id)


@router.post("/{quotation_id}/confirm", response_model=QuotationResponse, summary="Confirm Quotation")
def confirm_quotation(
    quotation_id: str,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: QuotationService = Depends(get_quotation_service)
):
    return service.confirm_quotation(quotation_id)


@router.post(
    "/{quotation_id}/convert",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Convert to Subscription",
    description="1-Click Conversion: Converts a confirmed quotation into an active subscription contract."
)
def convert_to_subscription(
    quotation_id: str,
    request: ConvertQuotationRequest,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: QuotationService = Depends(get_quotation_service)
):
    return service.convert_to_subscription(quotation_id, request)
