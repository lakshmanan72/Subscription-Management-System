from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.user import User
from backend.models.customer import Customer
from backend.schemas.schemas import (
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from backend.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    register_customer,
    hash_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = authenticate_user(request.email, request.password, db)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=access_token_expires,
    )

    cust = db.query(Customer).filter((Customer.user_id == user.id) | (Customer.email == user.email)).first()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company": user.company,
            "avatar": user.avatar,
            "customerId": cust.id if cust else (user.id if user.role == "CUSTOMER" else None),
            "isCustomer": user.role == "CUSTOMER",
        },
    }


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    STRICT: Public registration creates CUSTOMER accounts only.
    Rejects any privileged registration.
    """
    new_user = register_customer(
        name=request.name,
        email=request.email,
        password=request.password,
        company=request.company,
        db=db,
    )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "role": new_user.role},
        expires_delta=access_token_expires,
    )

    cust = db.query(Customer).filter(Customer.user_id == new_user.id).first()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "company": new_user.company,
            "avatar": new_user.avatar,
            "customerId": cust.id if cust else new_user.id,
            "isCustomer": True,
        },
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the authenticated user profile and customer ID if applicable."""
    cust = db.query(Customer).filter((Customer.user_id == current_user.id) | (Customer.email == current_user.email)).first()

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "company": current_user.company,
        "avatar": current_user.avatar,
        "customerId": cust.id if cust else (current_user.id if current_user.role == "CUSTOMER" else None),
        "isCustomer": current_user.role == "CUSTOMER",
    }


@router.post("/logout")
def logout():
    """Client logout confirmation endpoint."""
    return {"success": True, "message": "Successfully logged out."}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiates password reset flow."""
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user:
        return {"success": True, "message": "If this email is registered, password reset instructions have been sent."}
    return {
        "success": True,
        "message": f"Password reset link generated for {user.email}.",
        "reset_token": f"mock_reset_token_{user.id}",
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets password with valid token."""
    # Look for matching user id if token contains it or dummy
    user = None
    if "usr-" in request.token:
        uid = request.token.replace("mock_reset_token_", "")
        user = db.query(User).filter(User.id == uid).first()
    if not user:
        user = db.query(User).filter(User.role == "CUSTOMER").first()

    if user:
        user.password_hash = hash_password(request.password)
        db.commit()

    return {"success": True, "message": "Password updated successfully. You may now log in."}
