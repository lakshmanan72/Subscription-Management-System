"""
Subscription Schemas
Validates contract parameters, line items, status state transitions, and renewals.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class SubscriptionLineCreate(BaseSchema):
    product_id: str
    product_name: str
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)


class SubscriptionLineResponse(SubscriptionLineCreate):
    id: str
    subscription_id: Optional[str] = None
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal


class SubscriptionCreate(BaseSchema):
    customer_id: str
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    billing_frequency: str = Field(default="Monthly", pattern="^(Daily|Weekly|Monthly|Yearly)$")
    start_date: date
    expiry_date: Optional[date] = None
    payment_terms: str = "Net 15"
    status: str = Field(default="Draft", pattern="^(Draft|Quotation|Confirmed|Active|Paused|Closed)$")
    auto_renew: bool = True
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(..., ge=0)
    taxes: Decimal = Field(default=Decimal("18.00"), ge=0)
    lines: List[SubscriptionLineCreate] = Field(..., min_length=1)
    quotation_id: Optional[str] = None


class SubscriptionUpdate(BaseSchema):
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    billing_frequency: Optional[str] = None
    start_date: Optional[date] = None
    expiry_date: Optional[date] = None
    payment_terms: Optional[str] = None
    auto_renew: Optional[bool] = None
    quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None
    taxes: Optional[Decimal] = None
    lines: Optional[List[SubscriptionLineCreate]] = None


class UpdateStatusRequest(BaseSchema):
    status: str = Field(..., pattern="^(Draft|Quotation|Confirmed|Active|Paused|Closed)$")
    notes: Optional[str] = None


class RenewSubscriptionRequest(BaseSchema):
    extend_months: int = Field(default=12, ge=1)
    notes: Optional[str] = None


class SubscriptionResponse(BaseSchema):
    id: str
    subscription_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    billing_frequency: str
    start_date: date
    expiry_date: Optional[date] = None
    next_billing_date: Optional[date] = None
    payment_terms: str
    status: str
    auto_renew: bool
    quantity: int
    unit_price: Decimal
    taxes: Decimal
    total_amount: Decimal
    quotation_id: Optional[str] = None
    lines: List[SubscriptionLineResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
