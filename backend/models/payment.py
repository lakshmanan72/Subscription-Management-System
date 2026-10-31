from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True)
    payment_reference = Column(String(64), unique=True, index=True, nullable=False)
    customer = Column(String(255), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice = Column(String(64), nullable=True)
    invoice_id = Column(String(64), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_method = Column(String(64), nullable=False)  # UPI, Card, Bank transfer, Cash, Other
    amount = Column(Float, default=0.0, nullable=False)
    payment_date = Column(String(32), nullable=False)
    transaction_id = Column(String(128), nullable=True)
    status = Column(String(32), default="Success", nullable=False)  # Success, Failed, Pending
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer_rel = relationship("Customer", back_populates="payments")
    invoice_rel = relationship("Invoice", back_populates="payments")
