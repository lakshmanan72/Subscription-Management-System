import pytest
from backend.models.user import User
from backend.services.auth_service import hash_password, verify_password


def test_customer_registration_success(client):
    """Test customer public registration assigns role CUSTOMER."""
    payload = {
        "name": "Rajesh Kumar",
        "email": "rajesh@kumartech.in",
        "password": "Password123!",
        "company": "Kumar Technologies",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CUSTOMER"
    assert data["user"]["isCustomer"] is True
    assert data["user"]["email"] == "rajesh@kumartech.in"


def test_customer_registration_duplicate_email_rejected(client):
    """Duplicate email must be rejected with 400 Bad Request."""
    payload = {
        "name": "Priyanka Duplicate",
        "email": "priyanka@brightloop.io",
        "password": "Password123!",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_success_with_jwt(client):
    """Verify login against stored password hash returns valid JWT."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "priyanka@brightloop.io", "password": "Admin@Brightloop123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_password_rejected(client):
    """Invalid password must return 401 Unauthorized."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "priyanka@brightloop.io", "password": "WrongPassword!"},
    )
    assert res.status_code == 401


def test_login_inactive_user_rejected(client, db):
    """Inactive accounts must be rejected with 403 Forbidden."""
    inactive_user = User(
        id="usr-inactive-1",
        email="inactive@brightloop.io",
        name="Inactive User",
        password_hash=hash_password("Inactive123!"),
        role="CUSTOMER",
        is_active=False,
    )
    db.add(inactive_user)
    db.commit()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@brightloop.io", "password": "Inactive123!"},
    )
    assert res.status_code == 403
    assert "inactive" in res.json()["detail"].lower()


def test_get_current_user_profile(client, admin_token):
    """Authenticated /auth/me returns current user profile."""
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "priyanka@brightloop.io"
    assert data["role"] == "ADMIN"


def test_password_hashing_and_verification():
    """Verifies that bcrypt produces distinct salted hashes that verify correctly."""
    plain = "MySecret123!"
    h1 = hash_password(plain)
    h2 = hash_password(plain)
    assert h1 != h2  # Salted
    assert verify_password(plain, h1) is True
    assert verify_password(plain, h2) is True
    assert verify_password("WrongSecret", h1) is False
