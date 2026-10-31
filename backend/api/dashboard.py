from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    """Dynamically calculates KPI metrics from SQLite records."""
    return DashboardService.get_metrics(db)


@router.get("/charts")
def get_charts(db: Session = Depends(get_db)):
    """Returns analytics chart datasets."""
    return DashboardService.get_chart_data(db)


@router.get("/staff-metrics")
def get_staff_metrics(db: Session = Depends(get_db)):
    """Operational metrics for internal staff operations dashboard."""
    return DashboardService.get_staff_metrics(db)


@router.get("/portal-metrics")
def get_portal_metrics(customer_id: str, email: Optional[str] = "", db: Session = Depends(get_db)):
    """Customer-specific metrics for the portal."""
    return DashboardService.get_portal_metrics(customer_id=customer_id, email=email or "", db=db)
