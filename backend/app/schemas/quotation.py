"""
Quotation Schemas
Validates quotation lines, multi-product proposals, discounts, GST rates, and 1-click conversion.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class QuotationLineCreate(BaseSchema):
    product_id: str
    product_name: str
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)


class QuotationLineResponse(QuotationLineCreate):
    id: str
    quotation_id: Optional[str] = None
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal


class QuotationCreate(BaseSchema):
    customer_id: str
    template_name: Optional[str] = None
    date: date
    validity_date: date
    status: str = Field(default="Draft", pattern="^(Draft|Quotation|Confirmed|Cancelled)$")
    lines: List[QuotationLineCreate] = Field(..., min_length=1)
    discount: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    notes: Optional[str] = None


class QuotationUpdate(BaseSchema):
    customer_id: Optional[str] = None
    template_name: Optional[str] = None
    date: Optional[date] = None
    validity_date: Optional[date] = None
    status: Optional[str] = None
    lines: Optional[List[QuotationLineCreate]] = None
    discount: Optional[Decimal] = None
    notes: Optional[str] = None


class QuotationResponse(BaseSchema):
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    template_name: Optional[str] = None
    date: date
    validity_date: date
    status: str
    converted_subscription_id: Optional[str] = None
    subtotal: Decimal
    tax: Decimal
    discount: Decimal
    total: Decimal
    notes: Optional[str] = None
    lines: List[QuotationLineResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ConvertQuotationRequest(BaseSchema):
    payment_terms: Optional[str] = "Net 15"
    start_date: Optional[date] = None
    auto_renew: bool = True
