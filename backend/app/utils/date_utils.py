"""
Brightloop Date Utilities
Handles recurring billing interval math for Daily, Weekly, Monthly, and Yearly frequencies.
"""

from datetime import date, timedelta
import calendar


def add_months(source_date: date, months: int) -> date:
    """Adds a given number of calendar months, preserving month-end dates gracefully."""
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def calculate_next_billing_date(start_or_current_date: date, billing_frequency: str) -> date:
    """
    Computes the subsequent billing date based on cadence:
    - Daily: current + 1 day
    - Weekly: current + 7 days
    - Monthly: current + 1 calendar month
    - Yearly: current + 1 calendar year
    """
    freq = billing_frequency.strip().capitalize()
    if freq == "Daily":
        return start_or_current_date + timedelta(days=1)
    elif freq == "Weekly":
        return start_or_current_date + timedelta(days=7)
    elif freq == "Monthly":
        return add_months(start_or_current_date, 1)
    elif freq == "Yearly":
        return add_months(start_or_current_date, 12)
    else:
        # Default to Monthly if unspecified
        return add_months(start_or_current_date, 1)


def calculate_expiry_date(start_date: date, duration_days: int = 365) -> date:
    """Computes contract expiration date."""
    return start_date + timedelta(days=duration_days)
