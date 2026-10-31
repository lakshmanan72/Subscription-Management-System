"""
Customer Schemas
Represents client directory entries, GST compliance details, and balance summaries.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema


class CustomerBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255)
    company: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    avatar: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseSchema):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None
    avatar: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: str
    status: str
    outstanding_balance: Decimal
    is_portal_demo_user: bool = False
    active_subscriptions_count: Optional[int] = 0
    total_invoices_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
