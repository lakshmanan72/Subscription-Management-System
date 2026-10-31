"""
Brightloop Identifier Generation Utilities
Produces sequential, enterprise-formatted numbers matching existing records:
INV-2024-0081, SUB-2024-0001, QUO-2024-001, PAY-REF-9021.
"""

from datetime import date
from typing import Optional


def get_current_year() -> int:
    return date.today().year


def generate_invoice_number(sequence: int, year: Optional[int] = None) -> str:
    """Formats invoice number: INV-{year}-{sequence:04d} (e.g. INV-2024-0081)."""
    yr = year or get_current_year()
    return f"INV-{yr}-{str(sequence).zfill(4)}"


def generate_subscription_number(sequence: int, year: Optional[int] = None) -> str:
    """Formats subscription number: SUB-{year}-{sequence:04d} (e.g. SUB-2024-0001)."""
    yr = year or get_current_year()
    return f"SUB-{yr}-{str(sequence).zfill(4)}"


def generate_quotation_number(sequence: int, year: Optional[int] = None) -> str:
    """Formats quotation number: QUO-{year}-{sequence:03d} (e.g. QUO-2024-001)."""
    yr = year or get_current_year()
    return f"QUO-{yr}-{str(sequence).zfill(3)}"


def generate_payment_reference(sequence: int) -> str:
    """Formats payment reference: PAY-REF-{sequence} (e.g. PAY-REF-9021)."""
    return f"PAY-REF-{sequence}"
