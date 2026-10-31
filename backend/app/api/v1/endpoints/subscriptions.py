"""
Subscription Contract Endpoints
Lifecycle transitions (Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed),
renewals, pause/resume, and activity timelines.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import check_customer_data_isolation, require_admin_or_staff, require_authenticated
from app.database.session import get_db
from app.repositories import AuditLogRepository, CustomerRepository, SubscriptionRepository
from app.schemas.auth import TokenPayload
from app.schemas.subscription import (
    RenewSubscriptionRequest, SubscriptionCreate,
    SubscriptionResponse, UpdateStatusRequest
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    return SubscriptionService(
        SubscriptionRepository(db),
        CustomerRepository(db),
        AuditLogRepository(db)
    )


@router.get("", response_model=List[SubscriptionResponse], summary="List Subscriptions")
def list_subscriptions(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    if customer_id:
        check_customer_data_isolation(current_user, customer_id)
        return service.list_subscriptions(customer_id)

    # Customers without customer_id query only see their own
    if current_user.role.upper() == "CUSTOMER":
        return service.list_subscriptions(current_user.customer_id)

    return service.list_subscriptions()


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED, summary="Create Subscription")
def create_subscription(
    request: SubscriptionCreate,
    current_user: TokenPayload = Depends(require_admin_or_staff),
    service: SubscriptionService = Depends(get_subscription_service)
):
    return service.create_subscription(request, performed_by=current_user.name or current_user.email)


@router.get("/{subscription_id}", response_model=SubscriptionResponse, summary="Get Subscription Detail")
def get_subscription(
    subscription_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return sub


@router.patch("/{subscription_id}/status", response_model=SubscriptionResponse, summary="Update Status")
def update_status(
    subscription_id: str,
    request: UpdateStatusRequest,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return service.transition_status(
        subscription_id,
        request.status,
        performed_by=current_user.name or current_user.email,
        notes=request.notes
    )


@router.post("/{subscription_id}/pause", response_model=SubscriptionResponse, summary="Pause Subscription")
def pause_subscription(
    subscription_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return service.pause_subscription(subscription_id, performed_by=current_user.name or current_user.email)


@router.post("/{subscription_id}/resume", response_model=SubscriptionResponse, summary="Resume Subscription")
def resume_subscription(
    subscription_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return service.resume_subscription(subscription_id, performed_by=current_user.name or current_user.email)


@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse, summary="Renew Contract (+1 Year)")
def renew_subscription(
    subscription_id: str,
    request: RenewSubscriptionRequest,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return service.renew_subscription(subscription_id, request, performed_by=current_user.name or current_user.email)


@router.post("/{subscription_id}/close", response_model=SubscriptionResponse, summary="Close Subscription")
def close_subscription(
    subscription_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    service: SubscriptionService = Depends(get_subscription_service)
):
    sub = service.get_subscription(subscription_id)
    check_customer_data_isolation(current_user, sub.customer_id)
    return service.close_subscription(subscription_id, performed_by=current_user.name or current_user.email)


@router.get("/{subscription_id}/timeline", response_model=List[Dict[str, Any]], summary="Get Activity Timeline")
def get_timeline(
    subscription_id: str,
    current_user: TokenPayload = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    sub_repo = SubscriptionRepository(db)
    sub = sub_repo.get_by_id(subscription_id)
    if sub:
        check_customer_data_isolation(current_user, sub.customer_id)

    audit_repo = AuditLogRepository(db)
    logs = audit_repo.get_for_entity("subscription", subscription_id)
    return [
        {
            "id": l.id,
            "timestamp": str(l.created_at),
            "title": l.title,
            "description": l.description,
            "user": l.performed_by,
            "type": l.action.lower()
        }
        for l in logs
    ]
