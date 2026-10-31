"""
User Profile Endpoints
Profile retrieval and updates for authenticated users.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.exceptions import ForbiddenException
from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories import UserRepository
from app.schemas.auth import TokenPayload
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get("/me", response_model=UserResponse, summary="Get Own Profile")
def get_own_profile(
    current_user: TokenPayload = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_user_by_id(current_user.sub)


@router.put("/me", response_model=UserResponse, summary="Update Own Profile")
def update_own_profile(
    request: UserUpdate,
    current_user: TokenPayload = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.update_user(current_user.sub, request)


@router.get("/{user_id}", response_model=UserResponse, summary="Get User By ID")
def get_user_by_id(
    user_id: str,
    current_user: TokenPayload = Depends(get_current_active_user),
    user_service: UserService = Depends(get_user_service)
):
    # Only Admin or user themselves
    if current_user.role.upper() != "ADMIN" and current_user.sub != user_id:
        raise ForbiddenException("Access denied.")
    return user_service.get_user_by_id(user_id)
