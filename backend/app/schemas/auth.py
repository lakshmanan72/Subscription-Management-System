"""
Authentication Schemas
Defines request and response bodies for login, customer registration, JWT tokens,
and password reset workflows.
"""

from typing import Optional
from pydantic import EmailStr, Field, field_validator

from app.core.security import validate_password_strength
from app.schemas.common import BaseSchema


class LoginRequest(BaseSchema):
    email: str = Field(..., description="User corporate or client email")
    password: str = Field(..., description="User password")


class LoginResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str
    customer_id: Optional[str] = None
    company: Optional[str] = None
    avatar: Optional[str] = None


class RegisterCustomerRequest(BaseSchema):
    name: str = Field(..., min_length=2, max_length=255, description="Full Name")
    email: EmailStr = Field(..., description="Business Email Address")
    password: str = Field(..., min_length=8, description="Secure Password")
    company: str = Field(..., min_length=2, max_length=255, description="Company / Organization Name")
    phone: Optional[str] = Field(None, max_length=64, description="Contact Phone")
    gstin: Optional[str] = Field(None, max_length=15, description="Indian GSTIN Number")
    address: Optional[str] = Field(None, max_length=512, description="Billing Address")
    city: Optional[str] = Field(None, max_length=128, description="City")
    state: Optional[str] = Field(None, max_length=128, description="State / Province")

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v


class ForgotPasswordRequest(BaseSchema):
    email: EmailStr = Field(..., description="Registered Email Address")


class ResetPasswordRequest(BaseSchema):
    token: str = Field(..., description="Password reset verification token")
    new_password: str = Field(..., min_length=8, description="New secure password")

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v


class TokenPayload(BaseSchema):
    sub: str  # user_id
    email: str
    role: str
    name: Optional[str] = None
    customer_id: Optional[str] = None
    exp: Optional[int] = None
