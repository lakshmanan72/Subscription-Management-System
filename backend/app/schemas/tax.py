"""
Tax Schemas
Handles GST rate configuration, intra/inter-state tax tiers, and default assignments.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class TaxBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255)
    rate: Decimal = Field(..., ge=0, le=100)
    is_default: bool = False
    applies_to: str = Field(default="Intra-state sales")
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")


class TaxCreate(TaxBase):
    pass


class TaxUpdate(BaseSchema):
    name: Optional[str] = None
    rate: Optional[Decimal] = None
    is_default: Optional[bool] = None
    applies_to: Optional[str] = None
    status: Optional[str] = None


class TaxResponse(TaxBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
