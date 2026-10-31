from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, String
from backend.database.session import Base


class TaxConfig(Base):
    __tablename__ = "tax_configs"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rate = Column(Float, default=18.0, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    applies_to = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
