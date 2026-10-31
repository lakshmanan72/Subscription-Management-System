"""
Role-Based Access Control and Tenant Isolation Tests
Tests permission dependencies for ADMIN, STAFF, and CUSTOMER roles.
"""

import pytest
from starlette.testclient import TestClient

from app.core.exceptions import ForbiddenException
from app.core.permissions import check_customer_data_isolation
from app.schemas.auth import TokenPayload


def test_customer_data_isolation_rules():
    # Customer accessing their own account
    user_cust1 = TokenPayload(sub="u1", email="c1@test.com", role="CUSTOMER", customer_id="cust-1")
    # Should succeed without error
    check_customer_data_isolation(user_cust1, "cust-1")

    # Customer attempting to access another customer's data
    with pytest.raises(ForbiddenException):
        check_customer_data_isolation(user_cust1, "cust-2")

    # Admin accessing any customer data
    user_admin = TokenPayload(sub="u2", email="admin@test.com", role="ADMIN", customer_id=None)
    check_customer_data_isolation(user_admin, "cust-1")
    check_customer_data_isolation(user_admin, "cust-2")

    # Staff accessing any customer data
    user_staff = TokenPayload(sub="u3", email="staff@test.com", role="STAFF", customer_id=None)
    check_customer_data_isolation(user_staff, "cust-1")
    check_customer_data_isolation(user_staff, "cust-2")


def test_staff_management_endpoint_forbidden_for_staff(client: TestClient, staff_headers: dict):
    # Staff cannot view staff management (Admin only)
    response = client.get("/api/v1/staff", headers=staff_headers)
    assert response.status_code == 403


def test_staff_management_endpoint_forbidden_for_customer(client: TestClient, customer_headers: dict):
    # Customer cannot access staff endpoint
    response = client.get("/api/v1/staff", headers=customer_headers)
    assert response.status_code == 403


def test_dashboard_admin_forbidden_for_staff(client: TestClient, staff_headers: dict):
    response = client.get("/api/v1/dashboard/admin", headers=staff_headers)
    assert response.status_code == 403


def test_dashboard_admin_forbidden_for_customer(client: TestClient, customer_headers: dict):
    response = client.get("/api/v1/dashboard/admin", headers=customer_headers)
    assert response.status_code == 403


def test_dashboard_staff_forbidden_for_customer(client: TestClient, customer_headers: dict):
    response = client.get("/api/v1/dashboard/staff", headers=customer_headers)
    assert response.status_code == 403
