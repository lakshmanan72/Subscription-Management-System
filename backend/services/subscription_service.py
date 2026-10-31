from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models.subscription import Subscription, SubscriptionLine, SubscriptionTimeline
from backend.models.quotation import Quotation
from backend.models.customer import Customer


class SubscriptionService:
    @staticmethod
    def convert_quotation(quotation_id: str, db: Session, user_name: str = "Sales Desk") -> Subscription:
        """Converts an approved quotation into an active subscription contract."""
        quo = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

        # Update quotation status to Confirmed
        quo.status = "Confirmed"

        sub_count = db.query(Subscription).count() + 1
        sub_number = f"SUB-2024-{str(sub_count + 100).zfill(4)}"
        sub_id = f"SUB-{int(datetime.utcnow().timestamp() * 1000)}"

        start_date = datetime.utcnow().strftime("%Y-%m-%d")
        exp_date_year = datetime.utcnow().year + 1
        expiry_date = datetime.utcnow().replace(year=exp_date_year).strftime("%Y-%m-%d")

        first_line = quo.lines[0] if quo.lines else None

        customer = db.query(Customer).filter(Customer.id == quo.customer_id).first()

        new_sub = Subscription(
            id=sub_id,
            subscription_number=sub_number,
            customer=quo.customer,
            customer_id=quo.customer_id,
            customer_email=customer.email if customer else None,
            plan=first_line.plan_name if first_line else "Enterprise Subscription",
            plan_id=first_line.plan_id if first_line else None,
            product=first_line.product_name if first_line else "Brightloop Suite",
            product_id=first_line.product_id if first_line else None,
            billing_frequency="Monthly",
            start_date=start_date,
            expiry_date=expiry_date,
            payment_terms="Net 15",
            quantity=first_line.quantity if first_line else 1,
            unit_price=first_line.unit_price if first_line else quo.subtotal,
            taxes=first_line.tax_rate if first_line else 18.0,
            total_amount=round(quo.total, 2),
            status="Confirmed",  # Initial confirmed status
            next_billing_date=start_date,
            auto_renew=True,
        )

        # Convert lines
        if quo.lines:
            new_sub.product_lines = [
                SubscriptionLine(
                    id=f"sub-l-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    product_name=l.product_name,
                    variant_name=l.variant_name,
                    plan_name=l.plan_name,
                    quantity=l.quantity,
                    unit_price=l.unit_price,
                    tax_rate=l.tax_rate,
                    subtotal=l.unit_price * l.quantity,
                    total=l.total,
                )
                for idx, l in enumerate(quo.lines)
            ]

        # Activity timeline
        timeline_entry = SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}",
            subscription_id=sub_id,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title="Converted from Quotation",
            description=f"Generated from approved quotation {quo.id}.",
            user=user_name,
            type="confirm",
        )
        new_sub.activity_timeline = [timeline_entry]

        # Update customer active subscriptions count
        if customer:
            customer.active_subscriptions_count = (customer.active_subscriptions_count or 0) + 1

        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub

    @staticmethod
    def update_status(subscription_id: str, new_status: str, reason: Optional[str], db: Session, user_name: str = "Operator") -> Subscription:
        """Transitions subscription status and appends timeline log."""
        sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

        old_status = sub.status
        sub.status = new_status

        action_labels = {
            "Confirmed": "Quotation Confirmed",
            "Active": "Subscription Activated",
            "Paused": "Subscription Paused",
            "Closed": "Subscription Closed",
            "Draft": "Reset to Draft",
        }
        title = action_labels.get(new_status, f"Status updated to {new_status}")
        desc = reason if reason else f"Status changed from {old_status} to {new_status}."

        timeline_log = SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}",
            subscription_id=sub.id,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title=title,
            description=desc,
            user=user_name,
            type=new_status.lower(),
        )
        db.add(timeline_log)
        db.commit()
        db.refresh(sub)
        return sub

    @staticmethod
    def renew(subscription_id: str, db: Session, user_name: str = "Renewals System") -> Subscription:
        """Extends subscription expiry date by 1 year."""
        sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

        try:
            curr_exp = datetime.strptime(sub.expiry_date[:10], "%Y-%m-%d")
        except Exception:
            curr_exp = datetime.utcnow()

        new_exp = curr_exp.replace(year=curr_exp.year + 1).strftime("%Y-%m-%d")
        sub.expiry_date = new_exp
        sub.status = "Active"

        timeline_log = SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}",
            subscription_id=sub.id,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title="Subscription Renewed",
            description=f"Contract extended by 1 year. New expiry date: {new_exp}.",
            user=user_name,
            type="renew",
        )
        db.add(timeline_log)
        db.commit()
        db.refresh(sub)
        return sub
