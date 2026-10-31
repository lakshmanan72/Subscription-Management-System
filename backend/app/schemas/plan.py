"""
Subscription Plan Schemas
Handles configuration of recurring cadences, pricing, order thresholds, and lifecycle permissions.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class PlanBase(BaseSchema):
    plan_name: str = Field(..., min_length=2, max_length=255)
    product_id: str
    billing_frequency: str = Field(..., pattern="^(Daily|Weekly|Monthly|Yearly)$")
    price: Decimal = Field(..., ge=0)
    min_quantity: int = Field(default=1, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: bool = False
    allow_early_closure: bool = True
    allow_pause: bool = True
    allow_renewal: bool = True
    status: str = Field(default="Active", pattern="^(Active|Disabled|Archived)$")
    description: Optional[str] = None


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseSchema):
    plan_name: Optional[str] = None
    product_id: Optional[str] = None
    billing_frequency: Optional[str] = None
    price: Optional[Decimal] = None
    min_quantity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: Optional[bool] = None
    allow_early_closure: Optional[bool] = None
    allow_pause: Optional[bool] = None
    allow_renewal: Optional[bool] = None
    status: Optional[str] = None
    description: Optional[str] = None


class PlanResponse(PlanBase):
    id: str
    product_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
