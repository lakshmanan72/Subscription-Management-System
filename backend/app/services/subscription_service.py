"""
Subscription Service
Executes subscription contract lifecycle state transitions, renewals, pause/resume,
cancellations, and maintains immutable activity audit logs.
"""

from datetime import date
from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import BusinessRuleViolationException, EntityNotFoundException, InvalidTransitionException
from app.models.audit_log import AuditLog
from app.models.subscription import Subscription
from app.models.subscription_line import SubscriptionLine
from app.repositories import AuditLogRepository, CustomerRepository, SubscriptionRepository
from app.schemas.subscription import RenewSubscriptionRequest, SubscriptionCreate, SubscriptionUpdate, UpdateStatusRequest
from app.utils.date_utils import add_months, calculate_expiry_date, calculate_next_billing_date
from app.utils.invoice_number import generate_subscription_number

ALLOWED_TRANSITIONS = {
    "Draft": {"Quotation", "Confirmed", "Active", "Closed"},
    "Quotation": {"Confirmed", "Closed"},
    "Confirmed": {"Active", "Closed"},
    "Active": {"Paused", "Closed"},
    "Paused": {"Active", "Closed"},
    "Closed": {"Active", "Draft"},  # Renew / Re-activate
}


class SubscriptionService:
    def __init__(
        self,
        subscription_repo: SubscriptionRepository,
        customer_repo: CustomerRepository,
        audit_repo: AuditLogRepository
    ):
        self.subscription_repo = subscription_repo
        self.customer_repo = customer_repo
        self.audit_repo = audit_repo

    def list_subscriptions(self, customer_id: Optional[str] = None) -> List[Subscription]:
        if customer_id:
            return self.subscription_repo.get_by_customer(customer_id)
        return self.subscription_repo.get_all()

    def get_subscription(self, subscription_id: str) -> Subscription:
        sub = self.subscription_repo.get_by_id(subscription_id)
        if not sub:
            raise EntityNotFoundException("Subscription", subscription_id)
        return sub

    def create_subscription(self, request: SubscriptionCreate, performed_by: str = "System") -> Subscription:
        customer = self.customer_repo.get_by_id(request.customer_id)
        if not customer:
            raise EntityNotFoundException("Customer", request.customer_id)

        count = self.subscription_repo.count()
        sub_id = f"SUB-{date.today().year}-{str(count + 1).zfill(3)}"
        sub_number = generate_subscription_number(count + 1)

        expiry_date = request.expiry_date or calculate_expiry_date(request.start_date, 365)
        next_billing = calculate_next_billing_date(request.start_date, request.billing_frequency)

        total_amount = sum(Decimal(str(l.unit_price)) * Decimal(l.quantity) for l in request.lines)

        new_sub = Subscription(
            id=sub_id,
            subscription_number=sub_number,
            customer_id=request.customer_id,
            plan_id=request.plan_id,
            plan_name=request.plan_name,
            product_id=request.product_id,
            product_name=request.product_name,
            billing_frequency=request.billing_frequency,
            start_date=request.start_date,
            expiry_date=expiry_date,
            next_billing_date=next_billing,
            payment_terms=request.payment_terms,
            status=request.status,
            auto_renew=request.auto_renew,
            quantity=request.quantity,
            unit_price=request.unit_price,
            taxes=request.taxes,
            total_amount=total_amount,
            quotation_id=request.quotation_id
        )
        self.subscription_repo.create(new_sub)

        for line in request.lines:
            line_id = f"sub-l-{uuid.uuid4().hex[:6]}"
            subtotal = Decimal(str(line.unit_price)) * Decimal(line.quantity)
            tax_amt = subtotal * (Decimal(str(line.tax_rate)) / Decimal("100"))
            s_line = SubscriptionLine(
                id=line_id,
                subscription_id=sub_id,
                product_id=line.product_id,
                product_name=line.product_name,
                variant_id=line.variant_id,
                variant_name=line.variant_name,
                plan_id=line.plan_id,
                plan_name=line.plan_name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                tax_rate=line.tax_rate,
                subtotal=subtotal,
                tax_amount=tax_amt,
                total=subtotal + tax_amt
            )
            self.subscription_repo.db.add(s_line)

        self._log_audit(sub_id, "CREATE", performed_by, "Subscription Created", f"Subscription {sub_number} created.")
        self.subscription_repo.db.flush()
        return self.get_subscription(sub_id)

    def transition_status(self, subscription_id: str, new_status: str, performed_by: str = "System", notes: Optional[str] = None) -> Subscription:
        sub = self.get_subscription(subscription_id)
        current = sub.status
        if current == new_status:
            return sub

        allowed = ALLOWED_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            raise InvalidTransitionException("Subscription", current, new_status)

        update_fields = {"status": new_status}
        if new_status == "Closed":
            update_fields["next_billing_date"] = None

        self.subscription_repo.update(subscription_id, update_fields)
        self._log_audit(
            subscription_id,
            new_status.upper(),
            performed_by,
            f"Subscription Status: {new_status}",
            notes or f"Transitioned from {current} to {new_status}."
        )
        return self.get_subscription(subscription_id)

    def pause_subscription(self, subscription_id: str, performed_by: str = "System") -> Subscription:
        return self.transition_status(subscription_id, "Paused", performed_by, "Subscription paused by user request.")

    def resume_subscription(self, subscription_id: str, performed_by: str = "System") -> Subscription:
        return self.transition_status(subscription_id, "Active", performed_by, "Subscription resumed. Recurring billing active.")

    def close_subscription(self, subscription_id: str, performed_by: str = "System", reason: Optional[str] = None) -> Subscription:
        return self.transition_status(subscription_id, "Closed", performed_by, reason or "Subscription closed.")

    def renew_subscription(self, subscription_id: str, request: RenewSubscriptionRequest, performed_by: str = "System") -> Subscription:
        sub = self.get_subscription(subscription_id)
        current_expiry = sub.expiry_date or date.today()
        new_expiry = add_months(current_expiry, request.extend_months)
        new_billing = calculate_next_billing_date(date.today(), sub.billing_frequency)

        self.subscription_repo.update(subscription_id, {
            "status": "Active",
            "expiry_date": new_expiry,
            "next_billing_date": new_billing
        })
        self._log_audit(
            subscription_id,
            "RENEW",
            performed_by,
            "Subscription Renewed",
            f"Extended contract by {request.extend_months} months to {new_expiry}."
        )
        return self.get_subscription(subscription_id)

    def _log_audit(self, entity_id: str, action: str, performed_by: str, title: str, description: str):
        log = AuditLog(
            id=f"act-{uuid.uuid4().hex[:8]}",
            entity_type="subscription",
            entity_id=entity_id,
            action=action,
            performed_by=performed_by,
            title=title,
            description=description
        )
        self.audit_repo.create(log)
