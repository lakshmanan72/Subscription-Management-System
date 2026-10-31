"""
Financial Calculations and Validators Tests
Tests Decimal arithmetic, Indian GST formulas, promotional discounts, and GSTIN/PAN regex checks.
"""

from decimal import Decimal
import pytest

from app.utils.calculations import (
    calculate_discount_amount, calculate_document_totals,
    calculate_gst_breakdown, calculate_line_subtotal,
    calculate_variant_price, round_currency
)
from app.utils.validators import validate_email, validate_gstin, validate_pan


def test_currency_rounding():
    val1 = Decimal("100.125")
    val2 = Decimal("100.124")
    assert round_currency(val1) == Decimal("100.13")
    assert round_currency(val2) == Decimal("100.12")


def test_line_subtotal():
    assert calculate_line_subtotal(Decimal("4500.00"), 5) == Decimal("22500.00")
    assert calculate_line_subtotal(Decimal("8900.50"), 2) == Decimal("17801.00")


def test_percentage_discount_calculation():
    # 15% discount on ₹10,000 with min_purchase of ₹10,000 -> ₹1,500
    disc = calculate_discount_amount(
        amount=Decimal("10000.00"),
        discount_type="percentage",
        discount_value=Decimal("15.00"),
        min_purchase=Decimal("10000.00")
    )
    assert disc == Decimal("1500.00")

    # Below minimum purchase -> ₹0.00
    disc_below = calculate_discount_amount(
        amount=Decimal("8000.00"),
        discount_type="percentage",
        discount_value=Decimal("15.00"),
        min_purchase=Decimal("10000.00")
    )
    assert disc_below == Decimal("0.00")


def test_fixed_discount_calculation():
    # ₹500 flat discount on ₹4,000 -> ₹500
    disc = calculate_discount_amount(
        amount=Decimal("4000.00"),
        discount_type="fixed",
        discount_value=Decimal("500.00"),
        min_purchase=Decimal("4000.00")
    )
    assert disc == Decimal("500.00")

    # Fixed discount cannot exceed the subtotal
    disc_excess = calculate_discount_amount(
        amount=Decimal("300.00"),
        discount_type="fixed",
        discount_value=Decimal("500.00"),
        min_purchase=Decimal("0.00")
    )
    assert disc_excess == Decimal("300.00")


def test_gstin_validator():
    # Valid Indian GSTIN format
    assert validate_gstin("29ABCDE1234F1Z5") is True
    assert validate_gstin("27AABCA5678B1Z9") is True
    assert validate_gstin("33AABCS9988D1Z2") is True
    assert validate_gstin(None) is True  # Optional field

    # Invalid GSTIN format
    assert validate_gstin("INVALID_GSTIN") is False
    assert validate_gstin("12345") is False
    assert validate_gstin("29ABCDE1234F1Z") is False  # 14 chars, must be 15


def test_pan_validator():
    # Valid Indian PAN
    assert validate_pan("AABCB1234F") is True
    assert validate_pan(None) is True

    # Invalid PAN
    assert validate_pan("INVALID_PAN") is False
    assert validate_pan("12345AABCB") is False


def test_email_validator():
    assert validate_email("priyanka@brightloop.io") is True
    assert validate_email("aditi@zenithtech.in") is True
    assert validate_email("not-an-email") is False
    assert validate_email("") is False
