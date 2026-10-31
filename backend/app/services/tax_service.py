"""
Tax Service
Manages GST tax tier configurations and provides default tax rates.
"""

from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import EntityNotFoundException
from app.models.tax import Tax
from app.repositories import TaxRepository
from app.schemas.tax import TaxCreate, TaxUpdate


class TaxService:
    def __init__(self, tax_repo: TaxRepository):
        self.tax_repo = tax_repo

    def list_taxes(self) -> List[Tax]:
        return self.tax_repo.get_all()

    def get_tax(self, tax_id: str) -> Tax:
        tax = self.tax_repo.get_by_id(tax_id)
        if not tax:
            raise EntityNotFoundException("Tax", tax_id)
        return tax

    def get_default_tax_rate(self) -> Decimal:
        default_tax = self.tax_repo.get_default()
        if default_tax:
            return default_tax.rate
        return Decimal("18.00")  # Standard Indian GST

    def create_tax(self, request: TaxCreate) -> Tax:
        tax_id = f"tax-{uuid.uuid4().hex[:6]}"
        new_tax = Tax(
            id=tax_id,
            name=request.name.strip(),
            rate=request.rate,
            is_default=request.is_default,
            applies_to=request.applies_to,
            status=request.status
        )
        return self.tax_repo.create(new_tax)
