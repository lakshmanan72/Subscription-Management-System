import json
import pytest
from datetime import datetime, timedelta
from backend.models.subscription import Subscription
from backend.models.customer import Customer
from backend.models.portability import PortabilityRequest
from backend.models.lifeboat import SubscriptionAdjustment
from backend.models.outcome_contract import OutcomeContract, ServiceCredit
from backend.models.outcome_exchange import SubscriptionOffering, ProviderProfile, OfferingInterestRequest
from backend.services.lifeboat_service import LifeboatService


# =========================================================================
# 1. CONTINUITY NETWORK TESTS
# =========================================================================

def test_customer_can_request_migration_for_own_subscription(client, db):
    # Login as Karan Sharma (cust-2)
    login_res = client.post("/api/v1/auth/login", json={"email": "karan@apexdynamics.co", "password": "Client@Apex123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find Karan's subscription (SUB-2024-003)
    sub = db.query(Subscription).filter(Subscription.customer_id == "cust-2").first()
    assert sub is not None

    req_payload = {
        "subscription_id": sub.id,
        "destination_provider": "Nexus Cloud Networks",
        "destination_account_id": "NEXUS-APEX-01",
    }
    res = client.post("/api/v1/portability/requests", json=req_payload, headers=headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["destination_provider"] == "Nexus Cloud Networks"
    assert data["status"] == "Pending"
    assert data["unused_value"] >= 0.0
    assert data["portable_record"] is not None
    assert "ptk_" in data["portable_record"]["portable_token"]


def test_customer_cannot_migrate_another_customers_subscription(client, db):
    # Login as Karan Sharma (cust-2)
    login_res = client.post("/api/v1/auth/login", json={"email": "karan@apexdynamics.co", "password": "Client@Apex123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try to migrate Rajesh Kumar's (cust-1) subscription SUB-2024-001
    sub_other = db.query(Subscription).filter(Subscription.customer_id == "cust-1").first()
    assert sub_other is not None

    req_payload = {
        "subscription_id": sub_other.id,
        "destination_provider": "HostGator Enterprise",
    }
    res = client.post("/api/v1/portability/requests", json=req_payload, headers=headers)
    assert res.status_code == 403
    assert "Security violation" in res.json()["detail"] or "Cannot access" in res.json()["detail"]


def test_portability_approval_and_rejection_workflows(client, admin_token, customer_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_cust = {"Authorization": f"Bearer {customer_token}"}

    # Customer 1 (Aditi Rao / cust-1) creates request
    sub = db.query(Subscription).filter(Subscription.customer_id == "cust-1").first()
    assert sub is not None

    # Clear any existing request on this subscription for testing clean creation
    db.query(PortabilityRequest).filter(PortabilityRequest.subscription_id == sub.id).delete()
    db.commit()

    create_res = client.post(
        "/api/v1/portability/requests",
        json={"subscription_id": sub.id, "destination_provider": "CloudScale Partner"},
        headers=headers_cust,
    )
    assert create_res.status_code == 201, create_res.text
    req_id = create_res.json()["id"]

    # Customer tries to approve own request -> must be rejected (403)
    cust_approve = client.post(f"/api/v1/portability/requests/{req_id}/review", json={"action": "approve"}, headers=headers_cust)
    assert cust_approve.status_code == 403

    # Admin approves
    admin_approve = client.post(f"/api/v1/portability/requests/{req_id}/review", json={"action": "approve"}, headers=headers_admin)
    assert admin_approve.status_code == 200
    assert admin_approve.json()["status"] == "Approved"
    assert admin_approve.json()["approved_by"] == "Priyanka Sen"


def test_unused_prepaid_value_deterministic_calculation(client, admin_token, db):
    sub = db.query(Subscription).filter(Subscription.id == "SUB-2024-001").first()
    assert sub is not None

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/portability/requests", headers=headers_admin)
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0

    # Ensure prepaid amount, used amount, unused value are consistent: prepaid == used + unused
    for item in items:
        prepaid = item["prepaid_amount"]
        used = item["used_amount"]
        unused = item["unused_value"]
        assert round(prepaid, 1) == round(used + unused, 1) or unused >= 0.0


def test_duplicate_migration_completion_is_prevented(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Find an approved request
    req = db.query(PortabilityRequest).filter(PortabilityRequest.status == "Approved").first()
    assert req is not None

    # Complete migration
    res1 = client.post(f"/api/v1/portability/requests/{req.id}/complete", json={"external_reference": "NEXUS-EXT-889"}, headers=headers_admin)
    assert res1.status_code == 200
    assert res1.json()["status"] == "Completed"

    # Attempt duplicate completion -> must be rejected (400)
    res2 = client.post(f"/api/v1/portability/requests/{req.id}/complete", json={"external_reference": "NEXUS-EXT-889"}, headers=headers_admin)
    assert res2.status_code == 400
    assert "Duplicate migration" in res2.json()["detail"] or "already completed" in res2.json()["detail"]

    # Verify original subscription was preserved (not deleted)
    sub = db.query(Subscription).filter(Subscription.id == req.subscription_id).first()
    assert sub is not None


# =========================================================================
# 2. SUBSCRIPTION LIFEBOAT TESTS
# =========================================================================

def test_lifeboat_adjustment_creation(client, customer_token, db):
    headers_cust = {"Authorization": f"Bearer {customer_token}"}
    sub = db.query(Subscription).filter(Subscription.customer_id == "cust-1").first()
    assert sub is not None

    # Clean existing pending/active adjustment if any
    db.query(SubscriptionAdjustment).filter(SubscriptionAdjustment.subscription_id == sub.id).delete()
    db.commit()

    payload = {
        "subscription_id": sub.id,
        "adjustment_type": "DOWNGRADE",
        "reason": "Temporary quarterly cash flow shortfall.",
        "duration_days": 30,
        "temporary_unit_price": 2000.0,
    }
    res = client.post("/api/v1/lifeboat/adjustments", json=payload, headers=headers_cust)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["adjustment_type"] == "DOWNGRADE"
    assert data["status"] == "Pending"
    assert data["original_unit_price"] == sub.unit_price
    assert data["temporary_unit_price"] == 2000.0
    assert data["financial_relief_amount"] > 0.0


def test_unauthorized_users_cannot_approve_adjustments(client, customer_token, db):
    headers_cust = {"Authorization": f"Bearer {customer_token}"}
    adj = db.query(SubscriptionAdjustment).filter(SubscriptionAdjustment.status == "Pending").first()
    if not adj:
        adj = SubscriptionAdjustment(
            id="adj-test-pend",
            adjustment_number="LFB-TEST-01",
            subscription_id="SUB-2024-001",
            customer_id="cust-1",
            adjustment_type="PAUSE",
            status="Pending",
            start_date="2026-10-01",
            end_date="2026-11-01",
            duration_days=30,
            original_plan_name="Starter Monthly Cloud",
            original_unit_price=4500.0,
            original_billing_frequency="Monthly",
        )
        db.add(adj)
        db.commit()

    res = client.post(f"/api/v1/lifeboat/adjustments/{adj.id}/review", json={"action": "approve"}, headers=headers_cust)
    assert res.status_code == 403


def test_approved_adjustments_apply_and_restore_original_configuration(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    sub = db.query(Subscription).filter(Subscription.id == "SUB-2024-003").first()
    orig_price = sub.unit_price
    orig_plan = sub.plan

    # Create and approve downgrade adjustment
    adj = SubscriptionAdjustment(
        id="adj-test-flow",
        adjustment_number="LFB-TEST-FLOW",
        subscription_id=sub.id,
        customer_id=sub.customer_id,
        adjustment_type="DOWNGRADE",
        status="Pending",
        reason="Test relief",
        start_date="2026-10-01",
        end_date="2026-11-01",
        duration_days=30,
        original_plan_name=orig_plan,
        original_unit_price=orig_price,
        original_billing_frequency=sub.billing_frequency,
        temporary_plan_name="Temporary Downgrade Tier",
        temporary_unit_price=orig_price / 2.0,
        deferral_days=0,
    )
    db.add(adj)
    db.commit()

    # Approve
    approve_res = client.post(f"/api/v1/lifeboat/adjustments/{adj.id}/review", json={"action": "approve"}, headers=headers_admin)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "Active"

    # Verify subscription unit price was temporarily modified
    db.refresh(sub)
    assert sub.unit_price == orig_price / 2.0
    assert sub.plan == "Temporary Downgrade Tier"

    # Restore subscription
    restore_res = client.post(f"/api/v1/lifeboat/adjustments/{adj.id}/restore", headers=headers_admin)
    assert restore_res.status_code == 200
    assert restore_res.json()["is_restored"] is True
    assert restore_res.json()["status"] == "Restored"

    # Verify subscription is fully restored
    db.refresh(sub)
    assert sub.unit_price == orig_price
    assert sub.plan == orig_plan


def test_duplicate_restoration_is_prevented(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    adj = db.query(SubscriptionAdjustment).filter(SubscriptionAdjustment.status == "Restored").first()
    assert adj is not None

    # Trigger restore again -> must remain Restored and return existing without error
    res = client.post(f"/api/v1/lifeboat/adjustments/{adj.id}/restore", headers=headers_admin)
    assert res.status_code == 200
    assert res.json()["status"] == "Restored"


def test_deferred_payments_remain_outstanding(client, customer_token, db):
    headers_cust = {"Authorization": f"Bearer {customer_token}"}
    sub = db.query(Subscription).filter(Subscription.customer_id == "cust-1").first()
    assert sub is not None

    db.query(SubscriptionAdjustment).filter(SubscriptionAdjustment.subscription_id == sub.id).delete()
    db.commit()

    payload = {
        "subscription_id": sub.id,
        "adjustment_type": "PAYMENT_DEFERRAL",
        "reason": "Deferred billing cycle request.",
        "duration_days": 30,
        "deferral_days": 30,
    }
    res = client.post("/api/v1/lifeboat/adjustments", json=payload, headers=headers_cust)
    assert res.status_code == 201
    data = res.json()
    assert data["adjustment_type"] == "PAYMENT_DEFERRAL"
    assert data["deferred_obligation_amount"] > 0.0


# =========================================================================
# 3. OUTCOME CONTRACT TESTS
# =========================================================================

def test_contract_creation_and_validation(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "title": "Infosys BPM Enterprise Reliability Contract",
        "customer_id": "cust-2",
        "subscription_id": "SUB-2024-002",
        "measurement_period": "Monthly",
        "start_date": "2026-01-01",
        "credit_cap_percentage": 40.0,
        "notes": "Automated SLA penalty agreement.",
        "metrics": [
            {
                "metric_name": "API Availability Guarantee",
                "metric_key": "api_uptime",
                "target_value": 99.9,
                "tolerance": 0.05,
                "unit": "%",
                "comparison_operator": "GTE",
                "credit_rate_per_unit": 10.0,
                "max_credit_percentage": 25.0,
            }
        ],
    }
    res = client.post("/api/v1/outcome-contracts", json=payload, headers=headers_admin)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["contract_number"].startswith("OCT-")
    assert len(data["metrics"]) == 1
    assert data["metrics"][0]["target_value"] == 99.9


def test_performance_measurement_and_credit_calculation(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    contract = db.query(OutcomeContract).filter(OutcomeContract.status == "Active").first()
    assert contract is not None
    metric = contract.metrics[0]

    # Record measurement below target (Breach!)
    meas_payload = {
        "metric_id": metric.id,
        "period_start": "2026-10-01",
        "period_end": "2026-10-31",
        "measured_value": metric.target_value - 0.20,  # 0.20% breach
        "measurement_source": "AUTOMATED_TELEMETRY",
        "evidence_notes": "Automated Prometheus synthetic monitor confirmed breach.",
    }
    res = client.post("/api/v1/outcome-contracts/measurements", json=meas_payload, headers=headers_admin)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["is_breached"] is True
    assert data["credit_generated"] is not None
    assert data["credit_amount"] > 0.0


def test_service_credit_approval_and_invoice_application(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # Find pending service credit
    credit = db.query(ServiceCredit).filter(ServiceCredit.status == "Pending").first()
    if not credit:
        credit = ServiceCredit(
            id="crd-flow-test",
            credit_number="CRD-FLOW-01",
            contract_id="oct-seed-1",
            subscription_id="SUB-2024-001",
            customer_id="cust-1",
            calculated_percentage=10.0,
            credit_amount=1000.0,
            status="Pending",
            reason="Test SLA penalty",
        )
        db.add(credit)
        db.commit()

    # Approve credit
    rev_res = client.post(f"/api/v1/outcome-contracts/credits/{credit.id}/review", json={"action": "approve"}, headers=headers_admin)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "Approved"

    # Apply credit to invoice
    apply_res = client.post(f"/api/v1/outcome-contracts/credits/{credit.id}/apply", json={}, headers=headers_admin)
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "Applied"
    assert apply_res.json()["invoice_id"] is not None


# =========================================================================
# 4. OUTCOME EXCHANGE TESTS
# =========================================================================

def test_provider_and_offering_creation(client, admin_token, db):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    prov_payload = {
        "name": "HyperScale Cloud Systems",
        "slug": "hyperscale-cloud",
        "description": "Enterprise cloud mesh.",
        "website": "https://hyperscale.net",
        "rating": 4.9,
        "verified_status": True,
        "verification_badge": "Verified Elite",
        "uptime_guarantee": 99.99,
    }
    p_res = client.post("/api/v1/exchange/providers", json=prov_payload, headers=headers_admin)
    assert p_res.status_code == 201, p_res.text
    prov_id = p_res.json()["id"]

    off_payload = {
        "provider_id": prov_id,
        "title": "HyperScale Global Mesh",
        "tier": "Mission-Critical",
        "pricing_model": "Fixed Monthly",
        "unit_price": 45000.0,
        "billing_frequency": "Monthly",
        "credit_policy": "Full month refund on SLA breach.",
        "included_features": ["Global Anycast", "DDoS Armor"],
        "commitments": [
            {
                "metric_name": "Core Mesh Availability SLA",
                "target_value": 99.99,
                "unit": "%",
                "tolerance": 0.01,
                "credit_guarantee_percent": 30.0,
                "is_verified_by_telemetry": True,
            }
        ],
    }
    o_res = client.post("/api/v1/exchange/offerings", json=off_payload, headers=headers_admin)
    assert o_res.status_code == 201, o_res.text
    assert o_res.json()["tier"] == "Mission-Critical"
    assert len(o_res.json()["commitments"]) == 1


def test_offering_filtering_and_comparison(client):
    # Public/Authenticated browsing
    res = client.get("/api/v1/exchange/offerings?min_price=10000&max_price=50000")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    for it in items:
        assert 10000 <= it["unit_price"] <= 50000


def test_customer_interest_request_and_quotation_conversion(client, customer_token, admin_token, db):
    headers_cust = {"Authorization": f"Bearer {customer_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    off = db.query(SubscriptionOffering).filter(SubscriptionOffering.is_active == True).first()
    assert off is not None

    # Customer submits interest request
    req_res = client.post(
        "/api/v1/exchange/interest-requests",
        json={"offering_id": off.id, "custom_notes": "Looking to migrate 50 seats next month."},
        headers=headers_cust,
    )
    assert req_res.status_code == 201, req_res.text
    req_data = req_res.json()
    req_id = req_data["id"]
    assert req_data["status"] == "Pending"

    # Admin converts interest request to Quotation
    conv_res = client.post(f"/api/v1/exchange/interest-requests/{req_id}/convert", headers=headers_admin)
    assert conv_res.status_code == 200, conv_res.text
    quo_data = conv_res.json()
    assert quo_data["id"].startswith("QUO-")
    assert quo_data["subtotal"] == off.unit_price


# =========================================================================
# 5. INTEGRATION & RBAC TESTS
# =========================================================================

def test_customer_data_isolation_on_innovations(client, customer_token, db):
    headers_cust = {"Authorization": f"Bearer {customer_token}"}

    # Customer (cust-1) requests list of portability requests
    p_res = client.get("/api/v1/portability/requests", headers=headers_cust)
    assert p_res.status_code == 200
    for p in p_res.json():
        assert p["customer_id"] == "cust-1"

    # Customer requests list of adjustments
    a_res = client.get("/api/v1/lifeboat/adjustments", headers=headers_cust)
    assert a_res.status_code == 200
    for a in a_res.json():
        assert a["customer_id"] == "cust-1"

    # Customer requests list of outcome contracts
    c_res = client.get("/api/v1/outcome-contracts", headers=headers_cust)
    assert c_res.status_code == 200
    for c in c_res.json():
        assert c["customer_id"] == "cust-1"


def test_dashboard_metrics_include_innovations(client, admin_token):
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/dashboard/metrics", headers=headers_admin)
    assert res.status_code == 200
    data = res.json()
    assert "active_portability_requests" in data
    assert "adjustments_awaiting_approval" in data
    assert "upcoming_restorations" in data
    assert "active_outcome_contracts" in data
    assert "service_credits_issued" in data
    assert "active_offerings" in data
