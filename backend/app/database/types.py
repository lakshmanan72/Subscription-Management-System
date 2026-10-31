"""
Brightloop Database Column Types
Encapsulates MySQL-optimized column types for currency, tax rates, and identifiers.
"""

from decimal import Decimal
from sqlalchemy import Numeric, String

# Standard 12-digit amount with 2 decimal places for Indian Rupee (INR) financial precision
CurrencyAmount = Numeric(precision=14, scale=2, asdecimal=True)

# Standard tax rate (e.g. 18.00%, 5.00%, 0.00%)
TaxRate = Numeric(precision=5, scale=2, asdecimal=True)

# Standard SKU / Code string
CodeString = String(length=64)

# Standard Identifier string
IdString = String(length=64)
