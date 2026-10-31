"""
Discount Service
Promotional rules engine, campaign validations, and live coupon calculations.
"""

from datetime import date
from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import DuplicateEntityException, EntityNotFoundException
from app.models.discount import Discount
from app.repositories import DiscountRepository
from app.schemas.discount import DiscountCalculationRequest, DiscountCalculationResponse, DiscountCreate, DiscountUpdate
from app.utils.calculations import calculate_discount_amount, round_currency


class DiscountService:
    def __init__(self, discount_repo: DiscountRepository):
        self.discount_repo = discount_repo

    def list_discounts(self) -> List[Discount]:
        return self.discount_repo.get_all()

    def get_discount(self, discount_id: str) -> Discount:
        disc = self.discount_repo.get_by_id(discount_id)
        if not disc:
            raise EntityNotFoundException("Discount", discount_id)
        return disc

    def create_discount(self, request: DiscountCreate) -> Discount:
        existing = self.discount_repo.get_by_code(request.code)
        if existing:
            raise DuplicateEntityException("Discount", "code", request.code)

        disc_id = f"disc-{uuid.uuid4().hex[:6]}"
        new_disc = Discount(
            id=disc_id,
            name=request.name.strip(),
            code=request.code.strip().upper(),
            type=request.type,
            value=request.value,
            min_purchase=request.min_purchase,
            min_quantity=request.min_quantity,
            applicable_products=request.applicable_products,
            applicable_subscriptions=request.applicable_subscriptions,
            start_date=request.start_date,
            end_date=request.end_date,
            usage_limit=request.usage_limit,
            usage_count=0,
            status=request.status,
            description=request.description
        )
        return self.discount_repo.create(new_disc)

    def evaluate_discount(self, request: DiscountCalculationRequest) -> DiscountCalculationResponse:
        """
        Calculates and validates discount eligibility for a given cart or proposal amount.
        Returns detailed reason if invalid, or calculated discount if eligible.
        """
        disc = self.discount_repo.get_by_code(request.code)
        if not disc:
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason="Coupon code not found."
            )

        if disc.status != "Active":
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason="This promotional code is inactive."
            )

        today = date.today()
        if today < disc.start_date or today > disc.end_date:
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason="This coupon campaign has expired or has not started yet."
            )

        if disc.usage_count >= disc.usage_limit:
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason="This promotional voucher has reached its maximum usage limit."
            )

        if request.amount < disc.min_purchase:
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason=f"Minimum purchase amount of ₹{disc.min_purchase:,.2f} required to apply this coupon."
            )

        if request.quantity < disc.min_quantity:
            return DiscountCalculationResponse(
                is_valid=False,
                code=request.code,
                discount_amount=Decimal("0.00"),
                final_amount=request.amount,
                reason=f"Minimum quantity of {disc.min_quantity} items required."
            )

        discount_deduction = calculate_discount_amount(
            request.amount, disc.type, disc.value, disc.min_purchase
        )
        final_amt = max(Decimal("0.00"), request.amount - discount_deduction)

        return DiscountCalculationResponse(
            is_valid=True,
            code=disc.code,
            discount_amount=round_currency(discount_deduction),
            final_amount=round_currency(final_amt),
            reason=None
        )
