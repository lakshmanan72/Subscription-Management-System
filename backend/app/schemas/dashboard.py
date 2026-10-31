"""
Dashboard Schemas
Structured metric responses for ADMIN, STAFF, and CUSTOMER workspaces.
"""

from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.schemas.common import BaseSchema


class AdminDashboardResponse(BaseSchema):
    total_revenue: Decimal
    mrr: Decimal
    arr: Decimal
    active_subscriptions: int
    outstanding_balance: Decimal
    overdue_invoices_amount: Decimal
    mrr_trend: List[Dict[str, Any]] = []
    subscription_growth: List[Dict[str, Any]] = []
    revenue_by_plan: List[Dict[str, Any]] = []
    recent_subscriptions: List[Dict[str, Any]] = []
    recent_invoices: List[Dict[str, Any]] = []
    upcoming_renewals: List[Dict[str, Any]] = []
    delinquent_alert: Optional[Dict[str, Any]] = None


class StaffDashboardResponse(BaseSchema):
    pending_quotations_count: int
    open_invoices_count: int
    active_customers_count: int
    recent_customers: List[Dict[str, Any]] = []
    recent_quotations: List[Dict[str, Any]] = []
    recent_invoices: List[Dict[str, Any]] = []
    operational_summary: Dict[str, Any] = {}


class CustomerDashboardResponse(BaseSchema):
    customer_id: str
    customer_name: str
    company_name: str
    active_subscriptions_count: int
    outstanding_balance: Decimal
    paid_invoices_count: int
    unpaid_invoices_count: int
    subscriptions: List[Dict[str, Any]] = []
    invoices: List[Dict[str, Any]] = []
    payment_history: List[Dict[str, Any]] = []
    upcoming_renewals: List[Dict[str, Any]] = []
