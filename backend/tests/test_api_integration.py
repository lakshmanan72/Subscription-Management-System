import pytest

def test_dashboard_metrics_matches_expected_figures(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["total_revenue"] == 338994.0
    assert data["mrr"] == 46103.0
    assert data["arr"] == 553236.0
    assert data["active_subscriptions"] == 3
    assert data["outstanding_balance"] == 49652.0
    assert data["overdue_invoices"] == 11352.0


def test_customer_portal_data_isolation(client, customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}

    # Aditi is customer cust-1 (Zenith Technologies)
    # 1. Listing subscriptions should only return Zenith Tech subscriptions
    res = client.get("/api/v1/subscriptions", headers=headers)
    assert res.status_code == 200
    subs = res.json()
    assert len(subs) > 0
    for sub in subs:
        assert sub["customer_id"] == "cust-1"

    # 2. Accessing another customer's subscription (sub-3 belongs to cust-3 Nexus) -> 403
    res_sub3 = client.get("/api/v1/subscriptions/SUB-2024-003", headers=headers)
    assert res_sub3.status_code == 403

    # 3. Accessing another customer's invoice (inv-4 belongs to cust-3) -> 403
    res_inv4 = client.get("/api/v1/invoices/INV-2024-004", headers=headers)
    assert res_inv4.status_code == 403


def test_discount_validation_api(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Valid code FESTIVE2024 (15% on >= 10000)
    res = client.post("/api/v1/discounts/validate", json={"code": "FESTIVE2024", "subtotal": 10000.0}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["discount_amount"] == 1500.0  # 15% of 10000
    assert data["final_amount"] == 8500.0

    # Invalid code
    res_inv = client.post("/api/v1/discounts/validate", json={"code": "NONEXISTENT99", "subtotal": 10000.0}, headers=headers)
    assert res_inv.status_code == 200
    assert res_inv.json()["valid"] is False


def test_reports_endpoints(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    res = client.get("/api/v1/reports/revenue", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "gross_collections" in data
    assert "total_invoiced" in data

    # CSV Export
    res_csv = client.get("/api/v1/reports/export/csv?report_type=subscriptions", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Subscription" in res_csv.text or "Customer" in res_csv.text


def test_settings_and_tax_config(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get tax config
    res_tax = client.get("/api/v1/settings/taxes", headers=headers)
    assert res_tax.status_code == 200
    tax_data = res_tax.json()
    assert isinstance(tax_data, list)
    assert len(tax_data) > 0
    assert tax_data[0]["rate"] == 18.0

    # Update company profile
    res_update = client.put(
        "/api/v1/settings/company",
        json={"name": "Brightloop Enterprise Cloud", "phone": "+91 99999 88888"},
        headers=headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Brightloop Enterprise Cloud"


def test_notifications_lifecycle(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    notes = res.json()
    if notes:
        first_id = notes[0]["id"]
        res_read = client.put(f"/api/v1/notifications/{first_id}/read", headers=headers)
        assert res_read.status_code == 200
        assert res_read.json()["status"] == "read"


def test_quotation_conversion_api(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    res = client.post("/api/v1/quotations/QUO-2024-001/convert", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["customer_id"] == "cust-1"
    assert data["status"] in ("Confirmed", "Active")
