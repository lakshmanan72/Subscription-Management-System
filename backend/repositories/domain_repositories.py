from typing import Optional, List
from sqlalchemy.orm import Session
from backend.repositories.base_repository import BaseRepository
from backend.models import (
    User,
    Customer,
    Product,
    Plan,
    Quotation,
    Subscription,
    Invoice,
    Payment,
    Discount,
)


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self):
        super().__init__(Customer)

    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.email == email.lower().strip()).first()

    def get_by_user_id(self, db: Session, user_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.user_id == user_id).first()


class ProductRepository(BaseRepository[Product]):
    def __init__(self):
        super().__init__(Product)


class PlanRepository(BaseRepository[Plan]):
    def __init__(self):
        super().__init__(Plan)

    def get_active_plans(self, db: Session) -> List[Plan]:
        return db.query(Plan).filter(Plan.status == "Active").all()


class QuotationRepository(BaseRepository[Quotation]):
    def __init__(self):
        super().__init__(Quotation)


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self):
        super().__init__(Subscription)

    def get_active_subscriptions(self, db: Session) -> List[Subscription]:
        return db.query(Subscription).filter(Subscription.status == "Active").all()

    def get_due_subscriptions(self, db: Session, date_str: str) -> List[Subscription]:
        return (
            db.query(Subscription)
            .filter(Subscription.status == "Active", Subscription.next_billing_date <= date_str)
            .all()
        )


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self):
        super().__init__(Invoice)

    def get_by_number(self, db: Session, number: str) -> Optional[Invoice]:
        return db.query(Invoice).filter(Invoice.invoice_number == number).first()

    def get_overdue(self, db: Session) -> List[Invoice]:
        return db.query(Invoice).filter(Invoice.status == "Overdue").all()


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    def get_successful_payments(self, db: Session) -> List[Payment]:
        return db.query(Payment).filter(Payment.status == "Success").all()


class DiscountRepository(BaseRepository[Discount]):
    def __init__(self):
        super().__init__(Discount)

    def get_by_code(self, db: Session, code: str) -> Optional[Discount]:
        return db.query(Discount).filter(Discount.code == code.upper().strip()).first()
