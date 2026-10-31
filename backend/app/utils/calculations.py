"""
Brightloop Financial Calculation Utilities
Performs exact Decimal calculations for financial totals, variant pricing,
promotional discounts, and Indian GST (CGST/SGST vs IGST) breakdowns.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any

TWO_PLACES = Decimal("0.01")


def round_currency(value: Decimal) -> Decimal:
    """Rounds a Decimal value to 2 decimal places using standard ROUND_HALF_UP."""
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_variant_price(base_sales_price: Decimal, price_adjustment: Decimal) -> Decimal:
    """
    Computes final unit price:
    Final Price = Base Sales Price + Variant Price Adjustment.
    """
    base = Decimal(str(base_sales_price))
    adjustment = Decimal(str(price_adjustment))
    return round_currency(base + adjustment)


def calculate_line_subtotal(unit_price: Decimal, quantity: int) -> Decimal:
    """Calculates subtotal = unit_price * quantity."""
    return round_currency(Decimal(str(unit_price)) * Decimal(quantity))


def calculate_discount_amount(
    amount: Decimal,
    discount_type: str,
    discount_value: Decimal,
    min_purchase: Decimal = Decimal("0.00")
) -> Decimal:
    """
    Computes discount deduction.
    discount_type: 'percentage' or 'fixed'
    Checks minimum purchase eligibility.
    """
    subtotal = Decimal(str(amount))
    min_req = Decimal(str(min_purchase))
    if subtotal < min_req:
        return Decimal("0.00")

    val = Decimal(str(discount_value))
    if discount_type.lower() == "percentage":
        discount = subtotal * (val / Decimal("100"))
    else:  # fixed
        discount = val

    # Discount cannot exceed subtotal
    discount = min(discount, subtotal)
    return round_currency(max(Decimal("0.00"), discount))


def calculate_gst_breakdown(
    taxable_amount: Decimal,
    tax_rate: Decimal = Decimal("18.00"),
    is_interstate: bool = False
) -> Dict[str, Decimal]:
    """
    Calculates Indian GST tax split:
    - Intra-state (default): CGST = tax_rate/2, SGST = tax_rate/2
    - Inter-state: IGST = tax_rate
    """
    taxable = Decimal(str(taxable_amount))
    rate = Decimal(str(tax_rate))
    total_tax = round_currency(taxable * (rate / Decimal("100")))

    if is_interstate:
        return {
            "is_interstate": True,
            "tax_rate": rate,
            "cgst_rate": Decimal("0.00"),
            "cgst_amount": Decimal("0.00"),
            "sgst_rate": Decimal("0.00"),
            "sgst_amount": Decimal("0.00"),
            "igst_rate": rate,
            "igst_amount": total_tax,
            "total_tax": total_tax
        }
    else:
        half_rate = rate / Decimal("2")
        half_tax = round_currency(taxable * (half_rate / Decimal("100")))
        # Ensure sum matches total_tax exactly
        sgst_amount = total_tax - half_tax
        return {
            "is_interstate": False,
            "tax_rate": rate,
            "cgst_rate": half_rate,
            "cgst_amount": half_tax,
            "sgst_rate": half_rate,
            "sgst_amount": sgst_amount,
            "igst_rate": Decimal("0.00"),
            "igst_amount": Decimal("0.00"),
            "total_tax": total_tax
        }


def calculate_document_totals(
    lines: List[Dict[str, Any]],
    document_discount: Decimal = Decimal("0.00"),
    is_interstate: bool = False
) -> Dict[str, Any]:
    """
    Aggregates subtotal, line discounts, taxes, and grand totals across document lines.
    Lines expect: quantity, unit_price, tax_rate, optional line discount.
    """
    gross_subtotal = Decimal("0.00")
    total_line_discount = Decimal("0.00")
    total_line_tax = Decimal("0.00")
    total_cgst = Decimal("0.00")
    total_sgst = Decimal("0.00")
    total_igst = Decimal("0.00")

    processed_lines = []
    for line in lines:
        qty = int(line.get("quantity", 1))
        unit_price = Decimal(str(line.get("unit_price", "0.00")))
        line_discount = Decimal(str(line.get("discount", "0.00")))
        tax_rate = Decimal(str(line.get("tax_rate", "18.00")))

        line_subtotal = round_currency(unit_price * Decimal(qty))
        taxable_line = max(Decimal("0.00"), line_subtotal - line_discount)
        gst = calculate_gst_breakdown(taxable_line, tax_rate, is_interstate)

        line_total = taxable_line + gst["total_tax"]

        gross_subtotal += line_subtotal
        total_line_discount += line_discount
        total_line_tax += gst["total_tax"]
        total_cgst += gst["cgst_amount"]
        total_sgst += gst["sgst_amount"]
        total_igst += gst["igst_amount"]

        processed_lines.append({
            **line,
            "subtotal": line_subtotal,
            "discount": line_discount,
            "taxable_amount": taxable_line,
            "tax_amount": gst["total_tax"],
            "total": line_total
        })

    doc_discount = Decimal(str(document_discount))
    total_combined_discount = total_line_discount + doc_discount
    net_taxable = max(Decimal("0.00"), gross_subtotal - total_combined_discount)
    grand_total = round_currency(net_taxable + total_line_tax)

    return {
        "subtotal": round_currency(gross_subtotal),
        "discount": round_currency(total_combined_discount),
        "tax": round_currency(total_line_tax),
        "cgst_amount": round_currency(total_cgst),
        "sgst_amount": round_currency(total_sgst),
        "igst_amount": round_currency(total_igst),
        "total": grand_total,
        "processed_lines": processed_lines
    }
