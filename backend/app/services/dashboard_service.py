"""
Dashboard Service
Calculates live aggregated financial metrics and operational analytics for
ADMIN, STAFF, and CUSTOMER workspaces from database repositories.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from app.models.invoice import Invoice
from app.models.subscription import Subscription
from app.repositories import (
    CustomerRepository, InvoiceRepository, PaymentRepository,
    QuotationRepository, SubscriptionRepository
)
from app.schemas.dashboard import AdminDashboardResponse, CustomerDashboardResponse, StaffDashboardResponse
from app.utils.calculations import round_currency


class DashboardService:
    def __init__(
        self,
        subscription_repo: SubscriptionRepository,
        invoice_repo: InvoiceRepository,
        payment_repo: PaymentRepository,
        customer_repo: CustomerRepository,
        quotation_repo: QuotationRepository
    ):
        self.subscription_repo = subscription_repo
        self.invoice_repo = invoice_repo
        self.payment_repo = payment_repo
        self.customer_repo = customer_repo
        self.quotation_repo = quotation_repo

    def get_admin_dashboard(self) -> AdminDashboardResponse:
        """
        Computes executive analytics:
        - Total collections to date (from cleared payments)
        - Monthly Recurring Revenue (MRR) normalized from active subscriptions
        - Annual Recurring Revenue (ARR = MRR * 12)
        - Active contracts count
        - Outstanding receivables & overdue dunning balance
        - Trend breakdowns and operational action alerts
        """
        all_payments = self.payment_repo.get_all()
        total_revenue = sum(
            (p.amount for p in all_payments if p.status == "Success"),
            Decimal("0.00")
        )

        all_subs = self.subscription_repo.get_all()
        active_subs = [s for s in all_subs if s.status == "Active"]

        # Calculate normalized MRR based on billing frequencies
        mrr = Decimal("0.00")
        for s in active_subs:
            freq = s.billing_frequency.capitalize()
            amt = s.total_amount
            if freq == "Monthly":
                mrr += amt
            elif freq == "Yearly":
                mrr += amt / Decimal("12")
            elif freq == "Weekly":
                mrr += (amt * Decimal("52")) / Decimal("12")
            elif freq == "Daily":
                mrr += amt * Decimal("30")
            else:
                mrr += amt

        arr = mrr * Decimal("12")

        all_invoices = self.invoice_repo.get_all()
        outstanding_balance = sum(
            (inv.outstanding_amount for inv in all_invoices if inv.status in ["Confirmed", "Partially Paid", "Overdue"]),
            Decimal("0.00")
        )

        today = date.today()
        overdue_invoices = [
            inv for inv in all_invoices
            if inv.status in ["Confirmed", "Partially Paid", "Overdue"] and inv.due_date < today and inv.outstanding_amount > 0
        ]
        overdue_amount = sum((inv.outstanding_amount for inv in overdue_invoices), Decimal("0.00"))

        # Upcoming renewals (next 30 days)
        thirty_days_later = today + timedelta(days=30)
        upcoming = [
            {
                "id": s.id,
                "subscription_number": s.subscription_number,
                "customer_name": s.customer_rel.company if s.customer_rel else "Client",
                "plan_name": s.plan_name or "Cloud Package",
                "expiry_date": str(s.expiry_date),
                "amount": float(s.total_amount)
            }
            for s in active_subs if s.expiry_date and today <= s.expiry_date <= thirty_days_later
        ]

        # Delinquent alert
        delinquent_alert = None
        if overdue_invoices:
            first_od = overdue_invoices[0]
            delinquent_alert = {
                "count": len(overdue_invoices),
                "total_amount": float(overdue_amount),
                "most_urgent_invoice": first_od.invoice_number,
                "customer_name": first_od.customer_rel.company if first_od.customer_rel else "Customer",
                "days_overdue": (today - first_od.due_date).days
            }

        return AdminDashboardResponse(
            total_revenue=round_currency(total_revenue),
            mrr=round_currency(mrr),
            arr=round_currency(arr),
            active_subscriptions=len(active_subs),
            outstanding_balance=round_currency(outstanding_balance),
            overdue_invoices_amount=round_currency(overdue_amount),
            mrr_trend=[],
            subscription_growth=[],
            revenue_by_plan=[],
            recent_subscriptions=[
                {"id": s.id, "number": s.subscription_number, "customer": s.customer_rel.company if s.customer_rel else "", "status": s.status, "amount": float(s.total_amount)}
                for s in all_subs[:5]
            ],
            recent_invoices=[
                {"id": i.id, "number": i.invoice_number, "customer": i.customer_rel.company if i.customer_rel else "", "status": i.status, "total": float(i.total)}
                for i in all_invoices[:5]
            ],
            upcoming_renewals=upcoming,
            delinquent_alert=delinquent_alert
        )

    def get_staff_dashboard(self) -> StaffDashboardResponse:
        """Computes internal operational summary for staff members."""
        all_quotations = self.quotation_repo.get_all()
        pending_quotes = [q for q in all_quotations if q.status in ["Draft", "Quotation"]]

        all_invoices = self.invoice_repo.get_all()
        open_invoices = [i for i in all_invoices if i.status in ["Confirmed", "Partially Paid", "Overdue"]]

        customers = self.customer_repo.get_all(limit=5)

        return StaffDashboardResponse(
            pending_quotations_count=len(pending_quotes),
            open_invoices_count=len(open_invoices),
            active_customers_count=self.customer_repo.count(),
            recent_customers=[{"id": c.id, "name": c.name, "company": c.company, "email": c.email} for c in customers],
            recent_quotations=[{"id": q.id, "customer": q.customer_rel.company if q.customer_rel else "", "status": q.status, "total": float(q.total)} for q in all_quotations[:5]],
            recent_invoices=[{"id": i.id, "number": i.invoice_number, "customer": i.customer_rel.company if i.customer_rel else "", "status": i.status, "total": float(i.total)} for i in all_invoices[:5]],
            operational_summary={
                "pending_quotations": len(pending_quotes),
                "open_invoices": len(open_invoices),
            }
        )

    def get_customer_dashboard(self, customer_id: str) -> CustomerDashboardResponse:
        """Computes client portal summary isolated to the target customer account."""
        customer = self.customer_repo.get_by_id(customer_id)
        cust_name = customer.name if customer else "Client"
        company_name = customer.company if customer else "Organization"

        subs = self.subscription_repo.get_by_customer(customer_id)
        active_subs = [s for s in subs if s.status == "Active"]

        invoices = self.invoice_repo.get_by_customer(customer_id)
        paid_invoices = [i for i in invoices if i.status == "Paid"]
        unpaid_invoices = [i for i in invoices if i.status in ["Confirmed", "Partially Paid", "Overdue"]]
        outstanding = sum((i.outstanding_amount for i in unpaid_invoices), Decimal("0.00"))

        payments = self.payment_repo.get_by_customer(customer_id)

        today = date.today()
        upcoming = [
            {
                "id": s.id,
                "subscription_number": s.subscription_number,
                "plan_name": s.plan_name or "Cloud Plan",
                "next_billing_date": str(s.next_billing_date),
                "amount": float(s.total_amount)
            }
            for s in active_subs if s.next_billing_date and s.next_billing_date >= today
        ]

        return CustomerDashboardResponse(
            customer_id=customer_id,
            customer_name=cust_name,
            company_name=company_name,
            active_subscriptions_count=len(active_subs),
            outstanding_balance=round_currency(outstanding),
            paid_invoices_count=len(paid_invoices),
            unpaid_invoices_count=len(unpaid_invoices),
            subscriptions=[{"id": s.id, "number": s.subscription_number, "plan": s.plan_name, "status": s.status, "amount": float(s.total_amount)} for s in subs],
            invoices=[{"id": i.id, "number": i.invoice_number, "date": str(i.invoice_date), "status": i.status, "total": float(i.total), "outstanding": float(i.outstanding_amount)} for i in invoices],
            payment_history=[{"id": p.id, "ref": p.payment_reference, "method": p.payment_method, "amount": float(p.amount), "date": str(p.payment_date)} for p in payments],
            upcoming_renewals=upcoming
        )
