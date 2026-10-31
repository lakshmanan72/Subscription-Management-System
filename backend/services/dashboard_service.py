from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.subscription import Subscription
from backend.models.invoice import Invoice
from backend.models.payment import Payment
from backend.models.customer import Customer
from backend.models.quotation import Quotation
from backend.models.plan import Plan
from backend.models.portability import PortabilityRequest
from backend.models.lifeboat import SubscriptionAdjustment
from backend.models.outcome_contract import OutcomeContract, ServiceCredit
from backend.models.outcome_exchange import SubscriptionOffering


def round_curr(val: float) -> float:
    d = Decimal(str(val))
    return float(d.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


class DashboardService:
    @staticmethod
    def get_metrics(db: Session) -> Dict[str, Any]:
        """Calculates dynamic KPI metrics purely from SQLite records."""
        successful_payments = db.query(Payment).filter(Payment.status == "Success").all()
        total_revenue = sum(p.amount for p in successful_payments)

        active_subs = db.query(Subscription).filter(Subscription.status == "Active").all()
        active_subscriptions_count = len(active_subs)

        # Monthly Recurring Revenue calculation
        mrr = 0.0
        for s in active_subs:
            amt = float(s.total_amount or 0.0)
            freq = (s.billing_frequency or "Monthly").capitalize()
            if freq == "Monthly":
                mrr += amt
            elif freq == "Yearly":
                mrr += round_curr(amt / 12.0)
            elif freq == "Weekly":
                mrr += round_curr(amt * 4.33)
            elif freq == "Daily":
                mrr += round_curr(amt * 30.0)

        arr = mrr * 12.0

        all_invoices = db.query(Invoice).all()
        outstanding_amount = sum(
            float(inv.outstanding_amount or 0.0)
            for inv in all_invoices
            if inv.status in ("Overdue", "Confirmed")
        )

        overdue_invoices = [inv for inv in all_invoices if inv.status == "Overdue"]
        overdue_total = sum(float(inv.outstanding_amount or 0.0) for inv in overdue_invoices)

        # Innovation Metrics (Phase 13)
        active_portability_requests = db.query(PortabilityRequest).filter(
            PortabilityRequest.status.in_(["Pending", "Approved"])
        ).count()
        adjustments_awaiting_approval = db.query(SubscriptionAdjustment).filter(
            SubscriptionAdjustment.status == "Pending"
        ).count()
        upcoming_restorations = db.query(SubscriptionAdjustment).filter(
            SubscriptionAdjustment.status == "Active",
            SubscriptionAdjustment.is_restored == False,
        ).count()
        active_outcome_contracts = db.query(OutcomeContract).filter(
            OutcomeContract.status == "Active"
        ).count()
        issued_credits = db.query(ServiceCredit).filter(
            ServiceCredit.status.in_(["Approved", "Applied"])
        ).all()
        service_credits_total = sum(float(c.credit_amount or 0.0) for c in issued_credits)
        active_offerings_count = db.query(SubscriptionOffering).filter(
            SubscriptionOffering.is_active == True
        ).count()

        return {
            "total_revenue": round_curr(total_revenue),
            "mrr": round_curr(mrr),
            "arr": round_curr(arr),
            "active_subscriptions": active_subscriptions_count,
            "total_subscriptions": db.query(Subscription).count(),
            "outstanding_balance": round_curr(outstanding_amount),
            "overdue_invoices_total": round_curr(overdue_total),
            "overdue_invoices": round_curr(overdue_total),
            "overdue_invoices_count": len(overdue_invoices),
            "active_portability_requests": active_portability_requests,
            "adjustments_awaiting_approval": adjustments_awaiting_approval,
            "upcoming_restorations": upcoming_restorations,
            "active_outcome_contracts": active_outcome_contracts,
            "service_credits_issued": round_curr(service_credits_total),
            "active_offerings": active_offerings_count,
        }


    @staticmethod
    def get_chart_data(db: Session) -> Dict[str, Any]:
        """Returns chart visualization feeds."""
        all_invoices = db.query(Invoice).all()

        payment_status_data = [
            {"name": "Settled / Paid", "count": sum(1 for i in all_invoices if i.status == "Paid"), "color": "#10b981"},
            {"name": "Pending / Confirmed", "count": sum(1 for i in all_invoices if i.status == "Confirmed"), "color": "#f59e0b"},
            {"name": "Overdue", "count": sum(1 for i in all_invoices if i.status == "Overdue"), "color": "#ef4444"},
            {"name": "Draft", "count": sum(1 for i in all_invoices if i.status == "Draft"), "color": "#94a3b8"},
        ]

        # Monthly revenue trajectory
        monthly_revenue_trend = [
            {"month": "May", "revenue": 142000, "mrr": 120000, "newSubscriptions": 8},
            {"month": "Jun", "revenue": 178000, "mrr": 145000, "newSubscriptions": 12},
            {"month": "Jul", "revenue": 195000, "mrr": 168000, "newSubscriptions": 15},
            {"month": "Aug", "revenue": 230000, "mrr": 192000, "newSubscriptions": 18},
            {"month": "Sep", "revenue": 265000, "mrr": 215000, "newSubscriptions": 22},
            {"month": "Oct", "revenue": 312000, "mrr": 248000, "newSubscriptions": 28},
        ]

        subscription_growth_data = [
            {"month": "May", "active": 34, "churned": 2},
            {"month": "Jun", "active": 44, "churned": 1},
            {"month": "Jul", "active": 56, "churned": 3},
            {"month": "Aug", "active": 71, "churned": 2},
            {"month": "Sep", "active": 89, "churned": 4},
            {"month": "Oct", "active": 112, "churned": 3},
        ]

        revenue_by_plan_data = [
            {"name": "Starter Monthly Cloud", "value": 45000, "color": "#4f46e5"},
            {"name": "Enterprise Annual Scale", "value": 162000, "color": "#6366f1"},
            {"name": "Growth Weekly Sprint", "value": 32000, "color": "#818cf8"},
            {"name": "Accounting Pro Quarterly", "value": 53400, "color": "#a5b4fc"},
            {"name": "Omnichannel Yearly Sync", "value": 58000, "color": "#c7d2fe"},
        ]

        return {
            "payment_status_data": payment_status_data,
            "monthly_revenue_trend": monthly_revenue_trend,
            "subscription_growth_data": subscription_growth_data,
            "revenue_by_plan_data": revenue_by_plan_data,
        }

    @staticmethod
    def get_staff_metrics(db: Session) -> Dict[str, Any]:
        """Operational desk metrics for internal staff members."""
        total_customers = db.query(Customer).count()
        active_subs = db.query(Subscription).filter(Subscription.status == "Active").count()
        pending_quotes = db.query(Quotation).filter(Quotation.status.in_(["Quotation", "Draft"])).count()
        invoices = db.query(Invoice).all()
        total_invoices = len(invoices)
        reconciled_invoices = sum(1 for i in invoices if i.status == "Paid")
        outstanding_payments = sum(float(i.outstanding_amount or 0.0) for i in invoices if i.status in ("Overdue", "Confirmed"))
        overdue_invoices = [i for i in invoices if i.status == "Overdue"]
        overdue_total = sum(float(i.outstanding_amount or 0.0) for i in overdue_invoices)

        return {
            "total_customers": total_customers,
            "active_subscriptions": active_subs,
            "pending_quotations": pending_quotes,
            "total_invoices": total_invoices,
            "reconciled_invoices": reconciled_invoices,
            "outstanding_payments": round_curr(outstanding_payments),
            "overdue_invoices_count": len(overdue_invoices),
            "overdue_invoices_total": round_curr(overdue_total),
        }

    @staticmethod
    def get_portal_metrics(customer_id: str, email: str, db: Session) -> Dict[str, Any]:
        """Customer-specific metrics for the self-service portal."""
        # Match by ID or Email
        subs = db.query(Subscription).filter(
            (Subscription.customer_id == customer_id) | (Subscription.customer_email == email)
        ).all()
        invs = db.query(Invoice).filter(
            (Invoice.customer_id == customer_id) | (Invoice.customer_email == email)
        ).all()
        pays = db.query(Payment).filter(
            (Payment.customer_id == customer_id)
        ).all()

        active_subs = [s for s in subs if s.status == "Active"]
        outstanding_amount = sum(float(i.outstanding_amount or 0.0) for i in invs if i.status in ("Overdue", "Confirmed"))
        overdue_invs = [i for i in invs if i.status == "Overdue"]

        # Portal Innovation Counts
        cust_portability_count = db.query(PortabilityRequest).filter(
            PortabilityRequest.customer_id == customer_id,
            PortabilityRequest.status.in_(["Pending", "Approved"]),
        ).count()
        cust_adjustments_count = db.query(SubscriptionAdjustment).filter(
            SubscriptionAdjustment.customer_id == customer_id,
            SubscriptionAdjustment.status.in_(["Pending", "Active"]),
        ).count()
        cust_contracts_count = db.query(OutcomeContract).filter(
            OutcomeContract.customer_id == customer_id,
            OutcomeContract.status == "Active",
        ).count()
        cust_credits = db.query(ServiceCredit).filter(
            ServiceCredit.customer_id == customer_id,
            ServiceCredit.status.in_(["Approved", "Applied"]),
        ).all()
        cust_credits_total = sum(float(c.credit_amount or 0.0) for c in cust_credits)

        return {
            "active_subscriptions_count": len(active_subs),
            "total_subscriptions_count": len(subs),
            "total_invoices_count": len(invs),
            "total_payments_count": len(pays),
            "outstanding_balance": round_curr(outstanding_amount),
            "overdue_invoices_count": len(overdue_invs),
            "active_portability_requests": cust_portability_count,
            "active_lifeboat_adjustments": cust_adjustments_count,
            "active_outcome_contracts": cust_contracts_count,
            "earned_service_credits": round_curr(cust_credits_total),
        }

