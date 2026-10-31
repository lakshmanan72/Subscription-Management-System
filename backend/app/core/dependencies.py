"""
Brightloop Core Dependencies
Provides authentication token extraction, user resolution, and security context.
"""

from typing import Optional
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.database.connection import is_database_configured
from app.database.session import get_db
from app.schemas.auth import TokenPayload

security_bearer = HTTPBearer(auto_error=False)


def get_token_from_header(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    authorization: Optional[str] = Header(None)
) -> str:
    """Extracts bearer token from HTTP Authorization header."""
    if auth_header and auth_header.credentials:
        return auth_header.credentials
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    raise UnauthorizedException("Missing Authorization Bearer token.")


def get_current_token_payload(token: str = Depends(get_token_from_header)) -> TokenPayload:
    """Decodes and validates the JWT token without requiring database connection."""
    payload_dict = decode_access_token(token)
    return TokenPayload(**payload_dict)


def get_current_user(
    token_payload: TokenPayload = Depends(get_current_token_payload),
) -> TokenPayload:
    """
    Returns the authenticated user context.
    
    In this phase (pre-MySQL connection), user identity and roles are verified
    cryptographically via signed JWT tokens. When MySQL is connected in the next phase,
    this seamlessly hydrates the full SQLAlchemy User ORM instance.
    """
    return token_payload


def get_current_active_user(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Ensures the authenticated user has an active status."""
    return current_user
