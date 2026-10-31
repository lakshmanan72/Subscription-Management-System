from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    phone = Column(String(64), nullable=True)
    gstin = Column(String(64), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    country = Column(String(64), default="India", nullable=False)
    registration_date = Column(String(32), nullable=False)
    active_subscriptions_count = Column(Integer, default=0, nullable=False)
    total_invoices_count = Column(Integer, default=0, nullable=False)
    outstanding_balance = Column(Float, default=0.0, nullable=False)
    avatar = Column(String(512), nullable=True)
    is_portal_demo_user = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="customer_profile")
    quotations = relationship("Quotation", back_populates="customer_rel", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="customer_rel", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer_rel", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer_rel", cascade="all, delete-orphan")
    portability_requests = relationship("PortabilityRequest", back_populates="customer_rel", cascade="all, delete-orphan")
    adjustments = relationship("SubscriptionAdjustment", back_populates="customer_rel", cascade="all, delete-orphan")
    outcome_contracts = relationship("OutcomeContract", back_populates="customer_rel", cascade="all, delete-orphan")
    service_credits = relationship("ServiceCredit", back_populates="customer_rel", cascade="all, delete-orphan")
    interest_requests = relationship("OfferingInterestRequest", back_populates="customer_rel", cascade="all, delete-orphan")
