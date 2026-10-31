"""
Quotation Business Logic Tests
Tests multi-line quote builders, GST computations, discounts, and conversion rules.
"""

from datetime import date
from decimal import Decimal
import pytest

from app.schemas.quotation import QuotationCreate, QuotationLineCreate
from app.utils.calculations import calculate_document_totals


def test_quotation_calculations_matching_mock_data():
    """
    Validates QUO-2024-001 numbers from mock data:
    Quantity: 2, Unit Price: ₹5,060 (₹4,500 + ₹560), Discount: ₹500
    Gross Subtotal = 2 * 5060 = ₹10,120
    Taxable = 10120 - 500 = ₹9,620
    Tax (18%) = 9620 * 0.18 = ₹1,731.60
    Total = 9620 + 1731.60 = ₹11,351.60
    """
    lines = [
        {
            "product_id": "prod-1",
            "product_name": "Brightloop CRM & Lead Engine",
            "quantity": 2,
            "unit_price": Decimal("5060.00"),
            "discount": Decimal("500.00"),
            "tax_rate": Decimal("18.00")
        }
    ]
    totals = calculate_document_totals(lines, document_discount=Decimal("0.00"))

    assert totals["subtotal"] == Decimal("10120.00")
    assert totals["tax"] == Decimal("1731.60")
    assert totals["total"] == Decimal("11351.60")
    assert totals["cgst_amount"] == Decimal("865.80")
    assert totals["sgst_amount"] == Decimal("865.80")
    assert totals["cgst_amount"] + totals["sgst_amount"] == totals["tax"]


def test_quotation_schema_validation():
    valid_data = {
        "customer_id": "cust-1",
        "template_name": "Standard SaaS Annual Package",
        "date": date(2024, 10, 12),
        "validity_date": date(2024, 11, 12),
        "status": "Confirmed",
        "lines": [
            {
                "product_id": "prod-1",
                "product_name": "Brightloop CRM & Lead Engine",
                "quantity": 2,
                "unit_price": Decimal("5060.00"),
                "tax_rate": Decimal("18.00")
            }
        ]
    }
    quo = QuotationCreate(**valid_data)
    assert quo.customer_id == "cust-1"
    assert len(quo.lines) == 1
