from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class SubscriptionAdjustment(Base):
    __tablename__ = "subscription_adjustments"

    id = Column(String(64), primary_key=True, index=True)
    adjustment_number = Column(String(64), unique=True, index=True, nullable=False)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    adjustment_type = Column(String(32), nullable=False)  # DOWNGRADE, PAUSE, PAYMENT_DEFERRAL
    status = Column(String(32), default="Pending", nullable=False)  # Pending, Approved, Rejected, Active, Restored, Cancelled
    reason = Column(Text, nullable=True)
    start_date = Column(String(32), nullable=False)
    end_date = Column(String(32), nullable=False)  # Expected restoration date
    duration_days = Column(Integer, default=30, nullable=False)
    original_plan_name = Column(String(255), nullable=False)
    original_plan_id = Column(String(64), nullable=True)
    original_unit_price = Column(Float, default=0.0, nullable=False)
    original_billing_frequency = Column(String(32), default="Monthly", nullable=False)
    temporary_plan_name = Column(String(255), nullable=True)
    temporary_plan_id = Column(String(64), nullable=True)
    temporary_unit_price = Column(Float, default=0.0, nullable=False)
    deferral_days = Column(Integer, default=0, nullable=False)
    deferred_obligation_amount = Column(Float, default=0.0, nullable=False)
    financial_relief_amount = Column(Float, default=0.0, nullable=False)
    is_restored = Column(Boolean, default=False, nullable=False)
    restored_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    subscription_rel = relationship("Subscription", back_populates="adjustments")
    customer_rel = relationship("Customer", back_populates="adjustments")
    approvals = relationship("AdjustmentApproval", back_populates="adjustment_rel", cascade="all, delete-orphan", order_by="desc(AdjustmentApproval.decision_date)")
    history = relationship("AdjustmentHistory", back_populates="adjustment_rel", cascade="all, delete-orphan", order_by="desc(AdjustmentHistory.recorded_at)")


class AdjustmentApproval(Base):
    __tablename__ = "adjustment_approvals"

    id = Column(String(64), primary_key=True, index=True)
    adjustment_id = Column(String(64), ForeignKey("subscription_adjustments.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_id = Column(String(64), nullable=True)
    approver_name = Column(String(128), nullable=False)
    action = Column(String(32), nullable=False)  # Approved, Rejected, Modified
    comments = Column(Text, nullable=True)
    decision_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    adjustment_rel = relationship("SubscriptionAdjustment", back_populates="approvals")


class AdjustmentHistory(Base):
    __tablename__ = "adjustment_histories"

    id = Column(String(64), primary_key=True, index=True)
    adjustment_id = Column(String(64), ForeignKey("subscription_adjustments.id", ondelete="CASCADE"), nullable=False, index=True)
    event_name = Column(String(64), nullable=False)
    previous_state = Column(String(128), nullable=True)
    new_state = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    adjustment_rel = relationship("SubscriptionAdjustment", back_populates="history")
