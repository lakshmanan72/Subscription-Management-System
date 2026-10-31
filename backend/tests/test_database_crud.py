import pytest
from backend.models.product import Product, ProductVariant
from backend.models.quotation import Quotation, QuotationLine
from backend.models.customer import Customer
from backend.models.plan import Plan


def test_product_and_variants_crud(client, admin_token):
    """Test full CRUD cycle for product with variants."""
    payload = {
        "name": "Cloud API Gateway",
        "code": "BL-GW-99",
        "type": "Service",
        "sales_price": 5000.0,
        "cost_price": 1500.0,
        "status": "Active",
        "description": "High performance API gateway.",
        "variants": [
            {"name": "Standard Rate Limit", "price_adjustment": 0.0, "sku": "GW-STD"},
            {"name": "Unlimited Throughput", "price_adjustment": 2500.0, "sku": "GW-UNLTD"},
        ],
    }

    # 1. Create
    res = client.post("/api/v1/products", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    prod = res.json()
    prod_id = prod["id"]
    assert len(prod["variants"]) == 2

    # 2. Read
    res_get = client.get(f"/api/v1/products/{prod_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Cloud API Gateway"

    # 3. Update
    res_put = client.put(
        f"/api/v1/products/{prod_id}",
        json={"sales_price": 5500.0, "description": "Updated description"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_put.status_code == 200
    assert res_put.json()["sales_price"] == 5500.0

    # 4. Delete
    res_del = client.delete(f"/api/v1/products/{prod_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_del.status_code == 200

    # Verify deleted
    res_verify = client.get(f"/api/v1/products/{prod_id}")
    assert res_verify.status_code == 404


def test_plan_crud_and_status_toggle(client, admin_token):
    """Test plan creation, retrieval, status toggle, and update."""
    payload = {
        "plan_name": "API Developer Tier",
        "billing_frequency": "Monthly",
        "price": 2999.0,
        "min_quantity": 1,
        "status": "Active",
    }
    # Create
    res = client.post("/api/v1/plans", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 201
    plan_id = res.json()["id"]

    # Toggle status
    res_toggle = client.patch(f"/api/v1/plans/{plan_id}/status", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_toggle.status_code == 200
    assert res_toggle.json()["status"] == "Disabled"

    # Toggle back
    res_toggle2 = client.patch(f"/api/v1/plans/{plan_id}/status", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_toggle2.status_code == 200
    assert res_toggle2.json()["status"] == "Active"

    # Delete
    client.delete(f"/api/v1/plans/{plan_id}", headers={"Authorization": f"Bearer {admin_token}"})


def test_customer_crud(client):
    """Test customer creation and retrieval."""
    payload = {
        "name": "Sunil Verma",
        "company": "Verma Logistics Solutions",
        "email": "sunil@vermalogistics.in",
        "phone": "+91 91234 56789",
        "city": "Hyderabad, Telangana",
    }
    res = client.post("/api/v1/customers", json=payload)
    assert res.status_code == 201
    cust_id = res.json()["id"]

    res_get = client.get(f"/api/v1/customers/{cust_id}")
    assert res_get.status_code == 200
    assert res_get.json()["company"] == "Verma Logistics Solutions"


def test_foreign_key_and_cascade_behavior(db):
    """Verifies that cascading deletion removes associated child records."""
    # Create product and variant in DB
    p = Product(
        id="prod-cascade-test",
        name="Cascade Test Product",
        code="CASC-01",
        sales_price=1000.0,
    )
    db.add(p)
    db.flush()

    v = ProductVariant(
        id="var-cascade-test",
        product_id=p.id,
        name="Cascade Variant",
        sku="CASC-VAR-1",
    )
    db.add(v)
    db.commit()

    assert db.query(ProductVariant).filter_by(id="var-cascade-test").first() is not None

    # Delete parent product
    db.delete(p)
    db.commit()

    # Child variant must be automatically cascade deleted
    assert db.query(ProductVariant).filter_by(id="var-cascade-test").first() is None


def test_unique_constraint_enforcement(client, admin_token):
    """Product codes must be unique across the catalog."""
    payload = {
        "name": "Duplicate Code Test",
        "code": "BL-CRM-01",  # Existing code from seed
        "sales_price": 5000.0,
    }
    res = client.post("/api/v1/products", json=payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_transaction_rollback_on_failure(db):
    """Database changes must roll back completely on transaction failure."""
    try:
        cust = Customer(
            id="cust-rollback-test",
            name="Rollback Test",
            company="Fail Co",
            email="fail@example.com",
            registration_date="2024-01-01",
        )
        db.add(cust)
        db.flush()

        # Deliberately cause IntegrityError by adding customer with duplicate id
        duplicate = Customer(
            id="cust-rollback-test",
            name="Duplicate ID",
            company="Duplicate Co",
            email="dup@example.com",
            registration_date="2024-01-01",
        )
        db.add(duplicate)
        db.commit()
    except Exception:
        db.rollback()

    # Neither record should exist in the database
    assert db.query(Customer).filter_by(id="cust-rollback-test").first() is None
