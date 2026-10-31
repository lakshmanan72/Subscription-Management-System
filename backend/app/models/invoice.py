"""
Invoice ORM Model
Stores recurring and one-off tax billing records with GST splits (CGST, SGST, IGST),
payment statuses (Draft, Confirmed, Partially Paid, Paid, Overdue, Cancelled), and balances.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    subscription_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    subtotal: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    tax: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    cgst_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    sgst_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    igst_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    discount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    outstanding_amount: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Draft", nullable=False, index=True)
    payment_terms: Mapped[str] = mapped_column(String(64), default="Net 15", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    customer_rel: Mapped["Customer"] = relationship("Customer", back_populates="invoices")
    subscription_rel: Mapped[Optional["Subscription"]] = relationship("Subscription", back_populates="invoices")
    lines: Mapped[List["InvoiceLine"]] = relationship(
        "InvoiceLine", back_populates="invoice", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice_rel")

    __table_args__ = (
        Index("ix_invoices_status_due_date", "status", "due_date"),
        Index("ix_invoices_cust_status", "customer_id", "status"),
    )
