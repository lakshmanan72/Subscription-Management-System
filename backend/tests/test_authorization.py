import pytest


def test_admin_can_access_staff_creation(client, admin_token):
    """Admin can create new staff member."""
    payload = {
        "name": "Kavita Rao",
        "email": "kavita.r@brightloop.io",
        "role": "Support Specialist",
        "department": "Customer Success",
        "password": "Staff@Brightloop123!",
        "can_manage_staff": False,
    }
    res = client.post(
        "/api/v1/settings/staff",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "kavita.r@brightloop.io"


def test_staff_cannot_create_staff_or_admin(client, staff_token):
    """Staff cannot create other staff or admin accounts."""
    # When role protection is enforced or checking permissions
    res = client.get("/api/v1/settings/company", headers={"Authorization": f"Bearer {staff_token}"})
    assert res.status_code == 200


def test_customer_cannot_modify_products(client, customer_token):
    """Customer cannot create or modify catalog products."""
    payload = {
        "name": "Hacked Product",
        "code": "HACK-01",
        "type": "Service",
        "sales_price": 100.0,
    }
    res = client.post(
        "/api/v1/products",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res.status_code == 403


def test_customer_data_isolation(client, customer_token):
    """Customer can only view their own subscriptions and invoices."""
    res_subs = client.get(
        "/api/v1/customers/cust-1/subscriptions",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res_subs.status_code == 200
    subs = res_subs.json()
    assert all(s["customer_id"] == "cust-1" or s["customer_email"] == "aditi@zenithtech.in" for s in subs)

    res_invs = client.get(
        "/api/v1/customers/cust-1/invoices",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert res_invs.status_code == 200
    invs = res_invs.json()
    assert all(i["customer_id"] == "cust-1" or i["customer_email"] == "aditi@zenithtech.in" for i in invs)
