"""
Staff Management Endpoints
Administrative staff provisioning, listing, and activation controls.
STRICT ACCESS: Only ADMIN role can access these endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_admin
from app.database.session import get_db
from app.repositories import UserRepository
from app.schemas.auth import TokenPayload
from app.schemas.user import StaffCreate, StaffResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/staff", tags=["Staff Management"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get(
    "",
    response_model=List[StaffResponse],
    summary="List Staff Members",
    description="Admin-only: Lists all operational staff members and their departments."
)
def list_staff(
    admin_user: TokenPayload = Depends(require_admin),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.list_staff_members()


@router.post(
    "",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Staff Member",
    description="Admin-only: Provisions a new staff member with STAFF role."
)
def create_staff(
    request: StaffCreate,
    admin_user: TokenPayload = Depends(require_admin),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.create_staff_member(request)


@router.patch(
    "/{staff_id}/toggle-status",
    response_model=StaffResponse,
    summary="Toggle Staff Status",
    description="Admin-only: Activates or deactivates a staff member's access."
)
def toggle_staff_status(
    staff_id: str,
    admin_user: TokenPayload = Depends(require_admin),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.toggle_user_active(staff_id)
