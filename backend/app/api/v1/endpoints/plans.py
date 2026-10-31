"""
Subscription Plans Endpoints
Billing cadences (Daily, Weekly, Monthly, Yearly), pricing tiers, and status switches.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories import PlanRepository, ProductRepository
from app.schemas.auth import TokenPayload
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.services.plan_service import PlanService

router = APIRouter(prefix="/plans", tags=["Plans"])


def get_plan_service(db: Session = Depends(get_db)) -> PlanService:
    return PlanService(PlanRepository(db), ProductRepository(db))


@router.get("", response_model=List[PlanResponse], summary="List Plans")
def list_plans(
    active_only: bool = Query(False, description="Filter for Active plans only"),
    plan_service: PlanService = Depends(get_plan_service)
):
    return plan_service.list_plans(active_only=active_only)


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED, summary="Create Plan")
def create_plan(
    request: PlanCreate,
    admin_user: TokenPayload = Depends(require_admin),
    plan_service: PlanService = Depends(get_plan_service)
):
    return plan_service.create_plan(request)


@router.get("/{plan_id}", response_model=PlanResponse, summary="Get Plan Detail")
def get_plan(
    plan_id: str,
    plan_service: PlanService = Depends(get_plan_service)
):
    return plan_service.get_plan(plan_id)


@router.put("/{plan_id}", response_model=PlanResponse, summary="Update Plan")
def update_plan(
    plan_id: str,
    request: PlanUpdate,
    admin_user: TokenPayload = Depends(require_admin),
    plan_service: PlanService = Depends(get_plan_service)
):
    return plan_service.update_plan(plan_id, request)


@router.patch("/{plan_id}/status", response_model=PlanResponse, summary="Toggle Plan Status")
def toggle_plan_status(
    plan_id: str,
    admin_user: TokenPayload = Depends(require_admin),
    plan_service: PlanService = Depends(get_plan_service)
):
    return plan_service.toggle_plan_status(plan_id)
