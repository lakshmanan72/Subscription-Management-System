"""
Subscription Contract and Lifecycle Tests
Tests recurring billing intervals (Daily, Weekly, Monthly, Yearly), lifecycle transitions, and renewals.
"""

from datetime import date
import pytest

from app.services.subscription_service import ALLOWED_TRANSITIONS
from app.utils.date_utils import calculate_expiry_date, calculate_next_billing_date


def test_billing_date_intervals():
    start = date(2024, 1, 15)

    # Daily: 2024-01-15 -> 2024-01-16
    assert calculate_next_billing_date(start, "Daily") == date(2024, 1, 16)

    # Weekly: 2024-01-15 -> 2024-01-22
    assert calculate_next_billing_date(start, "Weekly") == date(2024, 1, 22)

    # Monthly: 2024-01-15 -> 2024-02-15
    assert calculate_next_billing_date(start, "Monthly") == date(2024, 2, 15)

    # Yearly: 2024-01-15 -> 2025-01-15
    assert calculate_next_billing_date(start, "Yearly") == date(2025, 1, 15)


def test_month_end_date_math():
    # January 31 + 1 month in non-leap year -> February 28
    jan31 = date(2023, 1, 31)
    feb_end = calculate_next_billing_date(jan31, "Monthly")
    assert feb_end == date(2023, 2, 28)

    # January 31 in leap year (2024) -> February 29
    jan31_leap = date(2024, 1, 31)
    feb_leap = calculate_next_billing_date(jan31_leap, "Monthly")
    assert feb_leap == date(2024, 2, 29)


def test_subscription_state_machine_rules():
    # Draft can transition to Quotation, Confirmed, Active, Closed
    assert "Active" in ALLOWED_TRANSITIONS["Draft"]

    # Active can transition to Paused or Closed
    assert "Paused" in ALLOWED_TRANSITIONS["Active"]
    assert "Closed" in ALLOWED_TRANSITIONS["Active"]
    assert "Draft" not in ALLOWED_TRANSITIONS["Active"]  # Invalid backward jump

    # Paused can transition to Active (resume) or Closed
    assert "Active" in ALLOWED_TRANSITIONS["Paused"]
    assert "Closed" in ALLOWED_TRANSITIONS["Paused"]


def test_contract_expiry_date():
    start = date(2024, 1, 15)
    expiry = calculate_expiry_date(start, duration_days=365)
    assert expiry == date(2025, 1, 14)
