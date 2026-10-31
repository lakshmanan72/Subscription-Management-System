import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.customer import Customer
from backend.models.product import Product
from backend.models.plan import Plan
from backend.models.quotation import Quotation, QuotationLine
from backend.models.subscription import Subscription
from backend.models.outcome_exchange import (
    ProviderProfile,
    SubscriptionOffering,
    OfferingCommitment,
    OfferingInterestRequest,
)


class OutcomeExchangeService:
    @staticmethod
    def create_provider_profile(
        name: str,
        slug: str,
        description: Optional[str],
        website: Optional[str],
        contact_email: Optional[str],
        rating: float,
        verified_status: bool,
        verification_badge: str,
        uptime_guarantee: float,
        logo_url: Optional[str],
        db: Session,
    ) -> ProviderProfile:
        """Creates or registers a subscription provider profile."""
        existing = db.query(ProviderProfile).filter(
            (ProviderProfile.name == name) | (ProviderProfile.slug == slug)
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provider name or slug already exists.")

        profile_id = f"prov-{int(datetime.utcnow().timestamp() * 1000)}"
        provider = ProviderProfile(
            id=profile_id,
            name=name.strip(),
            slug=slug.strip().lower(),
            description=description,
            website=website,
            contact_email=contact_email,
            rating=rating or 4.8,
            verified_status=verified_status,
            verification_badge=verification_badge or "Standard",
            active_subscribers_count=0,
            uptime_guarantee=uptime_guarantee or 99.9,
            logo_url=logo_url,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        return provider

    @staticmethod
    def create_subscription_offering(
        provider_id: str,
        product_id: Optional[str],
        plan_id: Optional[str],
        title: str,
        tier: str,
        description: Optional[str],
        pricing_model: str,
        unit_price: float,
        billing_frequency: str,
        terms_conditions: Optional[str],
        credit_policy: Optional[str],
        included_features: Optional[List[str]],
        commitments: List[Dict[str, Any]],
        db: Session,
    ) -> SubscriptionOffering:
        """Creates a subscription offering linked to provider and contractual commitments."""
        provider = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
        if not provider:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found.")

        offering_id = f"off-{int(datetime.utcnow().timestamp() * 1000)}"
        features_json = json.dumps(included_features or [])

        offering = SubscriptionOffering(
            id=offering_id,
            provider_id=provider_id,
            product_id=product_id,
            plan_id=plan_id,
            title=title.strip(),
            tier=tier or "Growth",
            description=description,
            pricing_model=pricing_model or "Flat Monthly",
            unit_price=float(unit_price or 0.0),
            billing_frequency=billing_frequency or "Monthly",
            terms_conditions=terms_conditions,
            credit_policy=credit_policy,
            included_features=features_json,
            is_active=True,
            is_featured=False,
        )

        for idx, c in enumerate(commitments):
            offering.commitments.append(
                OfferingCommitment(
                    id=f"cmt-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    offering_id=offering_id,
                    metric_name=c["metric_name"],
                    target_value=float(c["target_value"]),
                    unit=c.get("unit", "%"),
                    tolerance=float(c.get("tolerance", 0.0)),
                    credit_guarantee_percent=float(c.get("credit_guarantee_percent", 15.0)),
                    is_verified_by_telemetry=bool(c.get("is_verified_by_telemetry", False)),
                    commitment_type=c.get("commitment_type", "SLA"),
                )
            )

        db.add(offering)
        db.commit()
        db.refresh(offering)
        return offering

    @staticmethod
    def browse_offerings(
        provider_id: Optional[str] = None,
        tier: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_uptime: Optional[float] = None,
        verified_only: Optional[bool] = False,
        db: Session = None,
    ) -> List[SubscriptionOffering]:
        """Queries marketplace offerings with rich multi-parameter filtering."""
        query = db.query(SubscriptionOffering).filter(SubscriptionOffering.is_active == True)

        if provider_id:
            query = query.filter(SubscriptionOffering.provider_id == provider_id)
        if tier:
            query = query.filter(SubscriptionOffering.tier.ilike(f"%{tier}%"))
        if min_price is not None:
            query = query.filter(SubscriptionOffering.unit_price >= min_price)
        if max_price is not None:
            query = query.filter(SubscriptionOffering.unit_price <= max_price)
        if verified_only:
            query = query.join(ProviderProfile).filter(ProviderProfile.verified_status == True)
        if min_uptime is not None:
            query = query.join(OfferingCommitment).filter(
                OfferingCommitment.metric_name.ilike("%availability%"),
                OfferingCommitment.target_value >= min_uptime,
            )

        return query.order_by(SubscriptionOffering.created_at.desc()).all()

    @staticmethod
    def submit_interest_request(
        customer_id: str,
        offering_id: str,
        custom_notes: Optional[str],
        db: Session,
    ) -> OfferingInterestRequest:
        """Submits customer interest/quotation request for a subscription offering."""
        offering = db.query(SubscriptionOffering).filter(SubscriptionOffering.id == offering_id).first()
        if not offering:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription offering not found.")

        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

        req_count = db.query(OfferingInterestRequest).count() + 1
        req_number = f"OIR-2026-{str(req_count).zfill(4)}"
        req_id = f"oir-{int(datetime.utcnow().timestamp() * 1000)}"

        interest_request = OfferingInterestRequest(
            id=req_id,
            request_number=req_number,
            offering_id=offering_id,
            customer_id=customer_id,
            status="Pending",
            custom_notes=custom_notes,
            quoted_price=offering.unit_price,
        )

        db.add(interest_request)
        db.commit()
        db.refresh(interest_request)
        return interest_request

    @staticmethod
    def convert_interest_to_quotation(
        interest_request_id: str,
        db: Session,
        actor_name: str = "Exchange Desk",
    ) -> Quotation:
        """
        Converts an accepted offering interest request into an official Brightloop Quotation.
        Connects the exchange offering seamlessly to the existing quotation-to-subscription pipeline.
        """
        req = db.query(OfferingInterestRequest).filter(
            (OfferingInterestRequest.id == interest_request_id) | (OfferingInterestRequest.request_number == interest_request_id)
        ).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interest request not found.")

        if req.quotation_id:
            existing_quo = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
            if existing_quo:
                return existing_quo

        offering = req.offering_rel
        customer = req.customer_rel

        # Generate quotation
        quo_count = db.query(Quotation).count() + 1
        quo_id = f"QUO-2026-{str(quo_count + 100).zfill(4)}"
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        validity_str = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")

        subtotal = float(offering.unit_price)
        tax = round(subtotal * 0.18, 2)
        total = round(subtotal + tax, 2)

        new_quotation = Quotation(
            id=quo_id,
            customer=customer.name,
            customer_id=customer.id,
            template_name=f"Outcome Exchange: {offering.title} ({offering.tier})",
            date=today_str,
            validity_date=validity_str,
            status="Draft",
            subtotal=subtotal,
            tax=tax,
            discount=0.0,
            total=total,
            notes=f"Generated from Outcome Exchange Request {req.request_number}. Offering: {offering.title}. Provider: {offering.provider_rel.name if offering.provider_rel else 'Brightloop Partner'}.",
        )

        # Line item
        new_quotation.lines.append(
            QuotationLine(
                id=f"ql-{int(datetime.utcnow().timestamp() * 1000)}-0",
                quotation_id=quo_id,
                product_name=offering.title,
                product_id=offering.product_id,
                plan_name=offering.tier,
                plan_id=offering.plan_id,
                variant_name="Marketplace Offering",
                quantity=1,
                unit_price=offering.unit_price,
                tax_rate=18.0,
                discount=0.0,
                total=total,
            )
        )

        req.quotation_id = quo_id
        req.status = "Quoted"

        db.add(new_quotation)
        db.commit()
        db.refresh(new_quotation)
        return new_quotation
