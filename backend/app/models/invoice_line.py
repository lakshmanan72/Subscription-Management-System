"""
Invoice Line Item ORM Model
Stores historical unit pricing, quantity, discount, and tax rate snapshots for immutable invoicing.
"""

from decimal import Decimal
from typing import Optional
from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount, TaxRate


class InvoiceLine(Base, TimestampMixin):
    __tablename__ = "invoice_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    invoice_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(String(512), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(TaxRate, default=Decimal("18.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    discount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    sac_code: Mapped[Optional[str]] = mapped_column(String(32), default="998313", nullable=True)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="lines")

    __table_args__ = (
        Index("ix_invoice_lines_inv", "invoice_id"),
    )
