"""
Dynamic Dashboard Endpoints
Aggregated analytics tailored strictly for ADMIN, STAFF, and CUSTOMER workspaces.
Calculates real-time figures from database repositories.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException
from app.core.permissions import require_admin, require_authenticated, require_staff
from app.database.session import get_db
from app.repositories import (
    CustomerRepository, InvoiceRepository, PaymentRepository,
    QuotationRepository, SubscriptionRepository
)
from app.schemas.auth import TokenPayload
from app.schemas.dashboard import (
    AdminDashboardResponse, CustomerDashboardResponse, StaffDashboardResponse
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(
        SubscriptionRepository(db),
        InvoiceRepository(db),
        PaymentRepository(db),
        CustomerRepository(db),
        QuotationRepository(db)
    )


@router.get(
    "/admin",
    response_model=AdminDashboardResponse,
    summary="Executive Admin Dashboard",
    description="Admin-only: Real-time MRR, ARR, collections, overdue dunning balances, and renewal alerts."
)
def get_admin_dashboard(
    admin_user: TokenPayload = Depends(require_admin),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_admin_dashboard()


@router.get(
    "/staff",
    response_model=StaffDashboardResponse,
    summary="Staff Operations Dashboard",
    description="Staff-only: Pending quotations, open invoices, and operational pipeline summaries."
)
def get_staff_dashboard(
    staff_user: TokenPayload = Depends(require_staff),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_staff_dashboard()


@router.get(
    "/customer",
    response_model=CustomerDashboardResponse,
    summary="Customer Self-Service Portal Dashboard",
    description="Customer portal overview: Isolated metrics for active subscriptions, invoices, and payment receipts."
)
def get_customer_dashboard(
    customer_id: Optional[str] = Query(None, description="Client ID (Admin/Staff override)"),
    current_user: TokenPayload = Depends(require_authenticated),
    service: DashboardService = Depends(get_dashboard_service)
):
    target_id = customer_id or current_user.customer_id
    if not target_id:
        raise ForbiddenException("No linked customer profile found for this account.")

    # Enforce customer data isolation
    if current_user.role.upper() == "CUSTOMER" and current_user.customer_id != target_id:
        raise ForbiddenException("Access denied: You can only view your own portal dashboard.")

    return service.get_customer_dashboard(target_id)
