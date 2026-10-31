"""
Subscription ORM Model
Manages recurring contracts, status lifecycle (Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed),
billing frequency, renewal terms, and next billing schedules.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Boolean, Date, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount, TaxRate


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subscription_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    plan_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("plans.id", ondelete="SET NULL"), nullable=True
    )
    plan_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    billing_frequency: Mapped[str] = mapped_column(String(32), default="Monthly", nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_billing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    payment_terms: Mapped[str] = mapped_column(String(64), default="Net 15", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Draft", nullable=False, index=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    taxes: Mapped[Decimal] = mapped_column(TaxRate, default=Decimal("18.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    quotation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    customer_rel: Mapped["Customer"] = relationship("Customer", back_populates="subscriptions")
    lines: Mapped[List["SubscriptionLine"]] = relationship(
        "SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan"
    )
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="subscription_rel")

    __table_args__ = (
        Index("ix_subscriptions_status_billing", "status", "next_billing_date"),
        Index("ix_subscriptions_customer_status", "customer_id", "status"),
    )
