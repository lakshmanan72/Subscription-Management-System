"""
Customer ORM Model
Stores business client accounts, Indian GST information, and address records.
"""

from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.database.types import CurrencyAmount


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    pan: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    country: Mapped[str] = mapped_column(String(64), default="India", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="Active", nullable=False)
    outstanding_balance: Mapped[Decimal] = mapped_column(CurrencyAmount, default=Decimal("0.00"), nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_portal_demo_user: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="customer", uselist=False)
    quotations: Mapped[List["Quotation"]] = relationship("Quotation", back_populates="customer_rel")
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="customer_rel")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="customer_rel")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="customer_rel")

    __table_args__ = (
        Index("ix_customers_company_email", "company", "email"),
    )
