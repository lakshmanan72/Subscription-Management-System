"""
Product and Product Variant Schemas
Supports products with dynamic variants, cost margin calculations, and pricing adjustments.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class ProductVariantBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=64)
    price_adjustment: Decimal = Field(default=Decimal("0.00"), description="Additional price added to base price")


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseSchema):
    name: Optional[str] = None
    sku: Optional[str] = None
    price_adjustment: Optional[Decimal] = None


class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: Optional[str] = None
    created_at: Optional[datetime] = None


class ProductBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=64, description="Internal SKU or code")
    type: str = Field(default="Service", pattern="^(Service|Storable|Consumable)$")
    sales_price: Decimal = Field(..., ge=0)
    cost_price: Decimal = Field(..., ge=0)
    status: str = Field(default="Active", pattern="^(Active|Inactive|Draft)$")
    description: Optional[str] = None


class ProductCreate(ProductBase):
    variants: Optional[List[ProductVariantCreate]] = None


class ProductUpdate(BaseSchema):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[str] = None
    sales_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    status: Optional[str] = None
    description: Optional[str] = None
    variants: Optional[List[ProductVariantCreate]] = None


class ProductResponse(ProductBase):
    id: str
    variants: List[ProductVariantResponse] = []
    margin: Optional[Decimal] = None
    margin_percentage: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
