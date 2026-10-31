from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# =========================================================================
# 1. CONTINUITY NETWORK SCHEMAS
# =========================================================================

class PortabilityRequestCreate(BaseModel):
    subscription_id: str
    destination_provider: str
    destination_account_id: Optional[str] = None


class PortabilityReviewRequest(BaseModel):
    action: str  # approve, reject
    rejection_reason: Optional[str] = None


class PortabilityCompleteRequest(BaseModel):
    external_reference: Optional[str] = None


class MigrationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_type: str
    actor_id: Optional[str] = None
    actor_name: str
    details: Optional[str] = None
    timestamp: datetime


class PortabilityRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: str
    portable_token: str
    subscription_snapshot: str
    schema_version: str
    export_checksum: str
    created_at: datetime


class PortabilityRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_number: str
    customer_id: str
    subscription_id: str
    origin_provider: str
    destination_provider: str
    destination_account_id: Optional[str] = None
    status: str
    plan_name: str
    billing_period: str
    prepaid_amount: float
    used_amount: float
    unused_value: float
    currency: str
    rejection_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    events: Optional[List[MigrationEventResponse]] = None
    portable_record: Optional[PortabilityRecordResponse] = None


# =========================================================================
# 2. SUBSCRIPTION LIFEBOAT SCHEMAS
# =========================================================================

class AdjustmentRequestCreate(BaseModel):
    subscription_id: str
    adjustment_type: str  # DOWNGRADE, PAUSE, PAYMENT_DEFERRAL
    reason: str
    duration_days: int = 30
    temporary_plan_id: Optional[str] = None
    temporary_unit_price: Optional[float] = None
    deferral_days: Optional[int] = 0


class AdjustmentReviewRequest(BaseModel):
    action: str  # approve, reject
    comments: Optional[str] = None


class AdjustmentApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    adjustment_id: str
    approver_id: Optional[str] = None
    approver_name: str
    action: str
    comments: Optional[str] = None
    decision_date: datetime


class AdjustmentHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    adjustment_id: str
    event_name: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: datetime


class SubscriptionAdjustmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    adjustment_number: str
    subscription_id: str
    customer_id: str
    adjustment_type: str
    status: str
    reason: Optional[str] = None
    start_date: str
    end_date: str
    duration_days: int
    original_plan_name: str
    original_plan_id: Optional[str] = None
    original_unit_price: float
    original_billing_frequency: str
    temporary_plan_name: Optional[str] = None
    temporary_plan_id: Optional[str] = None
    temporary_unit_price: float
    deferral_days: int
    deferred_obligation_amount: float
    financial_relief_amount: float
    is_restored: bool
    restored_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    approvals: Optional[List[AdjustmentApprovalResponse]] = None
    history: Optional[List[AdjustmentHistoryResponse]] = None


# =========================================================================
# 3. OUTCOME CONTRACTS SCHEMAS
# =========================================================================

class MetricCreate(BaseModel):
    metric_name: str
    metric_key: str
    target_value: float
    tolerance: float = 0.0
    unit: str = "%"
    comparison_operator: str = "GTE"  # GTE, LTE, EQ
    credit_rate_per_unit: float = 5.0
    max_credit_percentage: float = 30.0


class OutcomeContractCreate(BaseModel):
    title: str
    customer_id: str
    subscription_id: Optional[str] = None
    product_id: Optional[str] = None
    plan_id: Optional[str] = None
    measurement_period: str = "Monthly"
    start_date: str
    end_date: Optional[str] = None
    credit_cap_percentage: float = 50.0
    notes: Optional[str] = None
    metrics: List[MetricCreate] = []


class MeasurementRecordCreate(BaseModel):
    metric_id: str
    period_start: str
    period_end: str
    measured_value: float
    measurement_source: str = "AUTOMATED_TELEMETRY"  # AUTOMATED_TELEMETRY, MANUALLY_ENTERED
    evidence_notes: Optional[str] = None


class ServiceCreditReviewRequest(BaseModel):
    action: str  # approve, reject
    notes: Optional[str] = None


