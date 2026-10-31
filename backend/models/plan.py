from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(64), primary_key=True, index=True)
    plan_name = Column(String(255), nullable=False)
    product_id = Column(String(64), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    product_name = Column(String(255), nullable=True)
    billing_frequency = Column(String(32), nullable=False)  # Daily, Weekly, Monthly, Yearly
    price = Column(Float, nullable=False)
    min_quantity = Column(Integer, default=1, nullable=False)
    start_date = Column(String(32), nullable=True)
    end_date = Column(String(32), nullable=True)
    auto_close = Column(Boolean, default=False, nullable=False)
    allow_early_closure = Column(Boolean, default=True, nullable=False)
    allow_pause = Column(Boolean, default=True, nullable=False)
    allow_renewal = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="Active", nullable=False)  # Active, Disabled
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    product_rel = relationship("Product", back_populates="plans")
