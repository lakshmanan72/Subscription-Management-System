from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.subscription import Subscription, SubscriptionLine, SubscriptionTimeline
from backend.models.customer import Customer
from backend.schemas.schemas import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionStatusUpdate,
    SubscriptionResponse,
    SubscriptionTimelineResponse,
)
from backend.services.auth_service import get_current_user_optional
from backend.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


from backend.models.user import User

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    customer_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Lists subscriptions. Enforces customer data isolation."""
    query = db.query(Subscription)
    if current_user and current_user.role == "CUSTOMER":
        cust = db.query(Customer).filter((Customer.user_id == current_user.id) | (Customer.email == current_user.email)).first()
        allowed_id = cust.id if cust else "__none__"
        query = query.filter(Subscription.customer_id == allowed_id)
    elif customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    return query.order_by(Subscription.created_at.desc()).all()


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(sub_in: SubscriptionCreate, db: Session = Depends(get_db)):
    """Creates a new subscription with product lines and activity timeline."""
    sub_count = db.query(Subscription).count() + 1
    sub_number = sub_in.subscription_number or f"SUB-2024-{str(sub_count + 100).zfill(4)}"
    sub_id = f"SUB-{int(datetime.utcnow().timestamp() * 1000)}"

    new_sub = Subscription(
        id=sub_id,
        subscription_number=sub_number,
        customer=sub_in.customer,
        customer_id=sub_in.customer_id,
        customer_email=sub_in.customer_email,
        plan=sub_in.plan,
        plan_id=sub_in.plan_id,
        product=sub_in.product,
        product_id=sub_in.product_id,
        billing_frequency=sub_in.billing_frequency,
        start_date=sub_in.start_date,
        expiry_date=sub_in.expiry_date,
        payment_terms=sub_in.payment_terms,
        quantity=sub_in.quantity,
        unit_price=sub_in.unit_price,
        taxes=sub_in.taxes,
        total_amount=sub_in.total_amount,
        status=sub_in.status or "Draft",
        next_billing_date=sub_in.next_billing_date or sub_in.start_date,
        auto_renew=sub_in.auto_renew,
    )

    if sub_in.product_lines:
        for idx, line in enumerate(sub_in.product_lines):
            new_sub.product_lines.append(
                SubscriptionLine(
                    id=f"sub-l-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    product_name=line.product_name,
                    variant_name=line.variant_name,
                    plan_name=line.plan_name,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    subtotal=line.subtotal,
                    total=line.total,
                )
            )

    new_sub.activity_timeline.append(
        SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}",
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title="Subscription Drafted",
            description=f"Subscription {sub_number} initiated.",
            user="Admin",
            type="create",
        )
    )

    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@router.get("/{id}", response_model=SubscriptionResponse)
def get_subscription(
    id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieves single subscription with line items and timeline."""
    sub = db.query(Subscription).filter((Subscription.id == id) | (Subscription.subscription_number == id)).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    if current_user and current_user.role == "CUSTOMER":
        cust = db.query(Customer).filter((Customer.user_id == current_user.id) | (Customer.email == current_user.email)).first()
        if not cust or sub.customer_id != cust.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Cannot access another customer's subscriptions.")

    return sub


@router.put("/{id}", response_model=SubscriptionResponse)
def update_subscription(id: str, update_in: SubscriptionUpdate, db: Session = Depends(get_db)):
    """Updates subscription fields."""
    sub = db.query(Subscription).filter((Subscription.id == id) | (Subscription.subscription_number == id)).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    for field, val in update_in.dict(exclude_unset=True).items():
        setattr(sub, field, val)

    db.commit()
    db.refresh(sub)
    return sub


@router.patch("/{id}/status", response_model=SubscriptionResponse)
def update_subscription_status(id: str, status_in: SubscriptionStatusUpdate, db: Session = Depends(get_db)):
    """Updates subscription lifecycle state: Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed."""
    return SubscriptionService.update_status(
        subscription_id=id,
        new_status=status_in.status,
        reason=status_in.reason,
        db=db,
    )


@router.post("/{id}/renew", response_model=SubscriptionResponse)
def renew_subscription(id: str, db: Session = Depends(get_db)):
    """Renews subscription extending contract by 1 year."""
    return SubscriptionService.renew(subscription_id=id, db=db)


@router.get("/{id}/timeline", response_model=List[SubscriptionTimelineResponse])
def get_subscription_timeline(id: str, db: Session = Depends(get_db)):
    """Returns chronological audit timeline for subscription."""
    sub = db.query(Subscription).filter((Subscription.id == id) | (Subscription.subscription_number == id)).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
    return sub.activity_timeline
