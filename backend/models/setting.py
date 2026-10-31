from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from backend.database.session import Base


class CompanySetting(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=False)
    tax_id = Column(String(64), nullable=True)
    pan = Column(String(64), nullable=True)
    email = Column(String(255), nullable=False)
    support_email = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(128), nullable=True)
    postal_code = Column(String(32), nullable=True)
    country = Column(String(64), default="India", nullable=False)
    currency = Column(String(32), default="INR", nullable=False)
    currency_symbol = Column(String(16), default="₹", nullable=False)
    timezone = Column(String(64), default="Asia/Kolkata (IST +5:30)", nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email_on_invoice_created = Column(Boolean, default=True, nullable=False)
    email_on_payment_success = Column(Boolean, default=True, nullable=False)
    email_on_subscription_expiry = Column(Boolean, default=True, nullable=False)
    sms_alerts_for_overdue = Column(Boolean, default=True, nullable=False)
    slack_webhook_enabled = Column(Boolean, default=True, nullable=False)
    slack_webhook_url = Column(String(512), nullable=True)
    daily_summary_digest = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
