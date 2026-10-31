"""
Discount and Promotion Endpoints
Campaign rule management, usage pace tracking, and interactive discount calculator.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin, require_authenticated
from app.database.session import get_db
from app.repositories import DiscountRepository
from app.schemas.auth import TokenPayload
from app.schemas.discount import (
    DiscountCalculationRequest, DiscountCalculationResponse,
    DiscountCreate, DiscountResponse, DiscountUpdate
)
from app.services.discount_service import DiscountService

router = APIRouter(prefix="/discounts", tags=["Discounts"])


def get_discount_service(db: Session = Depends(get_db)) -> DiscountService:
    return DiscountService(DiscountRepository(db))


@router.get("", response_model=List[DiscountResponse], summary="List Discounts")
def list_discounts(
    current_user: TokenPayload = Depends(require_authenticated),
    service: DiscountService = Depends(get_discount_service)
):
    return service.list_discounts()


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED, summary="Create Discount")
def create_discount(
    request: DiscountCreate,
    admin_user: TokenPayload = Depends(require_admin),
    service: DiscountService = Depends(get_discount_service)
):
    return service.create_discount(request)


@router.get("/{discount_id}", response_model=DiscountResponse, summary="Get Discount Detail")
def get_discount(
    discount_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: DiscountService = Depends(get_discount_service)
):
    return service.get_discount(discount_id)


@router.post(
    "/calculate",
    response_model=DiscountCalculationResponse,
    summary="Interactive Discount Calculator",
    description="Tests any promo code against arbitrary contract amounts in real-time, verifying validity, expiry, and thresholds."
)
def calculate_discount(
    request: DiscountCalculationRequest,
    service: DiscountService = Depends(get_discount_service)
):
    return service.evaluate_discount(request)


@router.patch("/{discount_id}/status", response_model=DiscountResponse, summary="Toggle Status")
def toggle_status(
    discount_id: str,
    admin_user: TokenPayload = Depends(require_admin),
    service: DiscountService = Depends(get_discount_service)
):
    disc = service.get_discount(discount_id)
    new_status = "Inactive" if disc.status == "Active" else "Active"
    return service.discount_repo.update(discount_id, {"status": new_status}) or disc
