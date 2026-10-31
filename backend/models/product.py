from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), unique=True, index=True, nullable=False)
    type = Column(String(32), default="Service", nullable=False)  # Service, Storable, Consumable
    sales_price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="Active", nullable=False)  # Active, Inactive, Archived
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    variants = relationship("ProductVariant", back_populates="product_rel", cascade="all, delete-orphan", lazy="joined")
    plans = relationship("Plan", back_populates="product_rel")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(String(64), primary_key=True, index=True)
    product_id = Column(String(64), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    price_adjustment = Column(Float, default=0.0, nullable=False)
    sku = Column(String(64), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    product_rel = relationship("Product", back_populates="variants")
