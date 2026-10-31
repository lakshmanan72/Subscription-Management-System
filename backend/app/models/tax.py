"""
Tax Configuration ORM Model
Stores Indian GST taxation tiers (Standard 18%, IGST 18%, Concessional 5%, SEZ Zero-Rated).
"""

from decimal import Decimal
from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin
from app.database.types import TaxRate


class Tax(Base, TimestampMixin):
    __tablename__ = "taxes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rate: Mapped[Decimal] = mapped_column(TaxRate, default=Decimal("18.00"), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    applies_to: Mapped[str] = mapped_column(String(255), default="Intra-state sales", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)

    __table_args__ = (
        Index("ix_taxes_default", "is_default"),
    )
