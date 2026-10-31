"""
Quotation ORM Model
Captures sales proposals, pricing configurations, multi-line items, and conversion state.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Quotation(Base, TimestampMixin):
    __tablename__ = "quotations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    template_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    validity_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Draft", nullable=False, index=True)
    converted_subscription_id: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )
    subtotal: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    tax: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    discount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    customer_rel: Mapped["Customer"] = relationship("Customer", back_populates="quotations")
    lines: Mapped[List["QuotationLine"]] = relationship(
        "QuotationLine", back_populates="quotation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_quotations_cust_status", "customer_id", "status"),
    )
