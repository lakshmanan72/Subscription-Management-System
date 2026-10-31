import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.subscription import Subscription, SubscriptionTimeline
from backend.models.customer import Customer
from backend.models.portability import (
    PortabilityRequest,
    PortabilityRecord,
    SubscriptionMigrationEvent,
)


def calculate_unused_prepaid_value(subscription: Subscription) -> Dict[str, float]:
    """
    Deterministic financial formula for calculating unused prepaid value of an active subscription.
    Formula:
      - cycle_days: Daily=1, Weekly=7, Monthly=30, Yearly=365
      - cycle_start_date: estimated from next_billing_date or start_date
      - days_elapsed: min(cycle_days, max(0, (now - cycle_start_date).days))
      - remaining_days: max(0, cycle_days - days_elapsed)
      - daily_rate: prepaid_amount / cycle_days
      - used_amount: round(daily_rate * days_elapsed, 2)
      - unused_value: max(0.0, round(prepaid_amount - used_amount, 2))
    """
    freq = (subscription.billing_frequency or "Monthly").capitalize()
    frequency_days_map = {
        "Daily": 1,
        "Weekly": 7,
        "Monthly": 30,
        "Yearly": 365,
    }
    total_cycle_days = frequency_days_map.get(freq, 30)
    prepaid_amount = float(subscription.total_amount or 0.0)

    now = datetime.utcnow()

    # Parse billing start or next billing date
    try:
        if subscription.next_billing_date:
            next_bill_dt = datetime.strptime(subscription.next_billing_date[:10], "%Y-%m-%d")
            cycle_start_dt = next_bill_dt - timedelta(days=total_cycle_days)
        else:
            cycle_start_dt = datetime.strptime(subscription.start_date[:10], "%Y-%m-%d")
    except Exception:
        cycle_start_dt = now - timedelta(days=10)

    if cycle_start_dt > now:
        cycle_start_dt = now

    days_elapsed = max(0, min(total_cycle_days, (now - cycle_start_dt).days))
    remaining_days = max(0, total_cycle_days - days_elapsed)

    daily_rate = prepaid_amount / total_cycle_days if total_cycle_days > 0 else 0.0
    used_amount = round(daily_rate * days_elapsed, 2)
    unused_value = max(0.0, round(prepaid_amount - used_amount, 2))

    return {
        "prepaid_amount": round(prepaid_amount, 2),
        "used_amount": round(used_amount, 2),
        "unused_value": round(unused_value, 2),
        "total_cycle_days": total_cycle_days,
        "days_elapsed": days_elapsed,
        "remaining_days": remaining_days,
    }


