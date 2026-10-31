import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.subscription import Subscription, SubscriptionTimeline
from backend.models.customer import Customer
from backend.models.invoice import Invoice, InvoiceLine
from backend.models.outcome_contract import (
    OutcomeContract,
    ContractMetric,
    PerformanceMeasurement,
    ServiceCredit,
    ServiceCreditApproval,
)


class OutcomeContractService:
    @staticmethod
    def create_contract(
        customer_id: str,
        title: str,
        subscription_id: Optional[str],
        product_id: Optional[str],
        plan_id: Optional[str],
        measurement_period: str,
        start_date: str,
        end_date: Optional[str],
        credit_cap_percentage: float,
        notes: Optional[str],
        metrics: List[Dict[str, Any]],
        db: Session,
    ) -> OutcomeContract:
        """Creates a measurable outcome contract with SLA metrics."""
        cust = db.query(Customer).filter(Customer.id == customer_id).first()
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

        if subscription_id:
            sub = db.query(Subscription).filter(
                (Subscription.id == subscription_id) | (Subscription.subscription_number == subscription_id)
            ).first()
            if not sub:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
            subscription_id = sub.id

        ts_now = int(datetime.utcnow().timestamp() * 1000)
        contract_id = f"oct-{ts_now}"
        contract_number = f"OCT-2026-{str(ts_now % 1000000).zfill(6)}"

        new_contract = OutcomeContract(
            id=contract_id,
            contract_number=contract_number,
            title=title.strip(),
            customer_id=customer_id,
            subscription_id=subscription_id,
            product_id=product_id,
            plan_id=plan_id,
            measurement_period=measurement_period or "Monthly",
            start_date=start_date,
            end_date=end_date,
            status="Active",
            credit_cap_percentage=credit_cap_percentage or 50.0,
            notes=notes,
        )

        for idx, m in enumerate(metrics):
            new_contract.metrics.append(
                ContractMetric(
                    id=f"met-{int(datetime.utcnow().timestamp() * 1000)}-{idx}",
                    contract_id=contract_id,
                    metric_name=m["metric_name"],
                    metric_key=m["metric_key"],
                    target_value=float(m["target_value"]),
                    tolerance=float(m.get("tolerance", 0.0)),
                    unit=m.get("unit", "%"),
                    comparison_operator=m.get("comparison_operator", "GTE"),
                    credit_rate_per_unit=float(m.get("credit_rate_per_unit", 5.0)),
                    max_credit_percentage=float(m.get("max_credit_percentage", 30.0)),
                )
            )

        db.add(new_contract)
        db.commit()
        db.refresh(new_contract)
        return new_contract

    @staticmethod
    def record_performance_measurement(
        metric_id: str,
        period_start: str,
        period_end: str,
        measured_value: float,
        measurement_source: str,
        evidence_notes: Optional[str],
        db: Session,
    ) -> Dict[str, Any]:
        """
        Records measured performance telemetry against a contractual SLA commitment.
        Calculates eligible service credit deterministically using contract rules.
        Prevents duplicate credit generation.
        """
        metric = db.query(ContractMetric).filter(ContractMetric.id == metric_id).first()
        if not metric:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract metric not found.")

        contract = metric.contract_rel
        target = metric.target_value
        tol = metric.tolerance
        op = (metric.comparison_operator or "GTE").upper()

        is_breached = False
        breach_magnitude = 0.0

        if op == "GTE":
            threshold = target - tol
            if measured_value < threshold:
                is_breached = True
                breach_magnitude = round(threshold - measured_value, 4)
        elif op == "LTE":
            threshold = target + tol
            if measured_value > threshold:
                is_breached = True
                breach_magnitude = round(measured_value - threshold, 4)
        elif op == "EQ":
            if abs(measured_value - target) > tol:
                is_breached = True
                breach_magnitude = round(abs(measured_value - target), 4)

        now = datetime.utcnow()
        measurement_id = f"meas-{int(now.timestamp() * 1000)}"

        measurement = PerformanceMeasurement(
            id=measurement_id,
            metric_id=metric.id,
            contract_id=contract.id,
            period_start=period_start,
            period_end=period_end,
            measured_value=measured_value,
            target_value=target,
            is_breached=is_breached,
            breach_magnitude=breach_magnitude,
            measurement_source=measurement_source or "AUTOMATED_TELEMETRY",
            evidence_notes=evidence_notes,
            evaluated_at=now,
        )
        db.add(measurement)

        generated_credit = None

        if is_breached:
            # Deterministic Credit Calculation
            credit_pct = min(
                metric.max_credit_percentage,
                contract.credit_cap_percentage,
                round(breach_magnitude * metric.credit_rate_per_unit, 2),
            )

            # Find base subscription amount
            sub = None
            if contract.subscription_id:
                sub = db.query(Subscription).filter(Subscription.id == contract.subscription_id).first()
            if not sub and contract.customer_id:
                sub = db.query(Subscription).filter(
                    Subscription.customer_id == contract.customer_id,
                    Subscription.status == "Active",
                ).first()

            sub_amount = float(sub.total_amount if sub else 10000.0)
            credit_amount = round(sub_amount * (credit_pct / 100.0), 2)

            ts_credit = int(now.timestamp() * 1000)
            credit_id = f"crd-{ts_credit}"
            credit_number = f"CRD-2026-{str(ts_credit % 1000000).zfill(6)}"

            calc_details = json.dumps({
                "metric_name": metric.metric_name,
                "target_value": target,
                "tolerance": tol,
                "measured_value": measured_value,
                "operator": op,
                "breach_magnitude": breach_magnitude,
                "credit_rate_per_unit": metric.credit_rate_per_unit,
                "metric_cap_pct": metric.max_credit_percentage,
                "contract_cap_pct": contract.credit_cap_percentage,
                "calculated_percentage": credit_pct,
                "base_subscription_amount": sub_amount,
                "credit_amount": credit_amount,
                "deterministic_rule": f"min({metric.max_credit_percentage}%, {contract.credit_cap_percentage}%, {breach_magnitude} * {metric.credit_rate_per_unit}) * ₹{sub_amount:,.2f}",
            })

            generated_credit = ServiceCredit(
                id=credit_id,
                credit_number=credit_number,
                contract_id=contract.id,
                measurement_id=measurement_id,
                subscription_id=sub.id if sub else (contract.subscription_id or "unassigned"),
                customer_id=contract.customer_id,
                calculated_percentage=credit_pct,
                credit_amount=credit_amount,
                status="Pending",  # Requires explicit approval
                reason=f"SLA Breach for {metric.metric_name}: Measured {measured_value}{metric.unit} vs Target {target}{metric.unit}.",
                calculation_details=calc_details,
            )
            db.add(generated_credit)

            if sub:
                timeline_entry = SubscriptionTimeline(
                    id=f"act-{int(now.timestamp() * 1000)}-{sub.id}-crd",
                    subscription_id=sub.id,
                    timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
                    title="Service Credit Evaluated (Pending Approval)",
                    description=f"Outcome breach on '{metric.metric_name}'. Calculated credit ₹{credit_amount:,.2f} ({credit_pct}%).",
                    user="Contract Engine",
                    type="credit",
                )
                db.add(timeline_entry)

        db.commit()
        db.refresh(measurement)
        if generated_credit:
            db.refresh(generated_credit)

        return {
            "measurement": measurement,
            "is_breached": is_breached,
            "breach_magnitude": breach_magnitude,
            "credit": generated_credit,
        }

    @staticmethod
    def review_service_credit(
        credit_id: str,
        action: str,
        reviewer_name: str,
        notes: Optional[str],
        db: Session,
    ) -> ServiceCredit:
        """Approves or rejects a calculated service credit."""
        credit = db.query(ServiceCredit).filter(
            (ServiceCredit.id == credit_id) | (ServiceCredit.credit_number == credit_id)
        ).first()
        if not credit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service credit not found.")

        if credit.status != "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Credit is already in '{credit.status}' state and cannot be reviewed.",
            )

        act = action.lower().strip()
        now = datetime.utcnow()

        if act == "approve":
            credit.status = "Approved"
            approval_action = "Approved"
        elif act == "reject":
            credit.status = "Rejected"
            approval_action = "Rejected"
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'approve' or 'reject'.")

        approval = ServiceCreditApproval(
            id=f"cap-{int(now.timestamp() * 1000)}",
            credit_id=credit.id,
            reviewer_name=reviewer_name,
            action=approval_action,
            notes=notes,
            reviewed_at=now,
        )
        db.add(approval)

        db.commit()
        db.refresh(credit)
        return credit

    @staticmethod
    def apply_credit_to_invoice(
        credit_id: str,
        invoice_id: Optional[str],
        db: Session,
        actor_name: str = "Billing Officer",
    ) -> ServiceCredit:
        """
        Applies an approved service credit to an invoice.
        Preserves original invoice values and applies credit item/discount deterministically.
        Prevents applying the same credit multiple times.
        """
        credit = db.query(ServiceCredit).filter(
            (ServiceCredit.id == credit_id) | (ServiceCredit.credit_number == credit_id)
        ).first()
        if not credit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service credit not found.")

        if credit.status == "Applied":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service credit is already applied.")

        if credit.status != "Approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot apply credit in '{credit.status}' status. It must be Approved first.",
            )

        target_inv = None
        if invoice_id:
            target_inv = db.query(Invoice).filter(
                (Invoice.id == invoice_id) | (Invoice.invoice_number == invoice_id)
            ).first()

        if not target_inv:
            # Find the most recent active/confirmed, draft, or overdue invoice for this subscription or customer
            target_inv = db.query(Invoice).filter(
                Invoice.subscription_id == credit.subscription_id,
                Invoice.status.in_(["Draft", "Confirmed", "Overdue"]),
            ).order_by(Invoice.created_at.desc()).first()

        if not target_inv:
            target_inv = db.query(Invoice).filter(
                Invoice.customer_id == credit.customer_id,
                Invoice.status.in_(["Draft", "Confirmed", "Overdue"]),
            ).order_by(Invoice.created_at.desc()).first()

        if not target_inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No eligible draft or confirmed invoice found to apply this service credit.",
            )

        now = datetime.utcnow()

        # Add credit line to invoice
        credit_line = InvoiceLine(
            id=f"inv-l-{target_inv.id}-crd-{int(now.timestamp() * 1000)}",
            invoice_id=target_inv.id,
            description=f"Outcome SLA Service Credit ({credit.credit_number}) - {credit.reason[:100]}",
            quantity=1,
            unit_price=-float(credit.credit_amount),
            amount=-float(credit.credit_amount),
        )
        target_inv.lines.append(credit_line)

        # Recalculate invoice totals deterministically
        target_inv.discount = round((target_inv.discount or 0.0) + float(credit.credit_amount), 2)
        new_total = max(0.0, round(float(target_inv.total) - float(credit.credit_amount), 2))
        target_inv.total = new_total
        target_inv.outstanding_amount = max(0.0, round(new_total - float(target_inv.paid_amount or 0.0), 2))

        credit.invoice_id = target_inv.id
        credit.status = "Applied"
        credit.applied_at = now

        # Add timeline entry
        if credit.subscription_id:
            timeline_entry = SubscriptionTimeline(
                id=f"act-{int(now.timestamp() * 1000)}-{credit.subscription_id}-app",
                subscription_id=credit.subscription_id,
                timestamp=now.strftime("%Y-%m-%d %I:%M %p"),
                title="Service Credit Applied to Invoice",
                description=f"Credit {credit.credit_number} (₹{credit.credit_amount:,.2f}) applied to {target_inv.invoice_number}.",
                user=actor_name,
                type="credit",
            )
            db.add(timeline_entry)

        db.commit()
        db.refresh(credit)
        return credit
