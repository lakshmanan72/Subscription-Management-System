from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from backend.database.session import Base


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(64), nullable=False)  # Super Admin, Billing Admin, Sales Representative, Support Specialist
    department = Column(String(64), nullable=False)  # Executive, Finance, Growth, Customer Success
    status = Column(String(32), default="Active", nullable=False)
    last_active = Column(String(64), default="Just now", nullable=False)
    can_manage_staff = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="staff_profile")
