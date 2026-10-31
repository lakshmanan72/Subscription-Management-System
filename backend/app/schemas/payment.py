"""
Payment Schemas
Validates payment records, settlement references, and reconciliation against outstanding invoices.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class PaymentRecordRequest(BaseSchema):
    invoice_id: str = Field(..., description="Target invoice ID to settle")
    customer_id: Optional[str] = None
    amount: Decimal = Field(..., gt=0, description="Payment amount in INR")
    payment_method: str = Field(default="UPI", pattern="^(UPI|Card|Bank transfer|Cash|Other)$")
    payment_date: Optional[date] = None
    transaction_id: Optional[str] = Field(None, max_length=128, description="Gateway transaction reference / UTR")
    notes: Optional[str] = None


class PaymentResponse(BaseSchema):
    id: str
    payment_reference: str
    customer_id: str
    customer_name: Optional[str] = None
    invoice_id: str
    invoice_number: Optional[str] = None
    payment_method: str
    amount: Decimal
    payment_date: date
    transaction_id: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
