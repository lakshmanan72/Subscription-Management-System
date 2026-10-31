"""
Payment ORM Model
Records financial receipts, method references (UPI, Card, Bank transfer, Cash),
transaction UTRs, and reconciliations against specific invoices.
"""

from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    payment_reference: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    invoice_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    payment_method: Mapped[str] = mapped_column(String(64), default="UPI", nullable=False)
    amount: Mapped[Decimal] = mapped_column(CurrencyAmount, nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="Success", nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    customer_rel: Mapped["Customer"] = relationship("Customer", back_populates="payments")
    invoice_rel: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")

    __table_args__ = (
        Index("ix_payments_cust_date", "customer_id", "payment_date"),
        Index("ix_payments_inv_status", "invoice_id", "status"),
    )
