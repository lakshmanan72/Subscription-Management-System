"""
Quotation Service
Builds itemized sales quotes, computes GST and discount totals, enforces status transitions,
and converts confirmed quotes into active subscriptions without duplicate conversion.
"""

from datetime import date
from decimal import Decimal
import uuid
from typing import List, Optional

from app.core.exceptions import BusinessRuleViolationException, EntityNotFoundException, InvalidTransitionException
from app.models.quotation import Quotation
from app.models.quotation_line import QuotationLine
from app.models.subscription import Subscription
from app.models.subscription_line import SubscriptionLine
from app.repositories import CustomerRepository, QuotationRepository, SubscriptionRepository
from app.schemas.quotation import ConvertQuotationRequest, QuotationCreate, QuotationUpdate
from app.utils.calculations import calculate_document_totals, round_currency
from app.utils.date_utils import calculate_expiry_date, calculate_next_billing_date
from app.utils.invoice_number import generate_quotation_number, generate_subscription_number


class QuotationService:
    def __init__(
        self,
        quotation_repo: QuotationRepository,
        customer_repo: CustomerRepository,
        subscription_repo: SubscriptionRepository
    ):
        self.quotation_repo = quotation_repo
        self.customer_repo = customer_repo
        self.subscription_repo = subscription_repo

    def list_quotations(self, customer_id: Optional[str] = None) -> List[Quotation]:
        if customer_id:
            return self.quotation_repo.get_by_customer(customer_id)
        return self.quotation_repo.get_all()

    def get_quotation(self, quotation_id: str) -> Quotation:
        quo = self.quotation_repo.get_by_id(quotation_id)
        if not quo:
            raise EntityNotFoundException("Quotation", quotation_id)
        return quo

    def create_quotation(self, request: QuotationCreate) -> Quotation:
        customer = self.customer_repo.get_by_id(request.customer_id)
        if not customer:
            raise EntityNotFoundException("Customer", request.customer_id)

        # Compute totals using calculations utility
        raw_lines = [l.model_dump() for l in request.lines]
        totals = calculate_document_totals(raw_lines, document_discount=request.discount or Decimal("0.00"))

        count = self.quotation_repo.count()
        quotation_id = generate_quotation_number(count + 1)

        new_quo = Quotation(
            id=quotation_id,
            customer_id=request.customer_id,
            template_name=request.template_name,
            date=request.date,
            validity_date=request.validity_date,
            status=request.status,
            subtotal=totals["subtotal"],
            tax=totals["tax"],
            discount=totals["discount"],
            total=totals["total"],
            notes=request.notes
        )
        created_quo = self.quotation_repo.create(new_quo)

        for pline in totals["processed_lines"]:
            line_id = f"ql-{uuid.uuid4().hex[:6]}"
            new_line = QuotationLine(
                id=line_id,
                quotation_id=quotation_id,
                product_id=pline["product_id"],
                product_name=pline["product_name"],
                plan_id=pline.get("plan_id"),
                plan_name=pline.get("plan_name"),
                variant_id=pline.get("variant_id"),
                variant_name=pline.get("variant_name"),
                quantity=pline["quantity"],
                unit_price=pline["unit_price"],
                tax_rate=pline["tax_rate"],
                discount=pline["discount"],
                subtotal=pline["subtotal"],
                tax_amount=pline["tax_amount"],
                total=pline["total"]
            )
            self.quotation_repo.db.add(new_line)

        self.quotation_repo.db.flush()
        return self.get_quotation(quotation_id)

    def confirm_quotation(self, quotation_id: str) -> Quotation:
        quo = self.get_quotation(quotation_id)
        if quo.status in ["Confirmed"]:
            return quo
        if quo.status in ["Cancelled"]:
            raise InvalidTransitionException("Quotation", quo.status, "Confirmed")

        self.quotation_repo.update(quotation_id, {"status": "Confirmed"})
        return self.get_quotation(quotation_id)

    def convert_to_subscription(self, quotation_id: str, request: ConvertQuotationRequest) -> Subscription:
        """
        Converts an approved quotation into an active subscription contract.
        PREVENTS DUPLICATE CONVERSION:
        If already converted, raises BusinessRuleViolationException.
        """
        quo = self.get_quotation(quotation_id)
        if quo.converted_subscription_id:
            raise BusinessRuleViolationException(
                f"Quotation {quotation_id} has already been converted to subscription {quo.converted_subscription_id}."
            )

        if quo.status not in ["Confirmed", "Quotation"]:
            raise BusinessRuleViolationException(
                f"Cannot convert quotation with status '{quo.status}'. Quotation must be Confirmed first."
            )

        # Determine primary plan and product from the first line
        first_line = quo.lines[0] if quo.lines else None
        plan_id = first_line.plan_id if first_line else None
        plan_name = first_line.plan_name if first_line else None
        product_id = first_line.product_id if first_line else None
        product_name = first_line.product_name if first_line else None

        sub_count = self.subscription_repo.count()
        sub_id = f"SUB-{date.today().year}-{str(sub_count + 1).zfill(3)}"
        sub_number = generate_subscription_number(sub_count + 1)

        start_date = request.start_date or date.today()
        expiry_date = calculate_expiry_date(start_date, 365)
        next_billing = calculate_next_billing_date(start_date, "Monthly")

        new_sub = Subscription(
            id=sub_id,
            subscription_number=sub_number,
            customer_id=quo.customer_id,
            plan_id=plan_id,
            plan_name=plan_name,
            product_id=product_id,
            product_name=product_name,
            billing_frequency="Monthly",
            start_date=start_date,
            expiry_date=expiry_date,
            next_billing_date=next_billing,
            payment_terms=request.payment_terms or "Net 15",
            status="Active",
            auto_renew=request.auto_renew,
            quantity=first_line.quantity if first_line else 1,
            unit_price=first_line.unit_price if first_line else quo.total,
            taxes=first_line.tax_rate if first_line else Decimal("18.00"),
            total_amount=quo.total,
            quotation_id=quotation_id
        )
        self.subscription_repo.create(new_sub)

        # Copy lines to subscription lines
        for ql in quo.lines:
            s_line_id = f"sub-l-{uuid.uuid4().hex[:6]}"
            new_s_line = SubscriptionLine(
                id=s_line_id,
                subscription_id=sub_id,
                product_id=ql.product_id,
                product_name=ql.product_name,
                variant_id=ql.variant_id,
                variant_name=ql.variant_name,
                plan_id=ql.plan_id,
                plan_name=ql.plan_name,
                quantity=ql.quantity,
                unit_price=ql.unit_price,
                tax_rate=ql.tax_rate,
                subtotal=ql.subtotal,
                tax_amount=ql.tax_amount,
                total=ql.total
            )
            self.subscription_repo.db.add(new_s_line)

        # Mark quotation as confirmed and record converted subscription ID
        self.quotation_repo.update(quotation_id, {
            "status": "Confirmed",
            "converted_subscription_id": sub_id
        })
        self.subscription_repo.db.flush()

        return new_sub
