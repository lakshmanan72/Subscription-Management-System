"""
Discount ORM Model
Promotional campaign rules supporting percentage or fixed rupee (₹) deductions,
order value thresholds, usage limits, and campaign validity periods.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy import Date, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Discount(Base, TimestampMixin):
    __tablename__ = "discounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(32), default="percentage", nullable=False)  # percentage, fixed
    value: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    min_purchase: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    min_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    applicable_products: Mapped[str] = mapped_column(String(512), default="all", nullable=False)
    applicable_subscriptions: Mapped[str] = mapped_column(String(512), default="all", nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    usage_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_discounts_code_status", "code", "status"),
    )
