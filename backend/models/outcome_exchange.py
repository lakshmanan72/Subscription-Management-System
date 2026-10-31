from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    slug = Column(String(128), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    rating = Column(Float, default=4.8, nullable=False)
    verified_status = Column(Boolean, default=False, nullable=False)  # Distinguishes verified vs unverified
    verification_badge = Column(String(64), default="Standard", nullable=False)
    active_subscribers_count = Column(Integer, default=0, nullable=False)
    uptime_guarantee = Column(Float, default=99.9, nullable=False)
    logo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    offerings = relationship("SubscriptionOffering", back_populates="provider_rel", cascade="all, delete-orphan")


class SubscriptionOffering(Base):
    __tablename__ = "subscription_offerings"

    id = Column(String(64), primary_key=True, index=True)
    provider_id = Column(String(64), ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    plan_id = Column(String(64), ForeignKey("plans.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    tier = Column(String(64), default="Growth", nullable=False)  # Starter, Growth, Enterprise, Mission-Critical
    description = Column(Text, nullable=True)
    pricing_model = Column(String(64), default="Flat Monthly", nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    billing_frequency = Column(String(32), default="Monthly", nullable=False)
    terms_conditions = Column(Text, nullable=True)
    credit_policy = Column(Text, nullable=True)
    included_features = Column(Text, nullable=True)  # JSON array string
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    provider_rel = relationship("ProviderProfile", back_populates="offerings")
    product_rel = relationship("Product")
    plan_rel = relationship("Plan")
    commitments = relationship("OfferingCommitment", back_populates="offering_rel", cascade="all, delete-orphan")
    interest_requests = relationship("OfferingInterestRequest", back_populates="offering_rel", cascade="all, delete-orphan")


class OfferingCommitment(Base):
    __tablename__ = "offering_commitments"

    id = Column(String(64), primary_key=True, index=True)
    offering_id = Column(String(64), ForeignKey("subscription_offerings.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name = Column(String(128), nullable=False)  # e.g., Availability SLA, P99 Latency SLA
    target_value = Column(Float, nullable=False)
    unit = Column(String(32), nullable=False)  # %, ms, min
    tolerance = Column(Float, default=0.0, nullable=False)
    credit_guarantee_percent = Column(Float, default=15.0, nullable=False)
    is_verified_by_telemetry = Column(Boolean, default=False, nullable=False)
    commitment_type = Column(String(64), default="SLA", nullable=False)

    offering_rel = relationship("SubscriptionOffering", back_populates="commitments")


class OfferingInterestRequest(Base):
    __tablename__ = "offering_interest_requests"

    id = Column(String(64), primary_key=True, index=True)
    request_number = Column(String(64), unique=True, index=True, nullable=False)
    offering_id = Column(String(64), ForeignKey("subscription_offerings.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    quotation_id = Column(String(64), ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(32), default="Pending", nullable=False)  # Pending, Quoted, Accepted, Converted, Declined
    custom_notes = Column(Text, nullable=True)
    quoted_price = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    offering_rel = relationship("SubscriptionOffering", back_populates="interest_requests")
    customer_rel = relationship("Customer", back_populates="interest_requests")
    quotation_rel = relationship("Quotation", back_populates="offering_interest_requests")
