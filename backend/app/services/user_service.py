"""
User and Staff Service
Admin-only staff management, profile updates, and active state controls.
"""

import uuid
from typing import List, Optional

from app.core.exceptions import DuplicateEntityException, EntityNotFoundException, ForbiddenException
from app.core.security import get_password_hash
from app.models.user import User
from app.repositories import UserRepository
from app.schemas.user import StaffCreate, UserUpdate


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_user_by_id(self, user_id: str) -> User:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException("User", user_id)
        return user

    def list_staff_members(self) -> List[User]:
        return self.user_repo.get_staff_members()

    def create_staff_member(self, request: StaffCreate) -> User:
        """Only ADMIN can create STAFF accounts."""
        existing = self.user_repo.get_by_email(request.email)
        if existing:
            raise DuplicateEntityException("User", "email", request.email)

        user_id = f"usr-staff-{uuid.uuid4().hex[:6]}"
        new_staff = User(
            id=user_id,
            name=request.name.strip(),
            email=request.email.lower().strip(),
            hashed_password=get_password_hash(request.password),
            role="STAFF",
            department=request.department or "Operations",
            can_manage_staff=request.can_manage_staff,
            is_active=True
        )
        return self.user_repo.create(new_staff)

    def update_user(self, user_id: str, request: UserUpdate) -> User:
        user = self.get_user_by_id(user_id)
        update_data = request.model_dump(exclude_unset=True)
        return self.user_repo.update(user_id, update_data) or user

    def toggle_user_active(self, user_id: str) -> User:
        user = self.get_user_by_id(user_id)
        new_status = not user.is_active
        return self.user_repo.update(user_id, {"is_active": new_status}) or user
