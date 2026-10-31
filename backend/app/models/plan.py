"""
Subscription Plan ORM Model
Defines recurring billing terms, cadences (Daily, Weekly, Monthly, Yearly),
minimum quantity thresholds, and contract lifecycle rules.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy import Boolean, Date, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    plan_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    billing_frequency: Mapped[str] = mapped_column(String(32), nullable=False)  # Daily, Weekly, Monthly, Yearly
    price: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    min_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    auto_close: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_early_closure: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_pause: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_renewal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="plans")

    __table_args__ = (
        Index("ix_plans_frequency_status", "billing_frequency", "status"),
    )
