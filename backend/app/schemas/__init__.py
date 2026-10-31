"""
Brightloop Pydantic Schemas Export
"""

from app.schemas.common import BaseSchema, MessageResponse, PaginationParams, PaginatedResponse, HealthResponse
from app.schemas.auth import (
    LoginRequest, LoginResponse, RegisterCustomerRequest, ForgotPasswordRequest,
    ResetPasswordRequest, TokenPayload
)
from app.schemas.user import UserCreate, StaffCreate, UserUpdate, UserResponse, StaffResponse
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.product import (
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    ProductCreate, ProductUpdate, ProductResponse
)
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.schemas.quotation import (
    QuotationLineCreate, QuotationLineResponse, QuotationCreate,
    QuotationUpdate, QuotationResponse, ConvertQuotationRequest
)
from app.schemas.subscription import (
    SubscriptionLineCreate, SubscriptionLineResponse, SubscriptionCreate,
    SubscriptionUpdate, SubscriptionResponse, UpdateStatusRequest, RenewSubscriptionRequest
)
from app.schemas.invoice import (
    InvoiceLineCreate, InvoiceLineResponse, InvoiceCreate, InvoiceUpdate,
    InvoiceResponse, RecordInvoicePaymentRequest
)
from app.schemas.payment import PaymentRecordRequest, PaymentResponse
from app.schemas.discount import (
    DiscountCreate, DiscountUpdate, DiscountResponse,
    DiscountCalculationRequest, DiscountCalculationResponse
)
from app.schemas.tax import TaxCreate, TaxUpdate, TaxResponse
from app.schemas.dashboard import AdminDashboardResponse, StaffDashboardResponse, CustomerDashboardResponse

__all__ = [
    "BaseSchema", "MessageResponse", "PaginationParams", "PaginatedResponse", "HealthResponse",
    "LoginRequest", "LoginResponse", "RegisterCustomerRequest", "ForgotPasswordRequest", "ResetPasswordRequest", "TokenPayload",
    "UserCreate", "StaffCreate", "UserUpdate", "UserResponse", "StaffResponse",
    "CustomerCreate", "CustomerUpdate", "CustomerResponse",
    "ProductVariantCreate", "ProductVariantUpdate", "ProductVariantResponse", "ProductCreate", "ProductUpdate", "ProductResponse",
    "PlanCreate", "PlanUpdate", "PlanResponse",
    "QuotationLineCreate", "QuotationLineResponse", "QuotationCreate", "QuotationUpdate", "QuotationResponse", "ConvertQuotationRequest",
    "SubscriptionLineCreate", "SubscriptionLineResponse", "SubscriptionCreate", "SubscriptionUpdate", "SubscriptionResponse", "UpdateStatusRequest", "RenewSubscriptionRequest",
    "InvoiceLineCreate", "InvoiceLineResponse", "InvoiceCreate", "InvoiceUpdate", "InvoiceResponse", "RecordInvoicePaymentRequest",
    "PaymentRecordRequest", "PaymentResponse",
    "DiscountCreate", "DiscountUpdate", "DiscountResponse", "DiscountCalculationRequest", "DiscountCalculationResponse",
    "TaxCreate", "TaxUpdate", "TaxResponse",
    "AdminDashboardResponse", "StaffDashboardResponse", "CustomerDashboardResponse",
]
