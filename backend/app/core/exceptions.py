"""
Brightloop Core Exceptions
Unified domain and HTTP exception classes for standardized error handling.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class BrightloopException(Exception):
    """Base exception for all Brightloop domain errors."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class DatabaseNotConfiguredException(BrightloopException):
    """Raised when an operation requires MySQL but the database is not yet configured or connected."""
    def __init__(
        self,
        message: str = (
            "Database service unavailable: MySQL database connection is not yet configured. "
            "The backend is currently running in architectural schema, offline calculation, and validation mode. "
            "Please configure DATABASE_URL in .env and run migrations as described in MYSQL_INTEGRATION_GUIDE.md."
        ),
        code: str = "DATABASE_NOT_CONFIGURED"
    ):
        super().__init__(message=message, code=code)


class EntityNotFoundException(BrightloopException):
    def __init__(self, entity_name: str, entity_id: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{entity_id}' was not found.",
            code="ENTITY_NOT_FOUND",
            details={"entity": entity_name, "id": str(entity_id)}
        )


class DuplicateEntityException(BrightloopException):
    def __init__(self, entity_name: str, field_name: str, value: Any):
        super().__init__(
            message=f"{entity_name} with {field_name} '{value}' already exists.",
            code="DUPLICATE_ENTITY",
            details={"entity": entity_name, "field": field_name, "value": str(value)}
        )


class InvalidCredentialsException(BrightloopException):
    def __init__(self, message: str = "Invalid email or password."):
        super().__init__(message=message, code="INVALID_CREDENTIALS")


class UnauthorizedException(BrightloopException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message=message, code="UNAUTHORIZED")


class ForbiddenException(BrightloopException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message=message, code="FORBIDDEN")


class BusinessRuleViolationException(BrightloopException):
    def __init__(self, message: str, code: str = "BUSINESS_RULE_VIOLATION", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code=code, details=details)


class InvalidTransitionException(BusinessRuleViolationException):
    def __init__(self, entity_name: str, current_status: str, target_status: str):
        super().__init__(
            message=f"Cannot transition {entity_name} from status '{current_status}' to '{target_status}'.",
            code="INVALID_STATUS_TRANSITION",
            details={"entity": entity_name, "current_status": current_status, "target_status": target_status}
        )
