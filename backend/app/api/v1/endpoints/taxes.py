"""
Tax Configuration Endpoints
GST slab configurations (18% Standard, 18% IGST, 5% Concessional, 0% SEZ Export).
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories import TaxRepository
from app.schemas.auth import TokenPayload
from app.schemas.tax import TaxCreate, TaxResponse
from app.services.tax_service import TaxService

router = APIRouter(prefix="/taxes", tags=["Taxes"])


def get_tax_service(db: Session = Depends(get_db)) -> TaxService:
    return TaxService(TaxRepository(db))


@router.get("", response_model=List[TaxResponse], summary="List Tax Slabs")
def list_taxes(service: TaxService = Depends(get_tax_service)):
    return service.list_taxes()


@router.post("", response_model=TaxResponse, status_code=status.HTTP_201_CREATED, summary="Create Tax Slab")
def create_tax(
    request: TaxCreate,
    admin_user: TokenPayload = Depends(require_admin),
    service: TaxService = Depends(get_tax_service)
):
    return service.create_tax(request)


@router.get("/{tax_id}", response_model=TaxResponse, summary="Get Tax Detail")
def get_tax(tax_id: str, service: TaxService = Depends(get_tax_service)):
    return service.get_tax(tax_id)