class PortabilityService:
    @staticmethod
    def create_portability_request(
        customer_id: str,
        subscription_id: str,
        destination_provider: str,
        destination_account_id: Optional[str],
        db: Session,
        actor_name: str = "Customer",
    ) -> PortabilityRequest:
        """Creates a controlled subscription portability request with snapshot and token."""
        sub = db.query(Subscription).filter(
            (Subscription.id == subscription_id) | (Subscription.subscription_number == subscription_id)
        ).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

        if sub.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Cannot request portability for another customer's subscription.",
            )

        # Check for duplicate active request
        existing_active = db.query(PortabilityRequest).filter(
            PortabilityRequest.subscription_id == sub.id,
            PortabilityRequest.status.in_(["Pending", "Approved"]),
        ).first()
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An active portability request ({existing_active.request_number}) is already in progress for this subscription.",
            )

        # Calculate unused value deterministically
        fin_calc = calculate_unused_prepaid_value(sub)

        ts_now = int(datetime.utcnow().timestamp() * 1000)
        req_id = f"prq-{ts_now}"
        req_number = f"PRQ-2026-{str(ts_now % 1000000).zfill(6)}"

        new_request = PortabilityRequest(
            id=req_id,
            request_number=req_number,
            customer_id=customer_id,
            subscription_id=sub.id,
            origin_provider="Brightloop Software",
            destination_provider=destination_provider.strip(),
            destination_account_id=destination_account_id.strip() if destination_account_id else None,
            status="Pending",
            plan_name=sub.plan,
            billing_period=sub.billing_frequency,
            prepaid_amount=fin_calc["prepaid_amount"],
            used_amount=fin_calc["used_amount"],
            unused_value=fin_calc["unused_value"],
            currency="INR",
        )

        # Create portable snapshot record
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        snapshot_data = {
            "version": "1.0",
            "export_timestamp": datetime.utcnow().isoformat(),
            "origin_system": "Brightloop Enterprise Subscription Platform",
            "subscription": {
                "id": sub.id,
                "subscription_number": sub.subscription_number,
                "plan": sub.plan,
                "product": sub.product,
                "billing_frequency": sub.billing_frequency,
                "quantity": sub.quantity,
                "unit_price": sub.unit_price,
                "total_amount": sub.total_amount,
                "start_date": sub.start_date,
                "expiry_date": sub.expiry_date,
                "payment_terms": sub.payment_terms,
            },
            "financials": {
                "prepaid_amount": fin_calc["prepaid_amount"],
                "used_amount": fin_calc["used_amount"],
                "unused_value": fin_calc["unused_value"],
                "currency": "INR",
            },
            "customer": {
                "id": customer.id if customer else customer_id,
                "name": customer.name if customer else sub.customer,
                "email": customer.email if customer else sub.customer_email,
                "company": customer.company if customer else "",
            },
        }

        snapshot_json = json.dumps(snapshot_data, sort_keys=True)
        checksum = hashlib.sha256(snapshot_json.encode("utf-8")).hexdigest()
        portable_token = f"ptk_{hashlib.md5(f'{req_id}_{checksum}'.encode()).hexdigest()[:24]}"

        record = PortabilityRecord(
            id=f"rec-{int(datetime.utcnow().timestamp() * 1000)}",
            request_id=req_id,
            portable_token=portable_token,
            subscription_snapshot=snapshot_json,
            schema_version="1.0",
            export_checksum=checksum,
        )
        new_request.portable_record = record

        # Add audit trail event
        initial_event = SubscriptionMigrationEvent(
            id=f"mig-ev-{int(datetime.utcnow().timestamp() * 1000)}-0",
            request_id=req_id,
            event_type="REQUEST_INITIATED",
            actor_name=actor_name,
            details=f"Portability request created for destination '{destination_provider}'. Unused credit calculated: ₹{fin_calc['unused_value']:,.2f}.",
        )
        new_request.events.append(initial_event)

        # Timeline entry on subscription
        timeline_entry = SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}-{sub.id}-port",
            subscription_id=sub.id,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title="Subscription Portability Requested",
            description=f"Portability migration to '{destination_provider}' requested ({req_number}). Unused value ₹{fin_calc['unused_value']:,.2f}.",
            user=actor_name,
            type="portability",
        )
        db.add(timeline_entry)

        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        return new_request

    @staticmethod
    def review_request(
        request_id: str,
        action: str,
        reviewer_name: str,
        rejection_reason: Optional[str],
        db: Session,
    ) -> PortabilityRequest:
        """Reviews and approves or rejects a portability request."""
        req = db.query(PortabilityRequest).filter(
            (PortabilityRequest.id == request_id) | (PortabilityRequest.request_number == request_id)
        ).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portability request not found.")

        if req.status != "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot review request currently in '{req.status}' state.",
            )

        act = action.lower().strip()
        now = datetime.utcnow()

        if act == "approve":
            req.status = "Approved"
            req.approved_by = reviewer_name
            req.approved_at = now
            event_type = "REQUEST_APPROVED"
            details = f"Approved by administrator {reviewer_name}. Ready for provider handshake."
        elif act == "reject":
            req.status = "Rejected"
            req.rejection_reason = rejection_reason or "Request declined by administrator."
            event_type = "REQUEST_REJECTED"
            details = f"Rejected by {reviewer_name}. Reason: {req.rejection_reason}"
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'reject'.")

        audit_event = SubscriptionMigrationEvent(
            id=f"mig-ev-{int(datetime.utcnow().timestamp() * 1000)}-{len(req.events) if req.events else 0}",
            request_id=req.id,
            event_type=event_type,
            actor_name=reviewer_name,
            details=details,
        )
        db.add(audit_event)

        # Log to subscription timeline
        timeline_entry = SubscriptionTimeline(
            id=f"act-{int(datetime.utcnow().timestamp() * 1000)}-{req.subscription_id}-rev",
            subscription_id=req.subscription_id,
            timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
            title=f"Portability {req.status}",
            description=details,
            user=reviewer_name,
            type="portability",
        )
        db.add(timeline_entry)

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def complete_migration(
        request_id: str,
        actor_name: str,
        external_reference: Optional[str],
        db: Session,
    ) -> PortabilityRequest:
        """
        Completes the migration process.
        Preserves original subscription and invoice history, while updating subscription status.
        Prevents duplicate completion.
        """
        req = db.query(PortabilityRequest).filter(
            (PortabilityRequest.id == request_id) | (PortabilityRequest.request_number == request_id)
        ).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portability request not found.")

        if req.status == "Completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Migration is already completed. Duplicate migration operations are prohibited.",
            )

        if req.status != "Approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete migration that is not approved (current status: {req.status}).",
            )

        now = datetime.utcnow()
        req.status = "Completed"
        req.completed_at = now

        sub = db.query(Subscription).filter(Subscription.id == req.subscription_id).first()
        if sub:
            # We preserve subscription history and mark status as Closed (Migrated)
            sub.status = "Closed"
            timeline_entry = SubscriptionTimeline(
                id=f"act-{int(datetime.utcnow().timestamp() * 1000)}-{sub.id}-comp",
                subscription_id=sub.id,
                timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
                title="Migration Completed",
                description=f"Subscription migrated to {req.destination_provider}. Portable record exported. Ref: {external_reference or 'N/A'}.",
                user=actor_name,
                type="portability",
            )
            db.add(timeline_entry)

        comp_event = SubscriptionMigrationEvent(
            id=f"mig-ev-{int(datetime.utcnow().timestamp() * 1000)}-comp",
            request_id=req.id,
            event_type="MIGRATION_COMPLETED",
            actor_name=actor_name,
            details=f"Migration finalized with external ref '{external_reference or 'Direct'}' to provider {req.destination_provider}.",
        )
        db.add(comp_event)

        db.commit()
        db.refresh(req)
        return req
