"""
Discount Schemas
Validates promotional rules and live coupon calculation requests.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Union, List
from pydantic import Field

from app.schemas.common import BaseSchema


class DiscountBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=64)
    type: str = Field(default="percentage", pattern="^(percentage|fixed)$")
    value: Decimal = Field(..., gt=0)
    min_purchase: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_quantity: int = Field(default=1, ge=1)
    applicable_products: str = "all"
    applicable_subscriptions: str = "all"
    start_date: date
    end_date: date
    usage_limit: int = Field(default=100, ge=1)
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")
    description: Optional[str] = None


class DiscountCreate(DiscountBase):
    pass


class DiscountUpdate(BaseSchema):
    name: Optional[str] = None
    type: Optional[str] = None
    value: Optional[Decimal] = None
    min_purchase: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    applicable_products: Optional[str] = None
    applicable_subscriptions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    usage_limit: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None


class DiscountResponse(DiscountBase):
    id: str
    usage_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DiscountCalculationRequest(BaseSchema):
    code: str = Field(..., description="Discount or promotional code")
    amount: Decimal = Field(..., ge=0, description="Order subtotal to test discount against")
    quantity: int = Field(default=1, ge=1)
    product_id: Optional[str] = None


class DiscountCalculationResponse(BaseSchema):
    is_valid: bool
    code: str
    discount_amount: Decimal
    final_amount: Decimal
    reason: Optional[str] = None
