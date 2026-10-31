from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True, index=True)
    subscription_number = Column(String(64), unique=True, index=True, nullable=False)
    customer = Column(String(255), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    plan = Column(String(255), nullable=False)
    plan_id = Column(String(64), nullable=True)
    product = Column(String(255), nullable=False)
    product_id = Column(String(64), nullable=True)
    billing_frequency = Column(String(32), default="Monthly", nullable=False)  # Daily, Weekly, Monthly, Yearly
    start_date = Column(String(32), nullable=False)
    expiry_date = Column(String(32), nullable=True)
    payment_terms = Column(String(64), default="Net 15", nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    taxes = Column(Float, default=18.0, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="Draft", nullable=False)  # Draft, Quotation, Confirmed, Active, Paused, Closed
    next_billing_date = Column(String(32), nullable=True)
    auto_renew = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer_rel = relationship("Customer", back_populates="subscriptions")
    product_lines = relationship("SubscriptionLine", back_populates="subscription_rel", cascade="all, delete-orphan", lazy="joined")
    activity_timeline = relationship("SubscriptionTimeline", back_populates="subscription_rel", cascade="all, delete-orphan", lazy="joined", order_by="desc(SubscriptionTimeline.id)")
    invoices = relationship("Invoice", back_populates="subscription_rel")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(String(64), primary_key=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    variant_name = Column(String(255), nullable=True)
    plan_name = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=18.0, nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)

    subscription_rel = relationship("Subscription", back_populates="product_lines")


class SubscriptionTimeline(Base):
    __tablename__ = "subscription_timelines"

    id = Column(String(64), primary_key=True, index=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user = Column(String(128), default="System", nullable=False)
    type = Column(String(32), default="info", nullable=False)

    subscription_rel = relationship("Subscription", back_populates="activity_timeline")
