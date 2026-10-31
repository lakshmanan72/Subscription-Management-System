"""
Subscription Line Item ORM Model
Itemized line items belonging to an active or pending subscription contract.
"""

from decimal import Decimal
from typing import Optional
from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount, TaxRate


class SubscriptionLine(Base, TimestampMixin):
    __tablename__ = "subscription_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    subscription_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    variant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    plan_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("plans.id", ondelete="SET NULL"), nullable=True
    )
    plan_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(TaxRate, default=Decimal("18.00"), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)

    # Relationships
    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="lines")

    __table_args__ = (
        Index("ix_subscription_lines_sub_prod", "subscription_id", "product_id"),
    )
