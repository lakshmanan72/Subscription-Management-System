"""
Brightloop Concrete Repository Implementations
Provides specialized queries and aggregations using SQLAlchemy 2.x ORM models.
"""

from datetime import date
from typing import List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import (
    AuditLog, Customer, Discount, Invoice, Notification, Payment,
    Plan, Product, ProductVariant, Quotation, Subscription, Tax, User
)
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(func.lower(User.email) == email.lower().strip())
        return self.db.execute(stmt).scalar_one_or_none()

    def get_staff_members(self) -> List[User]:
        stmt = select(User).where(User.role.in_(["STAFF", "ADMIN"])).order_by(User.name)
        return list(self.db.execute(stmt).scalars().all())


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: Session):
        super().__init__(Customer, db)

    def get_by_email(self, email: str) -> Optional[Customer]:
        stmt = select(Customer).where(func.lower(Customer.email) == email.lower().strip())
        return self.db.execute(stmt).scalar_one_or_none()

    def search(self, query: Optional[str] = None, skip: int = 0, limit: int = 20) -> List[Customer]:
        stmt = select(Customer)
        if query:
            q = f"%{query.strip()}%"
            stmt = stmt.where(or_(Customer.name.ilike(q), Customer.company.ilike(q), Customer.email.ilike(q)))
        stmt = stmt.order_by(Customer.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_code(self, code: str) -> Optional[Product]:
        stmt = select(Product).where(Product.code == code.strip())
        return self.db.execute(stmt).scalar_one_or_none()

    def search(self, query: Optional[str] = None, type_filter: Optional[str] = None, skip: int = 0, limit: int = 20) -> List[Product]:
        stmt = select(Product)
        if query:
            q = f"%{query.strip()}%"
            stmt = stmt.where(or_(Product.name.ilike(q), Product.code.ilike(q)))
        if type_filter:
            stmt = stmt.where(Product.type == type_filter)
        stmt = stmt.order_by(Product.name.asc()).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())


class ProductVariantRepository(BaseRepository[ProductVariant]):
    def __init__(self, db: Session):
        super().__init__(ProductVariant, db)

    def get_by_product_id(self, product_id: str) -> List[ProductVariant]:
        stmt = select(ProductVariant).where(ProductVariant.product_id == product_id)
        return list(self.db.execute(stmt).scalars().all())


class PlanRepository(BaseRepository[Plan]):
    def __init__(self, db: Session):
        super().__init__(Plan, db)

    def get_by_product(self, product_id: str) -> List[Plan]:
        stmt = select(Plan).where(Plan.product_id == product_id)
        return list(self.db.execute(stmt).scalars().all())

    def get_active_plans(self) -> List[Plan]:
        stmt = select(Plan).where(Plan.status == "Active").order_by(Plan.price.asc())
        return list(self.db.execute(stmt).scalars().all())


class QuotationRepository(BaseRepository[Quotation]):
    def __init__(self, db: Session):
        super().__init__(Quotation, db)

    def get_by_customer(self, customer_id: str) -> List[Quotation]:
        stmt = select(Quotation).where(Quotation.customer_id == customer_id).order_by(Quotation.date.desc())
        return list(self.db.execute(stmt).scalars().all())


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, db: Session):
        super().__init__(Subscription, db)

    def get_by_customer(self, customer_id: str) -> List[Subscription]:
        stmt = select(Subscription).where(Subscription.customer_id == customer_id).order_by(Subscription.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())

    def get_active_due_for_billing(self, target_date: date) -> List[Subscription]:
        stmt = select(Subscription).where(
            Subscription.status == "Active",
            Subscription.next_billing_date <= target_date
        )
        return list(self.db.execute(stmt).scalars().all())


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, db: Session):
        super().__init__(Invoice, db)

    def get_by_customer(self, customer_id: str) -> List[Invoice]:
        stmt = select(Invoice).where(Invoice.customer_id == customer_id).order_by(Invoice.invoice_date.desc())
        return list(self.db.execute(stmt).scalars().all())

    def get_by_subscription(self, subscription_id: str) -> List[Invoice]:
        stmt = select(Invoice).where(Invoice.subscription_id == subscription_id).order_by(Invoice.invoice_date.desc())
        return list(self.db.execute(stmt).scalars().all())

    def get_overdue(self, current_date: date) -> List[Invoice]:
        stmt = select(Invoice).where(
            Invoice.status.in_(["Confirmed", "Partially Paid", "Overdue"]),
            Invoice.due_date < current_date,
            Invoice.outstanding_amount > 0
        ).order_by(Invoice.due_date.asc())
        return list(self.db.execute(stmt).scalars().all())


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: Session):
        super().__init__(Payment, db)

    def get_by_invoice(self, invoice_id: str) -> List[Payment]:
        stmt = select(Payment).where(Payment.invoice_id == invoice_id).order_by(Payment.payment_date.desc())
        return list(self.db.execute(stmt).scalars().all())

    def get_by_customer(self, customer_id: str) -> List[Payment]:
        stmt = select(Payment).where(Payment.customer_id == customer_id).order_by(Payment.payment_date.desc())
        return list(self.db.execute(stmt).scalars().all())


class DiscountRepository(BaseRepository[Discount]):
    def __init__(self, db: Session):
        super().__init__(Discount, db)

    def get_by_code(self, code: str) -> Optional[Discount]:
        stmt = select(Discount).where(func.upper(Discount.code) == code.strip().upper())
        return self.db.execute(stmt).scalar_one_or_none()


class TaxRepository(BaseRepository[Tax]):
    def __init__(self, db: Session):
        super().__init__(Tax, db)

    def get_default(self) -> Optional[Tax]:
        stmt = select(Tax).where(Tax.is_default == True, Tax.status == "Active")
        return self.db.execute(stmt).scalar_one_or_none()


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def get_unread(self, user_id: Optional[str] = None) -> List[Notification]:
        stmt = select(Notification).where(Notification.is_read == False)
        if user_id:
            stmt = stmt.where(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        stmt = stmt.order_by(Notification.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def get_for_entity(self, entity_type: str, entity_id: str) -> List[AuditLog]:
        stmt = select(AuditLog).where(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        ).order_by(AuditLog.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())
