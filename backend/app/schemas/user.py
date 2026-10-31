"""
User and Staff Schemas
Handles profile retrieval, staff member provisioning, and status management.
"""

from datetime import datetime
from typing import Optional
from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema


class UserBase(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    department: Optional[str] = None
    avatar: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: str = Field(default="CUSTOMER", description="User role: ADMIN, STAFF, or CUSTOMER")
    can_manage_staff: bool = Field(default=False)
    customer_id: Optional[str] = None


class StaffCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: str = Field(default="STAFF", description="STAFF role")
    can_manage_staff: bool = Field(default=False)


class UserUpdate(BaseSchema):
    name: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    role: str
    is_active: bool
    can_manage_staff: bool
    customer_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StaffResponse(UserResponse):
    pass
