from backend.api.auth import router as auth_router
from backend.api.products import router as products_router
from backend.api.plans import router as plans_router
from backend.api.quotations import router as quotations_router
from backend.api.subscriptions import router as subscriptions_router
from backend.api.invoices import router as invoices_router
from backend.api.payments import router as payments_router
from backend.api.discounts import router as discounts_router
from backend.api.customers import router as customers_router
from backend.api.reports import router as reports_router
from backend.api.settings import router as settings_router
from backend.api.dashboard import router as dashboard_router
from backend.api.notifications import router as notifications_router
from backend.api.portability import router as portability_router
from backend.api.lifeboat import router as lifeboat_router
from backend.api.outcome_contracts import router as outcome_contracts_router
from backend.api.outcome_exchange import router as outcome_exchange_router

__all__ = [
    "auth_router",
    "products_router",
    "plans_router",
    "quotations_router",
    "subscriptions_router",
    "invoices_router",
    "payments_router",
    "discounts_router",
    "customers_router",
    "reports_router",
    "settings_router",
    "dashboard_router",
    "notifications_router",
    "portability_router",
    "lifeboat_router",
    "outcome_contracts_router",
    "outcome_exchange_router",
]

