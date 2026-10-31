"""
Product Variant ORM Model
Supports add-on variants with specific SKUs and price adjustments.
Final Price = Product Base Sales Price + Variant Price Adjustment.
"""

from decimal import Decimal
from typing import Optional
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class ProductVariant(Base, TimestampMixin):
    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    price_adjustment: Mapped[Decimal] = mapped_column(
        CurrencyAmount, default=Decimal("0.00"), nullable=False
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")

    __table_args__ = (
        Index("ix_variants_product_name", "product_id", "name"),
    )
