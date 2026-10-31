from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ==========================================
# AUTH SCHEMAS
# ==========================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8)
    company: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company: Optional[str] = None
    avatar: Optional[str] = None
    customer_id: Optional[str] = None
    is_customer: bool = False

    class Config:
        from_attributes = True


# ==========================================
# PRODUCT & VARIANT SCHEMAS
# ==========================================
class ProductVariantBase(BaseModel):
    name: str
    price_adjustment: float = 0.0
    sku: str


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: str

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    code: str
    type: str = "Service"
    sales_price: float
    cost_price: float = 0.0
    status: str = "Active"
    description: Optional[str] = None


class ProductCreate(ProductBase):
    variants: Optional[List[ProductVariantCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[str] = None
    sales_price: Optional[float] = None
    cost_price: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None
    variants: Optional[List[ProductVariantCreate]] = None


class ProductResponse(ProductBase):
    id: str
    variants: List[ProductVariantResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# PLAN SCHEMAS
# ==========================================
class PlanBase(BaseModel):
    plan_name: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    billing_frequency: str = "Monthly"
    price: float
    min_quantity: int = 1
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    auto_close: bool = False
    allow_early_closure: bool = True
    allow_pause: bool = True
    allow_renewal: bool = True
    status: str = "Active"
    description: Optional[str] = None


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    billing_frequency: Optional[str] = None
    price: Optional[float] = None
    min_quantity: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    auto_close: Optional[bool] = None
    allow_early_closure: Optional[bool] = None
    allow_pause: Optional[bool] = None
    allow_renewal: Optional[bool] = None
    status: Optional[str] = None
    description: Optional[str] = None


class PlanResponse(PlanBase):
    id: str

    class Config:
        from_attributes = True


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    name: str
    company: str
    email: EmailStr
    phone: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "India"
    avatar: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    avatar: Optional[str] = None
    outstanding_balance: Optional[float] = None


class CustomerResponse(CustomerBase):
    id: str
    registration_date: str
    active_subscriptions_count: int = 0
    total_invoices_count: int = 0
    outstanding_balance: float = 0.0
    is_portal_demo_user: bool = False

    class Config:
        from_attributes = True


# ==========================================
# QUOTATION SCHEMAS
# ==========================================
class QuotationLineBase(BaseModel):
    product_name: str
    product_id: Optional[str] = None
    plan_name: Optional[str] = None
    plan_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    tax_rate: float = 18.0
    discount: float = 0.0
    total: float = 0.0


class QuotationLineCreate(QuotationLineBase):
    pass


class QuotationLineResponse(QuotationLineBase):
    id: str
    quotation_id: str

    class Config:
        from_attributes = True


class QuotationBase(BaseModel):
    customer: str
    customer_id: str
    template_name: Optional[str] = None
    date: str
    validity_date: Optional[str] = None
    status: str = "Draft"
    subtotal: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None


class QuotationCreate(QuotationBase):
    lines: Optional[List[QuotationLineCreate]] = None


class QuotationUpdate(BaseModel):
    customer: Optional[str] = None
    customer_id: Optional[str] = None
    template_name: Optional[str] = None
    date: Optional[str] = None
    validity_date: Optional[str] = None
    status: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    lines: Optional[List[QuotationLineCreate]] = None


class QuotationResponse(QuotationBase):
    id: str
    lines: List[QuotationLineResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# SUBSCRIPTION SCHEMAS
# ==========================================
class SubscriptionLineBase(BaseModel):
    product_name: str
    variant_name: Optional[str] = None
    plan_name: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    tax_rate: float = 18.0
    subtotal: float = 0.0
    total: float = 0.0


class SubscriptionLineCreate(SubscriptionLineBase):
    pass


class SubscriptionLineResponse(SubscriptionLineBase):
    id: str
    subscription_id: str

    class Config:
        from_attributes = True


class SubscriptionTimelineResponse(BaseModel):
    id: str
    subscription_id: str
    timestamp: str
    title: str
    description: Optional[str] = None
    user: str
    type: str

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    subscription_number: Optional[str] = None
    customer: str
    customer_id: str
    customer_email: Optional[str] = None
    plan: str
    plan_id: Optional[str] = None
    product: str
    product_id: Optional[str] = None
    billing_frequency: str = "Monthly"
    start_date: str
    expiry_date: Optional[str] = None
    payment_terms: str = "Net 15"
    quantity: int = 1
    unit_price: float = 0.0
    taxes: float = 18.0
    total_amount: float = 0.0
    status: str = "Draft"
    next_billing_date: Optional[str] = None
    auto_renew: bool = True


class SubscriptionCreate(SubscriptionBase):
    product_lines: Optional[List[SubscriptionLineCreate]] = None


class SubscriptionUpdate(BaseModel):
    customer: Optional[str] = None
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    plan: Optional[str] = None
    plan_id: Optional[str] = None
    product: Optional[str] = None
    product_id: Optional[str] = None
    billing_frequency: Optional[str] = None
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    payment_terms: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    taxes: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    next_billing_date: Optional[str] = None
    auto_renew: Optional[bool] = None


class SubscriptionStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


class SubscriptionResponse(SubscriptionBase):
    id: str
    product_lines: List[SubscriptionLineResponse] = []
    activity_timeline: List[SubscriptionTimelineResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# INVOICE SCHEMAS
# ==========================================
class InvoiceLineBase(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float = 0.0
    amount: float = 0.0


class InvoiceLineCreate(InvoiceLineBase):
    pass


class InvoiceLineResponse(InvoiceLineBase):
    id: str
    invoice_id: str

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    customer: str
    customer_id: str
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gst: Optional[str] = None
    subscription: Optional[str] = None
    subscription_id: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    subtotal: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    paid_amount: float = 0.0
    outstanding_amount: float = 0.0
    status: str = "Draft"
    payment_terms: str = "Net 15"
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    lines: Optional[List[InvoiceLineCreate]] = None


class InvoiceResponse(InvoiceBase):
    id: str
    lines: List[InvoiceLineResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# PAYMENT SCHEMAS
# ==========================================
class PaymentCreate(BaseModel):
    invoice_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: float
    payment_method: str = "UPI"
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    payment_reference: str
    customer: str
    customer_id: str
    invoice: Optional[str] = None
    invoice_id: Optional[str] = None
    payment_method: str
    amount: float
    payment_date: str
    transaction_id: Optional[str] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# DISCOUNT SCHEMAS
# ==========================================
class DiscountBase(BaseModel):
    name: str
    code: str
    type: str = "percentage"
    value: float
    min_purchase: float = 0.0
    min_quantity: int = 1
    applicable_products: str = "all"
    applicable_subscriptions: str = "all"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    usage_limit: int = 100
    usage_count: int = 0
    status: str = "Active"
    description: Optional[str] = None


class DiscountCreate(DiscountBase):
    pass


class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    min_quantity: Optional[int] = None
    applicable_products: Optional[str] = None
    applicable_subscriptions: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    usage_limit: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None


class DiscountResponse(DiscountBase):
    id: str

    class Config:
        from_attributes = True


class DiscountValidateRequest(BaseModel):
    code: str
    subtotal: float
    quantity: int = 1
    product_id: Optional[str] = None
    subscription_id: Optional[str] = None


class DiscountValidateResponse(BaseModel):
    valid: bool
    message: str
    discount_amount: float = 0.0
    final_amount: Optional[float] = None
    discount_code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None


# ==========================================
# STAFF & SETTINGS SCHEMAS
# ==========================================
class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "Sales Representative"
    department: str = "Growth"
    password: Optional[str] = "Staff@Brightloop123!"
    can_manage_staff: bool = False


class StaffResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    role: str
    department: str
    status: str
    last_active: str
    can_manage_staff: bool

    class Config:
        from_attributes = True


class TaxConfigBase(BaseModel):
    name: str
    rate: float
    is_default: bool = False
    applies_to: Optional[str] = None


class TaxConfigCreate(TaxConfigBase):
    pass


class TaxConfigResponse(TaxConfigBase):
    id: str

    class Config:
        from_attributes = True


class CompanySettingUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    tax_id: Optional[str] = None
    pan: Optional[str] = None
    email: Optional[EmailStr] = None
    support_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    timezone: Optional[str] = None


class CompanySettingResponse(BaseModel):
    name: str
    legal_name: str
    tax_id: Optional[str] = None
    pan: Optional[str] = None
    email: str
    support_email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    currency: str
    currency_symbol: str
    timezone: str

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    email_on_invoice_created: Optional[bool] = None
    email_on_payment_success: Optional[bool] = None
    email_on_subscription_expiry: Optional[bool] = None
    sms_alerts_for_overdue: Optional[bool] = None
    slack_webhook_enabled: Optional[bool] = None
    slack_webhook_url: Optional[str] = None
    daily_summary_digest: Optional[bool] = None


class NotificationPreferenceResponse(BaseModel):
    email_on_invoice_created: bool
    email_on_payment_success: bool
    email_on_subscription_expiry: bool
    sms_alerts_for_overdue: bool
    slack_webhook_enabled: bool
    slack_webhook_url: Optional[str] = None
    daily_summary_digest: bool

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True
