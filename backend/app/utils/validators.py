"""
Brightloop Data Validators
Validates Indian GSTIN, PAN, Email formats, and Business Rules.
"""

import re
from typing import Optional

# Standard Indian GSTIN Regex: 2 digits state code + 10 char PAN + 1 entity code + 1 char 'Z' + 1 checksum
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

# Indian PAN Regex: 5 letters + 4 numbers + 1 letter
PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")

# RFC 5322 compatible email pattern
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_gstin(gstin: Optional[str]) -> bool:
    """Validates an Indian 15-character Goods & Services Tax Identification Number (GSTIN)."""
    if not gstin:
        return True  # Optional field
    clean = gstin.strip().upper()
    return bool(GSTIN_REGEX.match(clean))


def validate_pan(pan: Optional[str]) -> bool:
    """Validates an Indian 10-character Permanent Account Number (PAN)."""
    if not pan:
        return True
    clean = pan.strip().upper()
    return bool(PAN_REGEX.match(clean))


def validate_email(email: str) -> bool:
    """Validates standard email address format."""
    if not email:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))
