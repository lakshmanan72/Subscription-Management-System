import os
import sys
from pathlib import Path
from typing import Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.database.session import Base, get_db
from backend.app.main import app
from backend.scripts.seed_initial_data import seed_database, hash_password
from backend.models.user import User

TEST_DB_PATH = Path(__file__).resolve().parent / "test_brightloop.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH.as_posix()}"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes and seeds isolated test database before test session."""
    # Remove existing test DB if any
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

    Base.metadata.create_all(bind=test_engine)

    # Override get_db in app
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed initial sample data into test database
    import backend.scripts.seed_initial_data as seeder
    original_session_local = seeder.SessionLocal
    seeder.SessionLocal = TestingSessionLocal
    try:
        seeder.seed_database()
    finally:
        seeder.SessionLocal = original_session_local

    yield

    # Cleanup after test session
    app.dependency_overrides.clear()
    test_engine.dispose()
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture
def db():
    """Provides a fresh database session for a test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    """Returns a valid JWT access token for Admin."""
    res = client.post("/api/v1/auth/login", json={"email": "priyanka@brightloop.io", "password": "Admin@Brightloop123!"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def staff_token(client):
    """Returns a valid JWT access token for Staff."""
    res = client.post("/api/v1/auth/login", json={"email": "rohan.d@brightloop.io", "password": "Staff@Brightloop123!"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def customer_token(client):
    """Returns a valid JWT access token for Customer."""
    res = client.post("/api/v1/auth/login", json={"email": "aditi@zenithtech.in", "password": "Client@Zenith123!"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def other_customer_token(client):
    """Returns a valid JWT access token for second Customer."""
    res = client.post("/api/v1/auth/login", json={"email": "karan@apexdynamics.co", "password": "Client@Apex123!"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def staff_headers(staff_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {staff_token}"}


@pytest.fixture
def customer_headers(customer_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {customer_token}"}


@pytest.fixture
def other_customer_headers(other_customer_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {other_customer_token}"}
