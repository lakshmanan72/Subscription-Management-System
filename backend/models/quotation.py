from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(String(64), primary_key=True, index=True)
    customer = Column(String(255), nullable=False)
    customer_id = Column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    template_name = Column(String(255), nullable=True)
    date = Column(String(32), nullable=False)
    validity_date = Column(String(32), nullable=True)
    status = Column(String(32), default="Draft", nullable=False)  # Draft, Quotation, Confirmed
    subtotal = Column(Float, default=0.0, nullable=False)
    tax = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer_rel = relationship("Customer", back_populates="quotations")
    lines = relationship("QuotationLine", back_populates="quotation_rel", cascade="all, delete-orphan", lazy="joined")


class QuotationLine(Base):
    __tablename__ = "quotation_lines"

    id = Column(String(64), primary_key=True, index=True)
    quotation_id = Column(String(64), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    product_id = Column(String(64), nullable=True)
    plan_name = Column(String(255), nullable=True)
    plan_id = Column(String(64), nullable=True)
    variant_name = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=18.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)

    quotation_rel = relationship("Quotation", back_populates="lines")
