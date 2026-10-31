"""
User ORM Model
Represents system actors across the 3 roles: ADMIN, STAFF, and CUSTOMER.
"""

from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="CUSTOMER", nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    can_manage_staff: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Optional link to customer profile if role is CUSTOMER
    customer_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="user")

    __table_args__ = (
        Index("ix_users_role_active", "role", "is_active"),
    )
