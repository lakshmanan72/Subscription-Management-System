from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.subscription import Subscription, SubscriptionTimeline
from backend.models.customer import Customer
from backend.models.plan import Plan
from backend.models.lifeboat import (
    SubscriptionAdjustment,
    AdjustmentApproval,
    AdjustmentHistory,
)


class LifeboatService:
    @staticmethod
    def create_adjustment_request(
        customer_id: str,
        subscription_id: str,
        adjustment_type: str,
        reason: str,
        duration_days: int,
        temporary_plan_id: Optional[str],
        temporary_unit_price: Optional[float],
        deferral_days: Optional[int],
        db: Session,
        actor_name: str = "Customer",
    ) -> SubscriptionAdjustment:
        """
        Creates a temporary subscription adjustment request (Lifeboat).
        Prevents multiple active adjustments for the same subscription.
        Calculates financial relief and preserves deferred obligations.
        """
        sub = db.query(Subscription).filter(
            (Subscription.id == subscription_id) | (Subscription.subscription_number == subscription_id)
        ).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

        if sub.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot request adjustment for another customer's subscription.",
            )

        # Check existing active adjustment
        existing_active = db.query(SubscriptionAdjustment).filter(
            SubscriptionAdjustment.subscription_id == sub.id,
            SubscriptionAdjustment.status.in_(["Pending", "Active", "Approved"]),
        ).first()
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An active or pending adjustment ({existing_active.adjustment_number}) already exists for this subscription.",
            )

        adj_type = adjustment_type.upper().strip()
        if adj_type not in ["DOWNGRADE", "PAUSE", "PAYMENT_DEFERRAL"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid adjustment type. Must be DOWNGRADE, PAUSE, or PAYMENT_DEFERRAL.",
            )

        now = datetime.utcnow()
        start_date_str = now.strftime("%Y-%m-%d")
        valid_duration = max(7, min(180, duration_days or 30))
        end_date_str = (now + timedelta(days=valid_duration)).strftime("%Y-%m-%d")

        temp_plan_name = None
        calculated_temp_price = 0.0
        deferred_obligation = 0.0
        financial_relief = 0.0

        if adj_type == "DOWNGRADE":
            if temporary_plan_id:
                plan_obj = db.query(Plan).filter(Plan.id == temporary_plan_id).first()
                if plan_obj:
                    temp_plan_name = plan_obj.plan_name
                    calculated_temp_price = float(plan_obj.price if hasattr(plan_obj, "price") else (sub.unit_price * 0.5))
            if not calculated_temp_price:
                calculated_temp_price = float(temporary_unit_price or (sub.unit_price * 0.5))
            if not temp_plan_name:
                temp_plan_name = f"Lifeboat Tier ({sub.plan} Downgrade)"

            # Financial relief is the difference saved across the adjustment duration
            savings_per_month = max(0.0, sub.unit_price - calculated_temp_price)
            months = valid_duration / 30.0
            financial_relief = round(savings_per_month * months, 2)

        elif adj_type == "PAUSE":
            temp_plan_name = "Paused Service"
            calculated_temp_price = 0.0
            # Relief is the total paused billing
            months = valid_duration / 30.0
            financial_relief = round(sub.total_amount * months, 2)

        elif adj_type == "PAYMENT_DEFERRAL":
            valid_deferral = max(7, min(90, deferral_days or valid_duration))
            deferral_days = valid_deferral
            # In deferral, the payment is NOT cancelled; it is an outstanding obligation
            deferred_obligation = float(sub.total_amount or 0.0)
            financial_relief = deferred_obligation  # Immediate cash flow relief

        ts_now = int(now.timestamp() * 1000)
        adj_id = f"adj-{ts_now}"
        adj_number = f"LFB-2026-{str(ts_now % 1000000).zfill(6)}"

        new_adj = SubscriptionAdjustment(
            id=adj_id,
            adjustment_number=adj_number,
            subscription_id=sub.id,
            customer_id=customer_id,
            adjustment_type=adj_type,
            status="Pending",
            reason=reason.strip() if reason else "Customer requested economic hardship assistance.",
            start_date=start_date_str,
            end_date=end_date_str,
            duration_days=valid_duration,
            original_plan_name=sub.plan,
            original_plan_id=sub.plan_id,
            original_unit_price=sub.unit_price,
            original_billing_frequency=sub.billing_frequency,
            temporary_plan_name=temp_plan_name,
            temporary_plan_id=temporary_plan_id,
            temporary_unit_price=calculated_temp_price,
            deferral_days=deferral_days or 0,
            deferred_obligation_amount=deferred_obligation,
            financial_relief_amount=financial_relief,
            is_restored=False,
        )

        history_log = AdjustmentHistory(
            id=f"adh-{int(now.timestamp() * 1000)}-0",
            adjustment_id=adj_id,
            event_name="REQUESTED",
            previous_state=None,
            new_state="Pending",
            notes=f"Adjustment requested by {actor_name} for {adj_type} ({valid_duration} days). Expected restoration: {end_date_str}.",
        )
        new_adj.history.append(history_log)

        # Timeline entry
        timeline_entry = SubscriptionTimeline(
            id=f"act-{int(now.timestamp() * 1000)}-{sub.id}-adj",
            subscription_id=sub.id,
            timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
            title=f"Lifeboat Assistance Requested ({adj_type})",
            description=f"Request {adj_number} submitted for {valid_duration} days. Relief impact: ₹{financial_relief:,.2f}.",
            user=actor_name,
            type="lifeboat",
        )
        db.add(timeline_entry)

        db.add(new_adj)
        db.commit()
        db.refresh(new_adj)
        return new_adj

    @staticmethod
    def review_adjustment(
        adjustment_id: str,
        action: str,
        approver_name: str,
        comments: Optional[str],
        db: Session,
    ) -> SubscriptionAdjustment:
        """
        Reviews and applies or rejects a Lifeboat adjustment request.
        Updates active subscription parameters transparently with full audit history.
        """
        adj = db.query(SubscriptionAdjustment).filter(
            (SubscriptionAdjustment.id == adjustment_id) | (SubscriptionAdjustment.adjustment_number == adjustment_id)
        ).first()
        if not adj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjustment request not found.")

        if adj.status != "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Adjustment is already in '{adj.status}' state and cannot be reviewed.",
            )

        act = action.lower().strip()
        now = datetime.utcnow()
        sub = db.query(Subscription).filter(Subscription.id == adj.subscription_id).first()

        if act == "approve":
            adj.status = "Active"
            approval_action = "Approved"

            # Apply modification to subscription
            if sub:
                if adj.adjustment_type == "DOWNGRADE":
                    sub.plan = adj.temporary_plan_name
                    sub.unit_price = adj.temporary_unit_price
                    sub.total_amount = round(adj.temporary_unit_price * sub.quantity * (1 + (sub.taxes / 100.0)), 2)
                elif adj.adjustment_type == "PAUSE":
                    sub.status = "Paused"
                elif adj.adjustment_type == "PAYMENT_DEFERRAL":
                    # Push next billing date forward by deferral_days
                    try:
                        curr_dt = datetime.strptime(sub.next_billing_date[:10], "%Y-%m-%d")
                    except Exception:
                        curr_dt = now
                    new_bill_dt = curr_dt + timedelta(days=adj.deferral_days)
                    sub.next_billing_date = new_bill_dt.strftime("%Y-%m-%d")

                sub_timeline = SubscriptionTimeline(
                    id=f"act-{int(now.timestamp() * 1000)}-{sub.id}-act",
                    subscription_id=sub.id,
                    timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
                    title=f"Lifeboat Adjustment Activated ({adj.adjustment_type})",
                    description=f"Approved by {approver_name}. Scheduled auto-restoration date: {adj.end_date}.",
                    user=approver_name,
                    type="lifeboat",
                )
                db.add(sub_timeline)

        elif act == "reject":
            adj.status = "Rejected"
            approval_action = "Rejected"
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'reject'.")

        approval = AdjustmentApproval(
            id=f"app-{int(now.timestamp() * 1000)}",
            adjustment_id=adj.id,
            approver_name=approver_name,
            action=approval_action,
            comments=comments,
            decision_date=now,
        )
        db.add(approval)

        history_entry = AdjustmentHistory(
            id=f"adh-{int(now.timestamp() * 1000)}-1",
            adjustment_id=adj.id,
            event_name=approval_action.upper(),
            previous_state="Pending",
            new_state=adj.status,
            notes=f"{approval_action} by {approver_name}. Comments: {comments or 'None'}.",
        )
        db.add(history_entry)

        db.commit()
        db.refresh(adj)
        return adj

    @staticmethod
    def restore_subscription(
        adjustment_id: str,
        actor_name: str,
        db: Session,
    ) -> SubscriptionAdjustment:
        """
        Restores the original subscription configuration when adjustment expires or is manually concluded.
        Idempotent: prevents duplicate restorations.
        """
        adj = db.query(SubscriptionAdjustment).filter(
            (SubscriptionAdjustment.id == adjustment_id) | (SubscriptionAdjustment.adjustment_number == adjustment_id)
        ).first()
        if not adj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjustment request not found.")

        if adj.is_restored or adj.status == "Restored":
            # Idempotency check: Already restored
            return adj

        if adj.status not in ["Active", "Approved"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot restore adjustment in '{adj.status}' state.",
            )

        now = datetime.utcnow()
        sub = db.query(Subscription).filter(Subscription.id == adj.subscription_id).first()

        if sub:
            # Revert subscription configuration safely
            sub.plan = adj.original_plan_name
            sub.plan_id = adj.original_plan_id
            sub.unit_price = adj.original_unit_price
            sub.total_amount = round(adj.original_unit_price * sub.quantity * (1 + (sub.taxes / 100.0)), 2)

            if sub.status == "Paused" and adj.adjustment_type == "PAUSE":
                sub.status = "Active"

            timeline_entry = SubscriptionTimeline(
                id=f"act-{int(now.timestamp() * 1000)}-{sub.id}-rst",
                subscription_id=sub.id,
                timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
                title="Subscription Configuration Restored",
                description=f"Restored from Lifeboat Adjustment ({adj.adjustment_number}). Reverted to {adj.original_plan_name} @ ₹{adj.original_unit_price:,.2f}.",
                user=actor_name,
                type="lifeboat",
            )
            db.add(timeline_entry)

        adj.is_restored = True
        adj.status = "Restored"
        adj.restored_at = now

        history_entry = AdjustmentHistory(
            id=f"adh-{int(now.timestamp() * 1000)}-rst",
            adjustment_id=adj.id,
            event_name="RESTORED",
            previous_state="Active",
            new_state="Restored",
            notes=f"Restored to original plan '{adj.original_plan_name}' by {actor_name}.",
        )
        db.add(history_entry)

        db.commit()
        db.refresh(adj)
        return adj

    @staticmethod
    def process_expired_adjustments(db: Session, actor_name: str = "Lifeboat Scheduler") -> Dict[str, Any]:
        """
        Batch processor for expired adjustments.
        Finds all active adjustments whose end_date has elapsed and restores them safely & idempotently.
        """
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        expired_adjustments = db.query(SubscriptionAdjustment).filter(
            SubscriptionAdjustment.status == "Active",
            SubscriptionAdjustment.is_restored == False,
            SubscriptionAdjustment.end_date <= today_str,
        ).all()

        restored_records = []
        for adj in expired_adjustments:
            try:
                LifeboatService.restore_subscription(adj.id, actor_name=actor_name, db=db)
                restored_records.append({
                    "adjustment_number": adj.adjustment_number,
                    "subscription_id": adj.subscription_id,
                    "restoration_date": today_str,
                })
            except Exception as e:
                print(f"[Lifeboat] Error restoring adjustment {adj.id}: {e}")

        return {
            "success": True,
            "processed_count": len(expired_adjustments),
            "restored_count": len(restored_records),
            "restorations": restored_records,
        }
