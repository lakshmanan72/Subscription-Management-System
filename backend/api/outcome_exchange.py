from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.outcome_exchange import (
    ProviderProfile,
    SubscriptionOffering,
    OfferingInterestRequest,
)
from backend.schemas.innovation_schemas import (
    ProviderProfileCreate,
    ProviderProfileResponse,
    SubscriptionOfferingCreate,
    SubscriptionOfferingResponse,
    OfferingInterestRequestCreate,
    OfferingInterestRequestResponse,
)
from backend.schemas.schemas import QuotationResponse
from backend.services.auth_service import get_current_user, get_current_user_optional
from backend.services.outcome_exchange_service import OutcomeExchangeService

router = APIRouter(prefix="/exchange", tags=["Subscription Outcome Exchange"])


def get_customer_for_user(user: User, db: Session) -> Optional[Customer]:
    return db.query(Customer).filter((Customer.user_id == user.id) | (Customer.email == user.email)).first()


@router.post("/providers", response_model=ProviderProfileResponse, status_code=status.HTTP_201_CREATED)
def create_provider(
    payload: ProviderProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registers a provider profile in the Outcome Exchange. Restricted to ADMIN."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can onboard provider profiles.")

    return OutcomeExchangeService.create_provider_profile(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        website=payload.website,
        contact_email=payload.contact_email,
        rating=payload.rating,
        verified_status=payload.verified_status,
        verification_badge=payload.verification_badge,
        uptime_guarantee=payload.uptime_guarantee,
        logo_url=payload.logo_url,
        db=db,
    )


@router.get("/providers", response_model=List[ProviderProfileResponse])
def list_providers(db: Session = Depends(get_db)):
    """Lists registered provider profiles."""
    return db.query(ProviderProfile).order_by(ProviderProfile.name.asc()).all()


@router.post("/offerings", response_model=SubscriptionOfferingResponse, status_code=status.HTTP_201_CREATED)
def create_offering(
    payload: SubscriptionOfferingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a subscription offering with SLA commitments. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff or admins can create marketplace offerings.")

    commitments_list = [c.model_dump() for c in payload.commitments]
    return OutcomeExchangeService.create_subscription_offering(
        provider_id=payload.provider_id,
        product_id=payload.product_id,
        plan_id=payload.plan_id,
        title=payload.title,
        tier=payload.tier,
        description=payload.description,
        pricing_model=payload.pricing_model,
        unit_price=payload.unit_price,
        billing_frequency=payload.billing_frequency,
        terms_conditions=payload.terms_conditions,
        credit_policy=payload.credit_policy,
        included_features=payload.included_features,
        commitments=commitments_list,
        db=db,
    )


@router.get("/offerings", response_model=List[SubscriptionOfferingResponse])
def list_offerings(
    provider_id: Optional[str] = None,
    tier: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_uptime: Optional[float] = None,
    verified_only: Optional[bool] = False,
    db: Session = Depends(get_db),
):
    """Browses marketplace offerings with comparison filters."""
    return OutcomeExchangeService.browse_offerings(
        provider_id=provider_id,
        tier=tier,
        min_price=min_price,
        max_price=max_price,
        min_uptime=min_uptime,
        verified_only=verified_only,
        db=db,
    )


@router.get("/offerings/{id}", response_model=SubscriptionOfferingResponse)
def get_offering(id: str, db: Session = Depends(get_db)):
    """Retrieves full details of a subscription offering with commitments."""
    off = db.query(SubscriptionOffering).filter(SubscriptionOffering.id == id).first()
    if not off:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offering not found.")
    return off


@router.post("/interest-requests", response_model=OfferingInterestRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_interest_request(
    payload: OfferingInterestRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submits customer interest/quotation request for an offering."""
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer profile not found.")
        customer_id = cust.id
    else:
        cust = db.query(Customer).first()
        customer_id = cust.id if cust else current_user.id

    return OutcomeExchangeService.submit_interest_request(
        customer_id=customer_id,
        offering_id=payload.offering_id,
        custom_notes=payload.custom_notes,
        db=db,
    )


@router.get("/interest-requests", response_model=List[OfferingInterestRequestResponse])
def list_interest_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists interest requests. Enforces customer data isolation."""
    query = db.query(OfferingInterestRequest)
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        customer_id = cust.id if cust else "__none__"
        query = query.filter(OfferingInterestRequest.customer_id == customer_id)

    return query.order_by(OfferingInterestRequest.created_at.desc()).all()


@router.post("/interest-requests/{id}/convert", response_model=QuotationResponse)
def convert_to_quotation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Converts an accepted interest request into an official Brightloop Quotation.
    Restricted to ADMIN / STAFF.
    """
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only staff or admins can generate quotations.")

    return OutcomeExchangeService.convert_interest_to_quotation(
        interest_request_id=id,
        db=db,
        actor_name=current_user.name,
    )
