"""
Invoice Schemas
Validates tax invoicing fields, GST splits (CGST, SGST, IGST), payment statuses, and balances.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import Field

from app.schemas.common import BaseSchema


class InvoiceLineCreate(BaseSchema):
    description: str = Field(..., min_length=2, max_length=512)
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(..., ge=0)
    tax_rate: Decimal = Field(default=Decimal("18.00"), ge=0)
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    sac_code: Optional[str] = "998313"


class InvoiceLineResponse(InvoiceLineCreate):
    id: str
    invoice_id: Optional[str] = None
    amount: Decimal
    tax_amount: Decimal


class InvoiceCreate(BaseSchema):
    customer_id: str
    subscription_id: Optional[str] = None
    invoice_date: date
    due_date: date
    status: str = Field(default="Draft", pattern="^(Draft|Confirmed|Partially Paid|Paid|Overdue|Cancelled)$")
    payment_terms: str = "Net 15"
    discount: Decimal = Field(default=Decimal("0.00"), ge=0)
    is_interstate: bool = False
    notes: Optional[str] = None
    lines: List[InvoiceLineCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseSchema):
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseSchema):
    id: str
    invoice_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gst: Optional[str] = None
    subscription_id: Optional[str] = None
    subscription_number: Optional[str] = None
    invoice_date: date
    due_date: date
    subtotal: Decimal
    tax: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal
    discount: Decimal
    total: Decimal
    paid_amount: Decimal
    outstanding_amount: Decimal
    status: str
    payment_terms: str
    notes: Optional[str] = None
    lines: List[InvoiceLineResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RecordInvoicePaymentRequest(BaseSchema):
    amount: Decimal = Field(..., gt=0, description="Amount paid in INR")
    payment_method: str = Field(default="UPI", pattern="^(UPI|Card|Bank transfer|Cash|Other)$")
    payment_date: Optional[date] = None
    transaction_id: Optional[str] = Field(None, description="Bank UTR or gateway payment ID")
    notes: Optional[str] = None
