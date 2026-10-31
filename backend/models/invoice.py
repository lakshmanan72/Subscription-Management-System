from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(64), primary_key=True, index=True)
    invoice_number = Column(String(64), unique=True, index=True, nullable=False)
    customer = Column(String(255), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_email = Column(String(255), nullable=True)
    customer_address = Column(String(512), nullable=True)
    customer_gst = Column(String(64), nullable=True)
    subscription = Column(String(64), nullable=True)
    subscription_id = Column(String(64), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True)
    invoice_date = Column(String(32), nullable=False)
    due_date = Column(String(32), nullable=True)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    paid_amount = Column(Float, default=0.0, nullable=False)
    outstanding_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="Draft", nullable=False)  # Draft, Confirmed, Paid, Overdue, Cancelled
    payment_terms = Column(String(64), default="Net 15", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer_rel = relationship("Customer", back_populates="invoices")
    subscription_rel = relationship("Subscription", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice_rel", cascade="all, delete-orphan", lazy="joined")
    payments = relationship("Payment", back_populates="invoice_rel")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(String(64), primary_key=True, index=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(512), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    amount = Column(Float, default=0.0, nullable=False)

    invoice_rel = relationship("Invoice", back_populates="lines")
