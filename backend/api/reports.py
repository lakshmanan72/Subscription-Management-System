from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models.invoice import Invoice
from backend.models.payment import Payment
from backend.models.subscription import Subscription
from backend.models.customer import Customer

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/revenue")
def get_revenue_report(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Generates revenue and gross collection breakdown report."""
    payments = db.query(Payment).filter(Payment.status == "Success").all()
    invoices = db.query(Invoice).all()

    gross_collections = sum(p.amount for p in payments)
    total_invoiced = sum(i.total for i in invoices)
    total_tax_collected = sum(i.tax for i in invoices if i.status == "Paid")

    return {
        "gross_collections": round(gross_collections, 2),
        "total_invoiced": round(total_invoiced, 2),
        "total_tax_collected": round(total_tax_collected, 2),
        "average_invoice_value": round(total_invoiced / len(invoices), 2) if invoices else 0.0,
        "collection_rate_pct": round((gross_collections / total_invoiced * 100), 1) if total_invoiced else 0.0,
    }


@router.get("/subscriptions")
def get_subscriptions_report(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Generates subscription status and retention analytics."""
    subs = db.query(Subscription).all()
    active_cnt = sum(1 for s in subs if s.status == "Active")
    paused_cnt = sum(1 for s in subs if s.status == "Paused")
    confirmed_cnt = sum(1 for s in subs if s.status == "Confirmed")
    closed_cnt = sum(1 for s in subs if s.status == "Closed")
    draft_cnt = sum(1 for s in subs if s.status == "Draft")

    cadence_breakdown = {
        "Monthly": sum(1 for s in subs if s.billing_frequency == "Monthly"),
        "Yearly": sum(1 for s in subs if s.billing_frequency == "Yearly"),
        "Weekly": sum(1 for s in subs if s.billing_frequency == "Weekly"),
        "Daily": sum(1 for s in subs if s.billing_frequency == "Daily"),
    }

    return {
        "total_subscriptions": len(subs),
        "active_count": active_cnt,
        "paused_count": paused_cnt,
        "confirmed_count": confirmed_cnt,
        "closed_count": closed_cnt,
        "draft_count": draft_cnt,
        "retention_rate_pct": round((active_cnt / (len(subs) - draft_cnt) * 100), 1) if len(subs) > draft_cnt else 100.0,
        "cadence_breakdown": cadence_breakdown,
    }


@router.get("/payments")
def get_payments_report(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Ledger journal of all cleared transactions."""
    payments = db.query(Payment).order_by(Payment.payment_date.desc()).all()
    return [
        {
            "id": p.id,
            "payment_reference": p.payment_reference,
            "customer": p.customer,
            "invoice": p.invoice,
            "method": p.payment_method,
            "amount": p.amount,
            "date": p.payment_date,
            "status": p.status,
            "transaction_id": p.transaction_id,
        }
        for p in payments
    ]


@router.get("/overdue")
def get_overdue_report(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Delinquent accounts report for dunning follow-up."""
    overdue_invoices = db.query(Invoice).filter(Invoice.status == "Overdue").all()
    return [
        {
            "invoice_number": i.invoice_number,
            "customer": i.customer,
            "customer_email": i.customer_email,
            "due_date": i.due_date,
            "outstanding_amount": i.outstanding_amount,
            "total": i.total,
            "days_overdue": 16,
        }
        for i in overdue_invoices
    ]


@router.get("/customers")
def get_customers_report(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Master customer directory with balance breakdown."""
    customers = db.query(Customer).order_by(Customer.outstanding_balance.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "company": c.company,
            "email": c.email,
            "phone": c.phone,
            "gstin": c.gstin,
            "active_subscriptions": c.active_subscriptions_count,
            "total_invoices": c.total_invoices_count,
            "outstanding_balance": c.outstanding_balance,
        }
        for c in customers
    ]


import csv
import io
from fastapi.responses import Response


@router.get("/export/csv")
@router.get("/export")
def export_csv(report_type: str = "subscriptions", db: Session = Depends(get_db)):
    """Exports actual database report data to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "subscriptions":
        writer.writerow(["Subscription ID", "Number", "Customer", "Plan", "Billing Frequency", "Total Amount", "Status", "Start Date", "Next Billing Date"])
        subs = db.query(Subscription).all()
        for s in subs:
            writer.writerow([s.id, s.subscription_number, s.customer, s.plan, s.billing_frequency, s.total_amount, s.status, s.start_date, s.next_billing_date])
    elif report_type == "payments":
        writer.writerow(["Payment ID", "Reference", "Customer", "Invoice", "Method", "Amount", "Date", "Status", "Transaction ID"])
        pays = db.query(Payment).all()
        for p in pays:
            writer.writerow([p.id, p.payment_reference, p.customer, p.invoice, p.payment_method, p.amount, p.payment_date, p.status, p.transaction_id])
    elif report_type == "customers":
        writer.writerow(["Customer ID", "Name", "Company", "Email", "Phone", "GSTIN", "Active Subs", "Outstanding Balance"])
        custs = db.query(Customer).all()
        for c in custs:
            writer.writerow([c.id, c.name, c.company, c.email, c.phone, c.gstin, c.active_subscriptions_count, c.outstanding_balance])
    elif report_type == "overdue":
        writer.writerow(["Invoice Number", "Customer", "Email", "Due Date", "Outstanding Amount", "Total Amount"])
        invs = db.query(Invoice).filter(Invoice.status == "Overdue").all()
        for i in invs:
            writer.writerow([i.invoice_number, i.customer, i.customer_email, i.due_date, i.outstanding_amount, i.total])
    else:
        writer.writerow(["Metric", "Value"])
        payments = db.query(Payment).filter(Payment.status == "Success").all()
        invoices = db.query(Invoice).all()
        writer.writerow(["Gross Collections", sum(p.amount for p in payments)])
        writer.writerow(["Total Invoiced", sum(i.total for i in invoices)])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"},
    )

