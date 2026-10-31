from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.user import User
from backend.models.customer import Customer
from backend.models.outcome_contract import OutcomeContract, ServiceCredit
from backend.schemas.innovation_schemas import (
    OutcomeContractCreate,
    OutcomeContractResponse,
    MeasurementRecordCreate,
    PerformanceMeasurementResponse,
    ServiceCreditResponse,
    ServiceCreditReviewRequest,
    ServiceCreditApplyRequest,
)
from backend.services.auth_service import get_current_user
from backend.services.outcome_contract_service import OutcomeContractService

router = APIRouter(prefix="/outcome-contracts", tags=["Subscription Outcome Contracts"])


def get_customer_for_user(user: User, db: Session) -> Optional[Customer]:
    return db.query(Customer).filter((Customer.user_id == user.id) | (Customer.email == user.email)).first()


@router.post("", response_model=OutcomeContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    payload: OutcomeContractCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Defines an outcome contract with measurable SLA metrics. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can create contracts.")

    metrics_list = [m.model_dump() for m in payload.metrics]
    return OutcomeContractService.create_contract(
        customer_id=payload.customer_id,
        title=payload.title,
        subscription_id=payload.subscription_id,
        product_id=payload.product_id,
        plan_id=payload.plan_id,
        measurement_period=payload.measurement_period,
        start_date=payload.start_date,
        end_date=payload.end_date,
        credit_cap_percentage=payload.credit_cap_percentage,
        notes=payload.notes,
        metrics=metrics_list,
        db=db,
    )


@router.get("", response_model=List[OutcomeContractResponse])
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists outcome contracts. Enforces customer data isolation."""
    query = db.query(OutcomeContract)
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        customer_id = cust.id if cust else "__none__"
        query = query.filter(OutcomeContract.customer_id == customer_id)

    return query.order_by(OutcomeContract.created_at.desc()).all()


@router.get("/{id}", response_model=OutcomeContractResponse)
def get_contract(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves an outcome contract including its metrics and credits."""
    contract = db.query(OutcomeContract).filter(
        (OutcomeContract.id == id) | (OutcomeContract.contract_number == id)
    ).first()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome contract not found.")

    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        if not cust or contract.customer_id != cust.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return contract


@router.post("/measurements")
def record_measurement(
    payload: MeasurementRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Records performance measurement and evaluates SLA breach + eligible credit."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can record telemetry.")

    result = OutcomeContractService.record_performance_measurement(
        metric_id=payload.metric_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        measured_value=payload.measured_value,
        measurement_source=payload.measurement_source,
        evidence_notes=payload.evidence_notes,
        db=db,
    )
    return {
        "success": True,
        "measurement_id": result["measurement"].id,
        "is_breached": result["is_breached"],
        "breach_magnitude": result["breach_magnitude"],
        "credit_generated": result["credit"].credit_number if result["credit"] else None,
        "credit_amount": result["credit"].credit_amount if result["credit"] else 0.0,
    }


@router.get("/credits/all", response_model=List[ServiceCreditResponse])
def list_service_credits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists service credits. Enforces customer data isolation."""
    query = db.query(ServiceCredit)
    if current_user.role == "CUSTOMER":
        cust = get_customer_for_user(current_user, db)
        customer_id = cust.id if cust else "__none__"
        query = query.filter(ServiceCredit.customer_id == customer_id)

    return query.order_by(ServiceCredit.created_at.desc()).all()


@router.post("/credits/{id}/review", response_model=ServiceCreditResponse)
def review_service_credit(
    id: str,
    payload: ServiceCreditReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reviews and approves or rejects a calculated service credit. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can review credits.")

    return OutcomeContractService.review_service_credit(
        credit_id=id,
        action=payload.action,
        reviewer_name=current_user.name,
        notes=payload.notes,
        db=db,
    )


@router.post("/credits/{id}/apply", response_model=ServiceCreditResponse)
def apply_service_credit(
    id: str,
    payload: Optional[ServiceCreditApplyRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Applies an approved service credit to an invoice. Restricted to ADMIN / STAFF."""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only authorized staff or admins can apply credits.")

    inv_id = payload.invoice_id if payload else None
    return OutcomeContractService.apply_credit_to_invoice(
        credit_id=id,
        invoice_id=inv_id,
        db=db,
        actor_name=current_user.name,
    )
