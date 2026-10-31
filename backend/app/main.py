"""
Brightloop Application Entrypoint
Initializes the FastAPI application, CORS middleware, global exception handlers,
and registers all API v1 routing controllers.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    BrightloopException, BusinessRuleViolationException, DatabaseNotConfiguredException,
    DuplicateEntityException, EntityNotFoundException, ForbiddenException,
    InvalidCredentialsException, UnauthorizedException
)
from app.database.connection import is_database_configured
from app.middleware.request_logging import RequestLoggingMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("brightloop")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown handler."""
    logger.info(f"Starting {settings.APP_NAME} in [{settings.APP_ENV}] mode.")
    if not is_database_configured():
        logger.info(
            "Notice: MySQL database is not yet configured. "
            "Backend is running in schema validation, offline calculation, and API inspection mode. "
            "Database-backed endpoints will return HTTP 503 until MySQL is provisioned in the next phase."
        )
    yield
    logger.info("Shutting down Brightloop backend.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Enterprise SaaS Subscription Management and Recurring Revenue Billing System. "
        "Provides RBAC (ADMIN, STAFF, CUSTOMER), contract lifecycles, and Indian GST invoicing."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Request Logging Middleware
app.add_middleware(RequestLoggingMiddleware)

# 3. Global Exception Handlers
@app.exception_handler(DatabaseNotConfiguredException)
async def database_not_configured_handler(request: Request, exc: DatabaseNotConfiguredException):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": exc.message,
            "code": exc.code,
            "phase": "PRE_DATABASE_INTEGRATION",
            "guide": "Refer to backend/MYSQL_INTEGRATION_GUIDE.md for instructions on connecting MySQL."
        }
    )


@app.exception_handler(EntityNotFoundException)
async def not_found_handler(request: Request, exc: EntityNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.message, "code": exc.code, "details": exc.details}
    )


@app.exception_handler(DuplicateEntityException)
async def duplicate_handler(request: Request, exc: DuplicateEntityException):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.message, "code": exc.code, "details": exc.details}
    )


@app.exception_handler(InvalidCredentialsException)
async def invalid_creds_handler(request: Request, exc: InvalidCredentialsException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.message, "code": exc.code}
    )


@app.exception_handler(UnauthorizedException)
async def unauthorized_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.message, "code": exc.code}
    )


@app.exception_handler(ForbiddenException)
async def forbidden_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.message, "code": exc.code}
    )


@app.exception_handler(BusinessRuleViolationException)
async def business_rule_handler(request: Request, exc: BusinessRuleViolationException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message, "code": exc.code, "details": exc.details}
    )


# 4. Mount API v1 Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# 5. Root status check
@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
        "mode": "schema_and_calculation_ready",
        "mysql_status": "pending_configuration_in_next_phase"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
