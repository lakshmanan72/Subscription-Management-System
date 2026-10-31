from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class OutcomeContract(Base):
    __tablename__ = "outcome_contracts"

    id = Column(String(64), primary_key=True, index=True)
    contract_number = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True)
    product_id = Column(String(64), nullable=True)
    plan_id = Column(String(64), nullable=True)
    measurement_period = Column(String(32), default="Monthly", nullable=False)  # Monthly, Quarterly
    start_date = Column(String(32), nullable=False)
    end_date = Column(String(32), nullable=True)
    status = Column(String(32), default="Active", nullable=False)  # Draft, Active, UnderReview, Terminated
    credit_cap_percentage = Column(Float, default=50.0, nullable=False)  # Max % of invoice credit allowed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer_rel = relationship("Customer", back_populates="outcome_contracts")
    subscription_rel = relationship("Subscription", back_populates="outcome_contracts")
    metrics = relationship("ContractMetric", back_populates="contract_rel", cascade="all, delete-orphan")
    credits = relationship("ServiceCredit", back_populates="contract_rel", cascade="all, delete-orphan")


class ContractMetric(Base):
    __tablename__ = "contract_metrics"

    id = Column(String(64), primary_key=True, index=True)
    contract_id = Column(String(64), ForeignKey("outcome_contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name = Column(String(128), nullable=False)
    metric_key = Column(String(64), nullable=False)  # e.g., uptime_percent, latency_ms, response_time_hours
    target_value = Column(Float, nullable=False)
    tolerance = Column(Float, default=0.0, nullable=False)
    unit = Column(String(32), nullable=False)  # %, ms, hours, etc.
    comparison_operator = Column(String(8), default="GTE", nullable=False)  # GTE, LTE, EQ
    credit_rate_per_unit = Column(Float, default=5.0, nullable=False)  # % credit per breach unit
    max_credit_percentage = Column(Float, default=30.0, nullable=False)  # Cap for this metric

    contract_rel = relationship("OutcomeContract", back_populates="metrics")
    measurements = relationship("PerformanceMeasurement", back_populates="metric_rel", cascade="all, delete-orphan")


class PerformanceMeasurement(Base):
    __tablename__ = "performance_measurements"

    id = Column(String(64), primary_key=True, index=True)
    metric_id = Column(String(64), ForeignKey("contract_metrics.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(String(64), ForeignKey("outcome_contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    period_start = Column(String(32), nullable=False)
    period_end = Column(String(32), nullable=False)
    measured_value = Column(Float, nullable=False)
    target_value = Column(Float, nullable=False)
    is_breached = Column(Boolean, default=False, nullable=False)
    breach_magnitude = Column(Float, default=0.0, nullable=False)
    measurement_source = Column(String(32), default="AUTOMATED_TELEMETRY", nullable=False)  # AUTOMATED_TELEMETRY, MANUALLY_ENTERED
    evidence_notes = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    metric_rel = relationship("ContractMetric", back_populates="measurements")
    contract_rel = relationship("OutcomeContract")
    credit = relationship("ServiceCredit", back_populates="measurement_rel", uselist=False)


class ServiceCredit(Base):
    __tablename__ = "service_credits"

    id = Column(String(64), primary_key=True, index=True)
    credit_number = Column(String(64), unique=True, index=True, nullable=False)
    contract_id = Column(String(64), ForeignKey("outcome_contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_id = Column(String(64), ForeignKey("performance_measurements.id", ondelete="SET NULL"), unique=True, nullable=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    calculated_percentage = Column(Float, default=0.0, nullable=False)
    credit_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="Pending", nullable=False)  # Pending, Approved, Rejected, Applied
    reason = Column(Text, nullable=True)
    calculation_details = Column(Text, nullable=True)  # JSON explanation of formula
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contract_rel = relationship("OutcomeContract", back_populates="credits")
    measurement_rel = relationship("PerformanceMeasurement", back_populates="credit")
    customer_rel = relationship("Customer", back_populates="service_credits")
    subscription_rel = relationship("Subscription", back_populates="service_credits")
    invoice_rel = relationship("Invoice", back_populates="service_credits")
    approvals = relationship("ServiceCreditApproval", back_populates="credit_rel", cascade="all, delete-orphan", order_by="desc(ServiceCreditApproval.reviewed_at)")


class ServiceCreditApproval(Base):
    __tablename__ = "service_credit_approvals"

    id = Column(String(64), primary_key=True, index=True)
    credit_id = Column(String(64), ForeignKey("service_credits.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(64), nullable=True)
    reviewer_name = Column(String(128), nullable=False)
    action = Column(String(32), nullable=False)  # Approved, Rejected
    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    credit_rel = relationship("ServiceCredit", back_populates="approvals")