class ServiceCreditApplyRequest(BaseModel):
    invoice_id: Optional[str] = None


class ContractMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contract_id: str
    metric_name: str
    metric_key: str
    target_value: float
    tolerance: float
    unit: str
    comparison_operator: str
    credit_rate_per_unit: float
    max_credit_percentage: float


class PerformanceMeasurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    metric_id: str
    contract_id: str
    period_start: str
    period_end: str
    measured_value: float
    target_value: float
    is_breached: bool
    breach_magnitude: float
    measurement_source: str
    evidence_notes: Optional[str] = None
    evaluated_at: datetime


class ServiceCreditApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    credit_id: str
    reviewer_id: Optional[str] = None
    reviewer_name: str
    action: str
    notes: Optional[str] = None
    reviewed_at: datetime


class ServiceCreditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    credit_number: str
    contract_id: str
    measurement_id: Optional[str] = None
    subscription_id: str
    customer_id: str
    invoice_id: Optional[str] = None
    calculated_percentage: float
    credit_amount: float
    status: str
    reason: Optional[str] = None
    calculation_details: Optional[str] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    approvals: Optional[List[ServiceCreditApprovalResponse]] = None


class OutcomeContractResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contract_number: str
    title: str
    customer_id: str
    subscription_id: Optional[str] = None
    product_id: Optional[str] = None
    plan_id: Optional[str] = None
    measurement_period: str
    start_date: str
    end_date: Optional[str] = None
    status: str
    credit_cap_percentage: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    metrics: Optional[List[ContractMetricResponse]] = None
    credits: Optional[List[ServiceCreditResponse]] = None


# =========================================================================
# 4. OUTCOME EXCHANGE SCHEMAS
# =========================================================================

class ProviderProfileCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    rating: float = 4.8
    verified_status: bool = False
    verification_badge: str = "Standard"
    active_subscribers_count: int = 0
    uptime_guarantee: float = 99.9
    logo_url: Optional[str] = None


class OfferingCommitmentCreate(BaseModel):
    metric_name: str
    target_value: float
    unit: str = "%"
    tolerance: float = 0.0
    credit_guarantee_percent: float = 15.0
    is_verified_by_telemetry: bool = False
    commitment_type: str = "SLA"


class SubscriptionOfferingCreate(BaseModel):
    provider_id: str
    product_id: Optional[str] = None
    plan_id: Optional[str] = None
    title: str
    tier: str = "Growth"
    description: Optional[str] = None
    pricing_model: str = "Flat Monthly"
    unit_price: float = 0.0
    billing_frequency: str = "Monthly"
    terms_conditions: Optional[str] = None
    credit_policy: Optional[str] = None
    included_features: Optional[List[str]] = None
    is_active: bool = True
    is_featured: bool = False
    commitments: List[OfferingCommitmentCreate] = []


class OfferingInterestRequestCreate(BaseModel):
    offering_id: str
    custom_notes: Optional[str] = None


class OfferingCommitmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    offering_id: str
    metric_name: str
    target_value: float
    unit: str
    tolerance: float
    credit_guarantee_percent: float
    is_verified_by_telemetry: bool
    commitment_type: str


class ProviderProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    rating: float
    verified_status: bool
    verification_badge: str
    active_subscribers_count: int
    uptime_guarantee: float
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SubscriptionOfferingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider_id: str
    product_id: Optional[str] = None
    plan_id: Optional[str] = None
    title: str
    tier: str
    description: Optional[str] = None
    pricing_model: str
    unit_price: float
    billing_frequency: str
    terms_conditions: Optional[str] = None
    credit_policy: Optional[str] = None
    included_features: Optional[str] = None
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    provider_rel: Optional[ProviderProfileResponse] = None
    commitments: Optional[List[OfferingCommitmentResponse]] = None


class OfferingInterestRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_number: str
    offering_id: str
    customer_id: str
    quotation_id: Optional[str] = None
    subscription_id: Optional[str] = None
    status: str
    custom_notes: Optional[str] = None
    quoted_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    offering_rel: Optional[SubscriptionOfferingResponse] = None
