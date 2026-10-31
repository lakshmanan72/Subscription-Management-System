import os
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.customer import Customer
from backend.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "brightloop-enterprise-jwt-secret-key-change-in-production-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    """Hash password securely using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT Bearer access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodes and validates JWT token signature and expiration."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Authenticates current user from Bearer token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    return user


def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Optional user authentication for mixed routes."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Enforces ADMIN role."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required.",
        )
    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Enforces STAFF or ADMIN role."""
    if current_user.role not in ("ADMIN", "STAFF"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or administrative privileges required.",
        )
    return current_user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Enforces CUSTOMER role."""
    if current_user.role != "CUSTOMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account required.",
        )
    return current_user


def authenticate_user(email: str, password: str, db: Session) -> User:
    """Verifies email and password."""
    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    return user


def register_customer(name: str, email: str, password: str, company: Optional[str], db: Session) -> User:
    """
    Public registration strictly creates CUSTOMER accounts and linked Customer profiles.
    Any attempt to create ADMIN or STAFF is rejected.
    """
    email_clean = email.strip().lower()

    # Verify uniqueness
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    unique_ts = str(int(datetime.utcnow().timestamp() * 1000))
    user_id = f"usr-cust-{unique_ts}"
    customer_id = f"cust-{unique_ts}"
    hashed_pwd = hash_password(password)
    comp_name = company.strip() if company else f"{name.strip()}'s Organization"

    new_user = User(
        id=user_id,
        email=email_clean,
        name=name.strip(),
        password_hash=hashed_pwd,
        role="CUSTOMER",  # STRICT: CUSTOMER ONLY
        company=comp_name,
        avatar=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=4f46e5&color=fff",
        is_active=True,
    )

    new_customer = Customer(
        id=customer_id,
        user_id=user_id,
        name=name.strip(),
        company=comp_name,
        email=email_clean,
        registration_date=datetime.utcnow().strftime("%Y-%m-%d"),
        active_subscriptions_count=0,
        total_invoices_count=0,
        outstanding_balance=0.0,
        avatar=new_user.avatar,
        is_portal_demo_user=False,
    )

    db.add(new_user)
    db.add(new_customer)
    db.commit()
    db.refresh(new_user)

    return new_user
