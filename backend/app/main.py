import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

from backend.database.session import init_db, SessionLocal
from backend.models.user import User
from backend.scripts.seed_initial_data import seed_database
from backend.api import (
    auth_router,
    products_router,
    plans_router,
    quotations_router,
    subscriptions_router,
    invoices_router,
    payments_router,
    discounts_router,
    customers_router,
    reports_router,
    settings_router,
    dashboard_router,
    notifications_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes tables and seeds initial data if missing."""
    init_db()
    db = SessionLocal()
    try:
        # Check if users table is populated
        if db.query(User).count() == 0:
            print("[Lifespan] Initializing database with seed dataset...")
            seed_database()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Brightloop Enterprise Subscription & Recurring Billing API",
    description="Full-lifecycle SaaS subscription, quotation builder, invoicing, and revenue engine.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [o.strip() for o in cors_env.split(",") if o.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Error] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) or "An internal server error occurred."},
    )


# Health Check & Root Endpoints
@app.get("/", tags=["Health"])
def root():
    return {
        "system": "Brightloop Enterprise Subscription & Billing System",
        "status": "Operational",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# Mount all 13 Domain Routers under /api/v1
API_V1_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(products_router, prefix=API_V1_PREFIX)
app.include_router(plans_router, prefix=API_V1_PREFIX)
app.include_router(quotations_router, prefix=API_V1_PREFIX)
app.include_router(subscriptions_router, prefix=API_V1_PREFIX)
app.include_router(invoices_router, prefix=API_V1_PREFIX)
app.include_router(payments_router, prefix=API_V1_PREFIX)
app.include_router(discounts_router, prefix=API_V1_PREFIX)
app.include_router(customers_router, prefix=API_V1_PREFIX)
app.include_router(reports_router, prefix=API_V1_PREFIX)
app.include_router(settings_router, prefix=API_V1_PREFIX)
app.include_router(dashboard_router, prefix=API_V1_PREFIX)
app.include_router(notifications_router, prefix=API_V1_PREFIX)
