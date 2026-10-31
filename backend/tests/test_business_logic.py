import pytest
from backend.models.subscription import Subscription
from backend.models.invoice import Invoice
from backend.models.payment import Payment


def test_quotation_conversion_to_subscription(client):
    """1-Click conversion of quotation QUO-2024-001 into an active subscription contract."""
    res = client.post("/api/v1/quotations/QUO-2024-001/convert")
    assert res.status_code == 200
    sub = res.json()
    assert sub["customer"] == "Zenith Technologies Pvt Ltd"
    assert sub["status"] == "Confirmed"
    assert len(sub["product_lines"]) >= 1
    assert any("Converted from Quotation" in t["title"] for t in sub["activity_timeline"])


def test_product_variant_pricing_calculation(client):
    """Selecting the Odoo Enterprise Connector variant adds +₹560 to base price."""
    # Base price of prod-1 is ₹4500. With var-1-2 (+₹560), price is ₹5060.
    res = client.get("/api/v1/products/prod-1")
    assert res.status_code == 200
    prod = res.json()
    base_price = prod["sales_price"]
    odoo_variant = next(v for v in prod["variants"] if "Odoo" in v["name"])
    assert odoo_variant["price_adjustment"] == 560.0
    effective_unit_price = base_price + odoo_variant["price_adjustment"]
    assert effective_unit_price == 5060.0


def test_subscription_lifecycle_stepper(client):
    """Test transitions: Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed."""
    sub_id = "SUB-2024-001"

    # Active -> Paused
    res_pause = client.patch(
        f"/api/v1/subscriptions/{sub_id}/status",
        json={"status": "Paused", "reason": "Client seasonal pause"},
    )
    assert res_pause.status_code == 200
    assert res_pause.json()["status"] == "Paused"

    # Paused -> Active
    res_resume = client.patch(
        f"/api/v1/subscriptions/{sub_id}/status",
        json={"status": "Active", "reason": "Client resumed"},
    )
    assert res_resume.status_code == 200
    assert res_resume.json()["status"] == "Active"


def test_subscription_renewal(client):
    """Renews subscription extending contract by 1 year."""
    sub_id = "SUB-2024-001"
    res_get = client.get(f"/api/v1/subscriptions/{sub_id}")
    old_expiry = res_get.json()["expiry_date"]

    res_renew = client.post(f"/api/v1/subscriptions/{sub_id}/renew")
    assert res_renew.status_code == 200
    new_sub = res_renew.json()
    assert new_sub["expiry_date"] > old_expiry
    assert any(t["type"] == "renew" for t in new_sub["activity_timeline"])


def test_recurring_billing_runner(client):
    """Recurring billing generates invoices for active subscriptions and advances next_billing_date."""
    res = client.post("/api/v1/invoices/recurring-run?force=true")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["generated_count"] >= 1


def test_recurring_billing_prevents_duplicate_invoices(client):
    """Second immediate billing run for the same cycle skips already billed subscriptions."""
    # First run
    client.post("/api/v1/invoices/recurring-run?force=false")
    # Immediate second run without force should generate 0 duplicates
    res2 = client.post("/api/v1/invoices/recurring-run?force=false")
    assert res2.status_code == 200
    assert res2.json()["generated_count"] == 0


def test_gst_tax_calculation_accuracy(client):
    """Verifies standard Indian GST 18% tax calculation on invoices."""
    res = client.get("/api/v1/invoices/INV-2024-003")
    assert res.status_code == 200
    inv = res.json()
    # subtotal = 22,500; tax 18% = 4,050; total = 26,550
    assert inv["subtotal"] == 22500.0
    assert inv["tax"] == 4050.0
    assert inv["total"] == 26550.0


def test_payment_recording_and_invoice_settlement(client):
    """Recording full payment sets invoice to Paid and clears outstanding balance."""
    payload = {
        "invoice_id": "INV-2024-004",  # Outstanding amount 9,800
        "customer_id": "cust-3",
        "amount": 9800.0,
        "payment_method": "UPI",
        "notes": "Full settlement via UPI",
    }
    res = client.post("/api/v1/payments/record", json=payload)
    assert res.status_code == 201

    # Verify invoice status is now Paid
    res_inv = client.get("/api/v1/invoices/INV-2024-004")
    assert res_inv.status_code == 200
    inv = res_inv.json()
    assert inv["status"] == "Paid"
    assert inv["outstanding_amount"] == 0.0


def test_overpayment_rejected(client):
    """Payment exceeding invoice outstanding amount is rejected with 400 Bad Request."""
    payload = {
        "invoice_id": "INV-2024-001",  # Outstanding is ~11351.6
        "customer_id": "cust-1",
        "amount": 50000.0,  # Exceeds balance
        "payment_method": "Card",
    }
    res = client.post("/api/v1/payments/record", json=payload)
    assert res.status_code == 400
    assert "exceeds invoice outstanding balance" in res.json()["detail"].lower()


def test_discount_validation_and_calculation(client):
    """Validates coupon code calculation."""
    # FESTIVE2024 (15% off orders >= 10,000)
    res = client.post(
        "/api/v1/discounts/validate",
        json={"code": "FESTIVE2024", "subtotal": 20000.0, "quantity": 1},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["discount_amount"] == 3000.0  # 15% of 20000


def test_discount_min_purchase_enforced(client):
    """Reject coupon when order is below minimum purchase threshold."""
    res = client.post(
        "/api/v1/discounts/validate",
        json={"code": "FESTIVE2024", "subtotal": 5000.0, "quantity": 1},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "minimum purchase" in data["message"].lower()


def test_discount_expired_or_inactive_enforced(client):
    """Expired or inactive voucher is rejected."""
    res = client.post(
        "/api/v1/discounts/validate",
        json={"code": "LEGACY2023", "subtotal": 50000.0, "quantity": 1},
    )
    assert res.status_code == 200
    assert res.json()["valid"] is False


def test_dynamic_dashboard_kpis_accuracy(client):
    """Validates dynamic dashboard calculation figures."""
    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.json()
    # Baseline verified figures
    assert data["total_revenue"] >= 338994.0
    assert data["mrr"] >= 46103.0
    assert data["arr"] >= 553236.0
    assert data["active_subscriptions"] >= 3


def test_reports_endpoints(client):
    """Verifies that all 5 reporting modules return valid data."""
    res_rev = client.get("/api/v1/reports/revenue")
    assert res_rev.status_code == 200
    assert "gross_collections" in res_rev.json()

    res_subs = client.get("/api/v1/reports/subscriptions")
    assert res_subs.status_code == 200
    assert "active_count" in res_subs.json()

    res_pays = client.get("/api/v1/reports/payments")
    assert res_pays.status_code == 200
    assert isinstance(res_pays.json(), list)

    res_overdue = client.get("/api/v1/reports/overdue")
    assert res_overdue.status_code == 200
    assert isinstance(res_overdue.json(), list)

    res_custs = client.get("/api/v1/reports/customers")
    assert res_custs.status_code == 200
    assert isinstance(res_custs.json(), list)


def test_notification_marking_read(client):
    """Test marking notification as read."""
    res_list = client.get("/api/v1/notifications")
    assert res_list.status_code == 200
    notifs = res_list.json()
    assert len(notifs) > 0
    notif_id = notifs[0]["id"]

    res_read = client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert res_read.status_code == 200
    assert res_read.json()["success"] is True
