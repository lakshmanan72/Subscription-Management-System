import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models.discount import Discount


class DiscountService:
    @staticmethod
    def validate_code(
        code: str,
        subtotal: float,
        quantity: int,
        product_id: Optional[str],
        subscription_id: Optional[str],
        db: Session,
    ) -> Dict[str, Any]:
        """Validates coupon code against dates, limits, minimums, and calculates discount."""
        clean_code = (code or "").strip().upper()
        if not clean_code:
            return {"valid": False, "message": "Coupon code is required.", "discount_amount": 0.0}

        discount = db.query(Discount).filter(Discount.code == clean_code).first()
        if not discount:
            return {"valid": False, "message": f'Coupon code "{clean_code}" does not exist.', "discount_amount": 0.0}

        if discount.status != "Active":
            return {"valid": False, "message": f'Coupon code "{clean_code}" is currently inactive.', "discount_amount": 0.0}

        if discount.usage_limit and (discount.usage_count or 0) >= discount.usage_limit:
            return {"valid": False, "message": "Coupon code usage limit has been reached.", "discount_amount": 0.0}

        if subtotal < (discount.min_purchase or 0.0):
            return {
                "valid": False,
                "message": f"Order amount is below minimum purchase threshold of ₹{discount.min_purchase:,.0f}.",
                "discount_amount": 0.0,
            }

        if quantity < (discount.min_quantity or 1):
            return {
                "valid": False,
                "message": f"Minimum quantity of {discount.min_quantity} seat(s) required.",
                "discount_amount": 0.0,
            }

        # Check applicable products
        if discount.applicable_products and discount.applicable_products != "all":
            try:
                allowed_prods = json.loads(discount.applicable_products)
                if product_id and product_id not in allowed_prods:
                    return {"valid": False, "message": "Coupon is not applicable to the selected product.", "discount_amount": 0.0}
            except Exception:
                pass

        # Compute discount amount
        if discount.type == "percentage":
            disc_amount = round(subtotal * (float(discount.value) / 100.0), 2)
        else:
            disc_amount = min(subtotal, float(discount.value))

        return {
            "valid": True,
            "message": f"Coupon applied! You saved ₹{disc_amount:,.2f}.",
            "discount_amount": disc_amount,
            "final_amount": round(subtotal - disc_amount, 2),
            "discount_code": discount.code,
            "discount_type": discount.type,
            "discount_value": discount.value,
        }
