"""
Authentication Service
Handles user login, public customer registration (strictly CUSTOMER role),
initial admin provisioning, password recovery, and JWT token issue.
"""

from datetime import datetime, timezone
import uuid
from typing import Optional

from app.core.config import settings
from app.core.exceptions import (
    BusinessRuleViolationException, DuplicateEntityException,
    InvalidCredentialsException, UnauthorizedException
)
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.customer import Customer
from app.models.user import User
from app.repositories import CustomerRepository, UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, RegisterCustomerRequest


class AuthService:
    def __init__(self, user_repo: UserRepository, customer_repo: CustomerRepository):
        self.user_repo = user_repo
        self.customer_repo = customer_repo

    def authenticate_user(self, request: LoginRequest) -> LoginResponse:
        """
        Validates user credentials and issues a signed JWT access token.
        Role is strictly determined by the backend database record.
        """
        user = self.user_repo.get_by_email(request.email)
        if not user:
            raise InvalidCredentialsException("Invalid email or password.")

        if not verify_password(request.password, user.hashed_password):
            raise InvalidCredentialsException("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated. Please contact your administrator.")

        # Determine customer id and company if applicable
        customer_id = user.customer_id
        company = None
        if user.customer:
            company = user.customer.company

        token_data = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
            "customer_id": customer_id
        }
        token = create_access_token(token_data)

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            customer_id=customer_id,
            company=company,
            avatar=user.avatar
        )

    def register_customer(self, request: RegisterCustomerRequest) -> LoginResponse:
        """
        Public self-service customer registration.
        STRICT SECURITY ENFORCEMENT:
        - Role is ALWAYS assigned to CUSTOMER.
        - Rejects duplicate emails.
        - Simultaneously provisions linked Customer profile.
        """
        existing_user = self.user_repo.get_by_email(request.email)
        if existing_user:
            raise DuplicateEntityException("User", "email", request.email)

        existing_customer = self.customer_repo.get_by_email(request.email)
        if existing_customer:
            raise DuplicateEntityException("Customer", "email", request.email)

        customer_id = f"cust-{uuid.uuid4().hex[:8]}"
        new_customer = Customer(
            id=customer_id,
            name=request.name.strip(),
            company=request.company.strip(),
            email=request.email.lower().strip(),
            phone=request.phone,
            gstin=request.gstin.strip().upper() if request.gstin else None,
            address=request.address,
            city=request.city,
            state=request.state,
            country="India",
            status="Active"
        )
        self.customer_repo.create(new_customer)

        user_id = f"usr-{uuid.uuid4().hex[:8]}"
        new_user = User(
            id=user_id,
            name=request.name.strip(),
            email=request.email.lower().strip(),
            hashed_password=get_password_hash(request.password),
            role="CUSTOMER",  # Strictly CUSTOMER - no escalation permitted
            is_active=True,
            can_manage_staff=False,
            customer_id=customer_id
        )
        self.user_repo.create(new_user)

        # Issue immediate authentication token
        token_data = {
            "sub": user_id,
            "email": new_user.email,
            "role": "CUSTOMER",
            "name": new_user.name,
            "customer_id": customer_id
        }
        token = create_access_token(token_data)

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            name=new_user.name,
            email=new_user.email,
            role="CUSTOMER",
            customer_id=customer_id,
            company=new_customer.company,
            avatar=None
        )

    def provision_initial_admin(self) -> Optional[User]:
        """
        Provisions the initial Super Admin account from environment variables if not present.
        Prevents unauthorized creation; requires INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD.
        """
        admin_email = settings.INITIAL_ADMIN_EMAIL
        admin_password = settings.INITIAL_ADMIN_PASSWORD
        admin_name = settings.INITIAL_ADMIN_NAME

        if not admin_email or not admin_password:
            return None

        existing = self.user_repo.get_by_email(admin_email)
        if existing:
            return existing

        admin_user = User(
            id="usr-admin-1",
            name=admin_name,
            email=admin_email.lower().strip(),
            hashed_password=get_password_hash(admin_password),
            role="ADMIN",
            is_active=True,
            can_manage_staff=True,
            department="Executive"
        )
        return self.user_repo.create(admin_user)
