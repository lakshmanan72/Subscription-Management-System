"""
Pytest Test Configuration and Global Fixtures
Provides TestClient, mock JWT authentication headers for ADMIN, STAFF, and CUSTOMER roles.
"""

import sys
import os
from typing import Dict
import pytest
from starlette.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.security import create_access_token
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_token() -> str:
    return create_access_token({
        "sub": "usr-admin-1",
        "email": "priyanka@brightloop.io",
        "name": "Priyanka Sen",
        "role": "ADMIN",
        "customer_id": None
    })


@pytest.fixture(scope="session")
def staff_token() -> str:
    return create_access_token({
        "sub": "usr-staff-1",
        "email": "rohan.d@brightloop.io",
        "name": "Rohan Deshmukh",
        "role": "STAFF",
        "customer_id": None
    })


@pytest.fixture(scope="session")
def customer_token() -> str:
    return create_access_token({
        "sub": "usr-cust-1",
        "email": "aditi@zenithtech.in",
        "name": "Aditi Rao",
        "role": "CUSTOMER",
        "customer_id": "cust-1"
    })


@pytest.fixture(scope="session")
def other_customer_token() -> str:
    return create_access_token({
        "sub": "usr-cust-2",
        "email": "karan@apexdynamics.co",
        "name": "Karan Sharma",
        "role": "CUSTOMER",
        "customer_id": "cust-2"
    })


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def staff_headers(staff_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {staff_token}"}


@pytest.fixture(scope="session")
def customer_headers(customer_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {customer_token}"}


@pytest.fixture(scope="session")
def other_customer_headers(other_customer_token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {other_customer_token}"}
