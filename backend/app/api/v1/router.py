"""
API v1 Master Router
Consolidates all 16 modular route controllers under the /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, customers, dashboard, discounts, invoices, notifications,
    payments, plans, products, reports, settings as settings_endpoint,
    staff, subscriptions, quotations, taxes, users
)
from app.core.config import settings
from app.database.connection import check_database_connection, is_database_configured
from app.schemas.common import HealthResponse

api_router = APIRouter()

# Health check route
@api_router.get("/health", response_model=HealthResponse, tags=["System Health"])
def health_check():
    configured = is_database_configured()
    connected = check_database_connection() if configured else False
    
    if connected:
        msg = "Brightloop backend operational. MySQL database connected and verified."
    elif configured:
        msg = "DATABASE_URL is configured, but MySQL server is currently unreachable."
    else:
        msg = (
            "Brightloop backend operational in architectural schema, offline calculation, and validation mode. "
            "MySQL connection will be activated in the next phase."
        )

    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version="1.0.0",
        environment=settings.APP_ENV,
        database_configured=configured,
        database_connected=connected,
        message=msg
    )

# Include all sub-routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(staff.router)
api_router.include_router(customers.router)
api_router.include_router(products.router)
api_router.include_router(plans.router)
api_router.include_router(quotations.router)
api_router.include_router(subscriptions.router)
api_router.include_router(invoices.router)
api_router.include_router(payments.router)
api_router.include_router(discounts.router)
api_router.include_router(taxes.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(settings_endpoint.router)
