"""
Product and Variant Logic Tests
Tests product models, dynamic variant price adjustments, and profit margin formulas.
"""

from decimal import Decimal
import pytest

from app.schemas.product import ProductCreate, ProductVariantCreate
from app.utils.calculations import calculate_variant_price


def test_variant_price_calculation():
    # Base: Brightloop CRM (₹4,500) + Odoo Enterprise Connector (+₹560) = ₹5,060
    base_price = Decimal("4500.00")
    price_adjustment = Decimal("560.00")
    final_price = calculate_variant_price(base_price, price_adjustment)
    assert final_price == Decimal("5060.00")

    # Base: Recurring Billing (₹7,500) + Enterprise Dunning AI (+₹2,400) = ₹9,900
    base_sub = Decimal("7500.00")
    ai_add = Decimal("2400.00")
    assert calculate_variant_price(base_sub, ai_add) == Decimal("9900.00")

    # Zero adjustment (Standard Edition)
    assert calculate_variant_price(base_price, Decimal("0.00")) == Decimal("4500.00")


def test_product_schema_validation():
    # Valid product payload
    valid_data = {
        "name": "Brightloop CRM & Lead Engine",
        "code": "BL-CRM-01",
        "type": "Service",
        "sales_price": Decimal("4500.00"),
        "cost_price": Decimal("1200.00"),
        "variants": [
            {"name": "Standard Edition", "price_adjustment": Decimal("0.00")},
            {"name": "Odoo Enterprise Connector", "price_adjustment": Decimal("560.00")}
        ]
    }
    prod = ProductCreate(**valid_data)
    assert prod.name == "Brightloop CRM & Lead Engine"
    assert prod.code == "BL-CRM-01"
    assert len(prod.variants) == 2

    # Negative price rejected
    with pytest.raises(ValueError):
        ProductCreate(
            name="Negative Price Prod",
            code="BL-ERR-01",
            type="Service",
            sales_price=Decimal("-100.00"),
            cost_price=Decimal("50.00")
        )
