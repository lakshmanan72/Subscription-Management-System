from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.portability import PortabilityRequest, SubscriptionMigrationEvent
from backend.schemas.innovation_schemas import (
    PortabilityRequestCreate,
    PortabilityReviewRequest,
    PortabilityCompleteRequest,
    PortabilityRequestResponse,
    MigrationEventResponse,
)
from backend.services.auth_service import get_current_user
from backend.services.portability_service import PortabilityService

router = APIRouter(prefix="/portability", tags=["Subscription Continuity Network"])


def get_customer_for_user(user: User, db: Session) -> Optional[Customer]:
    return db.query(Customer).filter((Customer.user_id == user.id) | (Customer.email == user.email)).first()


@router.post("/requests", response_model=PortabilityRequestResponse, status_code=status.HTTP_201_CREATED)
def create_portability_request(
    payload: PortabilityRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a subscription portability request.
    Strictly verifies ownership so customers cannot migrate another customer's subscription.
    """
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found.")
        customer_id = cust.id
    else:
        # Staff/Admin can initiate on behalf of customer if needed
        from backend.models.subscription import Subscription
        sub = db.query(Subscription).filter(Subscription.id == payload.subscription_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
        customer_id = sub.customer_id

    return PortabilityService.create_portability_request(
        customer_id=customer_id,
        subscription_id=payload.subscription_id,
        destination_provider=payload.destination_provider,
        destination_account_id=payload.destination_account_id,
        db=db,
        actor_name=current_user.name,
    )


@router.get("/requests", response_model=List[PortabilityRequestResponse])
def list_portability_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists portability requests with customer data isolation enforced."""
    query = db.query(PortabilityRequest)
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        customer_id = cust.id if cust else "__none__"
        query = query.filter(PortabilityRequest.customer_id == customer_id)

    return query.order_by(PortabilityRequest.created_at.desc()).all()


@router.get("/requests/{id}", response_model=PortabilityRequestResponse)
def get_portability_request(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves single portability request including snapshot and events."""
    req = db.query(PortabilityRequest).filter(
        (PortabilityRequest.id == id) | (PortabilityRequest.request_number == id)
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portability request not found.")

    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust or req.customer_id != cust.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access another customer's portability request.",
            )

    return req


@router.post("/requests/{id}/review", response_model=PortabilityRequestResponse)
def review_portability_request(
    id: str,
    payload: PortabilityReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reviews and approves or rejects a portability request. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can review requests.")

    return PortabilityService.review_request(
        request_id=id,
        action=payload.action,
        reviewer_name=current_user.name,
        rejection_reason=payload.rejection_reason,
        db=db,
    )


@router.post("/requests/{id}/complete", response_model=PortabilityRequestResponse)
def complete_portability_request(
    id: str,
    payload: PortabilityCompleteRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Finalizes migration and marks request completed. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can finalize migration.")

    ext_ref = payload.external_reference if payload else None
    return PortabilityService.complete_migration(
        request_id=id,
        actor_name=current_user.name,
        external_reference=ext_ref,
        db=db,
    )


@router.get("/requests/{id}/history", response_model=List[MigrationEventResponse])
def get_migration_history(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves full audit timeline for a portability migration."""
    req = db.query(PortabilityRequest).filter(
        (PortabilityRequest.id == id) | (PortabilityRequest.request_number == id)
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portability request not found.")

    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust or req.customer_id != cust.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return req.events
