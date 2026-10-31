from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.lifeboat import SubscriptionAdjustment
from backend.schemas.innovation_schemas import (
    AdjustmentRequestCreate,
    AdjustmentReviewRequest,
    SubscriptionAdjustmentResponse,
    AdjustmentHistoryResponse,
)
from backend.services.auth_service import get_current_user
from backend.services.lifeboat_service import LifeboatService

router = APIRouter(prefix="/lifeboat", tags=["Subscription Lifeboat"])


def get_customer_for_user(user: User, db: Session) -> Optional[Customer]:
    return db.query(Customer).filter((Customer.user_id == user.id) | (Customer.email == user.email)).first()


@router.post("/adjustments", response_model=SubscriptionAdjustmentResponse, status_code=status.HTTP_201_CREATED)
def create_adjustment_request(
    payload: AdjustmentRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a temporary subscription adjustment request (downgrade, pause, deferral).
    Strictly verifies ownership for customers.
    """
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found.")
        customer_id = cust.id
    else:
        from backend.models.subscription import Subscription
        sub = db.query(Subscription).filter(Subscription.id == payload.subscription_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
        customer_id = sub.customer_id

    return LifeboatService.create_adjustment_request(
        customer_id=customer_id,
        subscription_id=payload.subscription_id,
        adjustment_type=payload.adjustment_type,
        reason=payload.reason,
        duration_days=payload.duration_days,
        temporary_plan_id=payload.temporary_plan_id,
        temporary_unit_price=payload.temporary_unit_price,
        deferral_days=payload.deferral_days,
        db=db,
        actor_name=current_user.name,
    )


@router.get("/adjustments", response_model=List[SubscriptionAdjustmentResponse])
def list_adjustments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists subscription adjustments. Enforces customer data isolation."""
    query = db.query(SubscriptionAdjustment)
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        customer_id = cust.id if cust else "__none__"
        query = query.filter(SubscriptionAdjustment.customer_id == customer_id)
    if status_filter:
        query = query.filter(SubscriptionAdjustment.status == status_filter)

    return query.order_by(SubscriptionAdjustment.created_at.desc()).all()


@router.get("/adjustments/{id}", response_model=SubscriptionAdjustmentResponse)
def get_adjustment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves single subscription adjustment details with audit history."""
    adj = db.query(SubscriptionAdjustment).filter(
        (SubscriptionAdjustment.id == id) | (SubscriptionAdjustment.adjustment_number == id)
    ).first()
    if not adj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjustment not found.")

    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust or adj.customer_id != cust.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return adj


@router.post("/adjustments/{id}/review", response_model=SubscriptionAdjustmentResponse)
def review_adjustment(
    id: str,
    payload: AdjustmentReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approves or rejects a temporary adjustment request. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can review adjustments.")

    return LifeboatService.review_adjustment(
        adjustment_id=id,
        action=payload.action,
        approver_name=current_user.name,
        comments=payload.comments,
        db=db,
    )


@router.post("/adjustments/{id}/restore", response_model=SubscriptionAdjustmentResponse)
def restore_adjustment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually triggers restoration of original subscription configuration.
    Restricted to ADMIN / STAFF.
    """
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can restore subscriptions.")

    return LifeboatService.restore_subscription(
        adjustment_id=id,
        actor_name=current_user.name,
        db=db,
    )


@router.post("/process-expired")
def process_expired_adjustments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch processor to restore all expired adjustments safely & idempotently."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    return LifeboatService.process_expired_adjustments(db=db, actor_name=current_user.name)
