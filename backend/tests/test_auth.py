"""
Authentication and Security Tests
Tests bcrypt hashing, password validation, JWT token lifecycle, and registration schemas.
"""

from datetime import timedelta
import pytest
from starlette.testclient import TestClient

from app.core.security import (
    create_access_token, decode_access_token,
    get_password_hash, validate_password_strength, verify_password
)
from app.schemas.auth import RegisterCustomerRequest


def test_password_hashing_and_verification():
    raw_pass = "Secure@Brightloop2026!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_password_strength_criteria():
    # Compliant password
    valid, msg = validate_password_strength("Admin@Brightloop123!")
    assert valid is True

    # Too short (< 8)
    valid, msg = validate_password_strength("Short1!")
    assert valid is False

    # Missing uppercase
    valid, msg = validate_password_strength("lowercase123!@")
    assert valid is False

    # Missing special character
    valid, msg = validate_password_strength("NoSpecialChar123")
    assert valid is False

    # Missing number
    valid, msg = validate_password_strength("NoNumbersHere!@#")
    assert valid is False


def test_jwt_token_creation_and_decoding():
    payload = {
        "sub": "usr-100",
        "email": "test@brightloop.io",
        "role": "ADMIN",
        "name": "Test Admin"
    }
    token = create_access_token(payload, expires_delta=timedelta(minutes=15))
    assert isinstance(token, str)

    decoded = decode_access_token(token)
    assert decoded["sub"] == "usr-100"
    assert decoded["email"] == "test@brightloop.io"
    assert decoded["role"] == "ADMIN"
    assert decoded["iss"] == "brightloop-auth"


def test_jwt_expired_token():
    payload = {"sub": "usr-100", "email": "test@brightloop.io", "role": "ADMIN"}
    # Token expired 1 second in the past
    token = create_access_token(payload, expires_delta=timedelta(seconds=-1))
    with pytest.raises(Exception):
        decode_access_token(token)


def test_customer_registration_schema_validation():
    # Valid customer registration payload
    valid_data = {
        "name": "Aditi Rao",
        "email": "aditi@zenithtech.in",
        "password": "Client@Zenith123!",
        "company": "Zenith Technologies Pvt Ltd",
        "gstin": "29ABCDE1234F1Z5"
    }
    schema = RegisterCustomerRequest(**valid_data)
    assert schema.email == "aditi@zenithtech.in"
    assert schema.company == "Zenith Technologies Pvt Ltd"

    # Invalid email format should raise validation error
    with pytest.raises(ValueError):
        RegisterCustomerRequest(
            name="Invalid User",
            email="not-an-email",
            password="Client@Zenith123!",
            company="Test Co"
        )

    # Weak password should raise validation error
    with pytest.raises(ValueError):
        RegisterCustomerRequest(
            name="Weak Pass",
            email="valid@example.com",
            password="weak",
            company="Test Co"
        )


def test_auth_me_endpoint_with_valid_jwt(client: TestClient, admin_headers: dict):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "priyanka@brightloop.io"
    assert data["role"] == "ADMIN"


def test_auth_me_endpoint_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_database_unconfigured_returns_503(client: TestClient):
    """
    Verifies that database-dependent operations return HTTP 503 Service Unavailable
    with clear guidance rather than fabricating fake success responses.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "priyanka@brightloop.io", "password": "Admin@Brightloop123!"}
    )
    assert response.status_code == 503
    data = response.json()
    assert data["code"] == "DATABASE_NOT_CONFIGURED"
    assert "MYSQL_INTEGRATION_GUIDE.md" in data["detail"]
