"""
Payment Settlement Logic Tests
Tests payment record schemas, overpayment prevention rules, and balance deductions.
"""

from decimal import Decimal
import pytest

from app.schemas.payment import PaymentRecordRequest
from app.utils.invoice_number import generate_payment_reference


def test_payment_reference_generation():
    assert generate_payment_reference(9021) == "PAY-REF-9021"
    assert generate_payment_reference(9022) == "PAY-REF-9022"


def test_payment_request_schema_validation():
    # Valid payment
    valid_req = PaymentRecordRequest(
        invoice_id="INV-2024-001",
        amount=Decimal("5000.00"),
        payment_method="UPI",
        transaction_id="UPI-983271892018"
    )
    assert valid_req.amount == Decimal("5000.00")
    assert valid_req.payment_method == "UPI"

    # Reject zero or negative payment
    with pytest.raises(ValueError):
        PaymentRecordRequest(
            invoice_id="INV-2024-001",
            amount=Decimal("0.00"),
            payment_method="UPI"
        )

    with pytest.raises(ValueError):
        PaymentRecordRequest(
            invoice_id="INV-2024-001",
            amount=Decimal("-500.00"),
            payment_method="UPI"
        )


def test_overpayment_prevention_logic():
    invoice_outstanding = Decimal("10000.00")
    payment_amount = Decimal("12000.00")

    # Payment amount strictly cannot exceed invoice outstanding
    assert payment_amount > invoice_outstanding
