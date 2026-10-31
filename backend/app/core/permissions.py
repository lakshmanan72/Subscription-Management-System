"""
Brightloop Role-Based Access Control (RBAC) Permissions
Enforces server-side permissions for ADMIN, STAFF, and CUSTOMER roles
with object-level customer data isolation.
"""

from typing import List, Union
from fastapi import Depends

from app.core.dependencies import get_current_active_user
from app.core.exceptions import ForbiddenException
from app.schemas.auth import TokenPayload

ADMIN_ROLES = {"ADMIN", "SUPER ADMIN"}
STAFF_ROLES = {"STAFF", "BILLING ADMIN", "SALES REPRESENTATIVE", "SUPPORT SPECIALIST"}
CUSTOMER_ROLES = {"CUSTOMER"}


class RoleChecker:
    """Dependency that verifies if the current user possesses one of the allowed roles."""
    def __init__(self, allowed_roles: Union[List[str], set]):
        self.allowed_roles = {r.upper() for r in allowed_roles}

    def __call__(self, current_user: TokenPayload = Depends(get_current_active_user)) -> TokenPayload:
        user_role = (current_user.role or "").upper()
        if user_role not in self.allowed_roles:
            raise ForbiddenException(
                f"Action not permitted. Role '{user_role}' does not have sufficient privileges."
            )
        return current_user


# Pre-configured role dependencies
require_admin = RoleChecker(ADMIN_ROLES)
require_staff = RoleChecker(STAFF_ROLES)
require_admin_or_staff = RoleChecker(ADMIN_ROLES.union(STAFF_ROLES))
require_customer = RoleChecker(CUSTOMER_ROLES)
require_authenticated = get_current_active_user


def check_customer_data_isolation(current_user: TokenPayload, customer_id: str) -> None:
    """
    Enforces tenant/customer data isolation:
    - ADMIN and STAFF can access any customer's records.
    - CUSTOMER can ONLY access records where customer_id matches their own customer_id.
    """
    user_role = (current_user.role or "").upper()
    if user_role in ADMIN_ROLES or user_role in STAFF_ROLES:
        return  # Full administrative / operational view
    
    if user_role in CUSTOMER_ROLES:
        if not current_user.customer_id or current_user.customer_id != customer_id:
            raise ForbiddenException("Access denied: You can only view and manage your own customer records.")
        return

    raise ForbiddenException("Access denied.")
