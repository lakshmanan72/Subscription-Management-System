from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class PortabilityRequest(Base):
    __tablename__ = "portability_requests"

    id = Column(String(64), primary_key=True, index=True)
    request_number = Column(String(64), unique=True, index=True, nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    origin_provider = Column(String(128), default="Brightloop Software", nullable=False)
    destination_provider = Column(String(128), nullable=False)
    destination_account_id = Column(String(128), nullable=True)
    status = Column(String(32), default="Pending", nullable=False)  # Pending, Approved, Rejected, Completed, Cancelled
    plan_name = Column(String(255), nullable=False)
    billing_period = Column(String(32), default="Monthly", nullable=False)
    prepaid_amount = Column(Float, default=0.0, nullable=False)
    used_amount = Column(Float, default=0.0, nullable=False)
    unused_value = Column(Float, default=0.0, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(String(128), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer_rel = relationship("Customer", back_populates="portability_requests")
    subscription_rel = relationship("Subscription", back_populates="portability_requests")
    portable_record = relationship("PortabilityRecord", back_populates="request_rel", uselist=False, cascade="all, delete-orphan")
    events = relationship("SubscriptionMigrationEvent", back_populates="request_rel", cascade="all, delete-orphan", order_by="desc(SubscriptionMigrationEvent.timestamp)")


class PortabilityRecord(Base):
    __tablename__ = "portability_records"

    id = Column(String(64), primary_key=True, index=True)
    request_id = Column(String(64), ForeignKey("portability_requests.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    portable_token = Column(String(128), unique=True, index=True, nullable=False)
    subscription_snapshot = Column(Text, nullable=False)  # JSON snapshot
    schema_version = Column(String(16), default="1.0", nullable=False)
    export_checksum = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    request_rel = relationship("PortabilityRequest", back_populates="portable_record")


class SubscriptionMigrationEvent(Base):
    __tablename__ = "subscription_migration_events"

    id = Column(String(64), primary_key=True, index=True)
    request_id = Column(String(64), ForeignKey("portability_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    actor_id = Column(String(64), nullable=True)
    actor_name = Column(String(128), default="System", nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    request_rel = relationship("PortabilityRequest", back_populates="events")
