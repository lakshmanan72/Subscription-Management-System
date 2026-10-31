from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from backend.database.session import Base


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), unique=True, index=True, nullable=False)
    type = Column(String(32), default="percentage", nullable=False)  # percentage, fixed
    value = Column(Float, nullable=False)
    min_purchase = Column(Float, default=0.0, nullable=False)
    min_quantity = Column(Integer, default=1, nullable=False)
    applicable_products = Column(Text, default="all", nullable=False)  # JSON list string or "all"
    applicable_subscriptions = Column(Text, default="all", nullable=False)  # JSON list string or "all"
    start_date = Column(String(32), nullable=True)
    end_date = Column(String(32), nullable=True)
    usage_limit = Column(Integer, default=100, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    status = Column(String(32), default="Active", nullable=False)  # Active, Inactive
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
