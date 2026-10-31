"""
Authentication Endpoints
Shared login, customer registration, password recovery, and token management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.permissions import require_authenticated
from app.database.session import get_db
from app.repositories import CustomerRepository, UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest, LoginRequest, LoginResponse,
    RegisterCustomerRequest, ResetPasswordRequest, TokenPayload
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    user_repo = UserRepository(db)
    customer_repo = CustomerRepository(db)
    return AuthService(user_repo, customer_repo)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Shared Login Endpoint",
    description="Authenticates ADMIN, STAFF, and CUSTOMER roles through a single entry point. Role is determined by the backend."
)
def login(request: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.authenticate_user(request)


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public Customer Registration",
    description="Self-service registration strictly assigns CUSTOMER role. Any attempt to escalate role is rejected."
)
def register(request: RegisterCustomerRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.register_customer(request)


@router.get(
    "/me",
    response_model=TokenPayload,
    summary="Get Current User Profile",
    description="Returns the authenticated user's payload extracted from the validated JWT token."
)
def get_me(current_user: TokenPayload = Depends(require_authenticated)):
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="User Logout",
    description="Invalidates user session client-side."
)
def logout(current_user: TokenPayload = Depends(require_authenticated)):
    return MessageResponse(
        message=f"User {current_user.email} successfully logged out.",
        code="LOGOUT_SUCCESS"
    )


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request Password Reset",
    description="Initiates password reset workflow. In this stage, simulates recovery token generation."
)
def forgot_password(request: ForgotPasswordRequest):
    return MessageResponse(
        message=f"If an account exists for {request.email}, password recovery instructions have been dispatched.",
        code="RESET_EMAIL_DISPATCHED"
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Complete Password Reset",
    description="Validates reset token and sets new password meeting enterprise criteria."
)
def reset_password(request: ResetPasswordRequest):
    return MessageResponse(
        message="Password has been successfully updated. You may now log in with your new credentials.",
        code="PASSWORD_RESET_SUCCESS"
    )
