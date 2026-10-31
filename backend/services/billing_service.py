import calendar
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.subscription import Subscription, SubscriptionTimeline
from backend.models.invoice import Invoice, InvoiceLine
from backend.models.customer import Customer


def calculate_next_billing_date(current_date_str: str, frequency: str) -> str:
    """Calculates next billing date given current date and frequency."""
    try:
        dt = datetime.strptime(current_date_str[:10], "%Y-%m-%d")
    except Exception:
        dt = datetime.utcnow()

    freq = (frequency or "Monthly").capitalize()
    if freq == "Daily":
        next_dt = dt + timedelta(days=1)
    elif freq == "Weekly":
        next_dt = dt + timedelta(days=7)
    elif freq == "Yearly":
        try:
            next_dt = dt.replace(year=dt.year + 1)
        except ValueError:
            next_dt = dt + timedelta(days=365)
    else:  # Monthly
        # Handle month end
        month = dt.month + 1 if dt.month < 12 else 1
        year = dt.year if dt.month < 12 else dt.year + 1
        day = min(dt.day, calendar.monthrange(year, month)[1])
        next_dt = datetime(year, month, day)

    return next_dt.strftime("%Y-%m-%d")


class BillingService:
    @staticmethod
    def run_recurring_billing(db: Session, force: bool = False) -> Dict[str, Any]:
        """
        Executes automated recurring billing cycle for active subscriptions whose next_billing_date is due.
        Prevents duplicate invoice generation for the same subscription billing cycle.
        """
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        active_subs = db.query(Subscription).filter(Subscription.status == "Active").all()

        generated_invoices = []
        skipped_count = 0

        for sub in active_subs:
            # Check if billing is due
            is_due = force or (sub.next_billing_date and sub.next_billing_date <= today_str)
            if not is_due:
                skipped_count += 1
                continue

            # Prevent duplicate invoices for the same subscription on the same billing date
            existing_cycle_inv = db.query(Invoice).filter(
                Invoice.subscription_id == sub.id,
                Invoice.invoice_date == (sub.next_billing_date or today_str),
            ).first()

            if existing_cycle_inv:
                skipped_count += 1
                continue

            # Create itemized invoice with unique number and ID
            inv_count = db.query(Invoice).count() + len(generated_invoices) + 1
            inv_number = f"INV-2024-{str(inv_count + 100).zfill(4)}"
            inv_id = f"INV-{int(datetime.utcnow().timestamp() * 1000)}-{len(generated_invoices)}"

            # Due date: 15 days out by default
            due_dt = datetime.utcnow() + timedelta(days=15)
            due_date_str = due_dt.strftime("%Y-%m-%d")

            customer = db.query(Customer).filter(Customer.id == sub.customer_id).first()

            # Calculate line items, taxes, totals
            subtotal = 0.0
            total_tax = 0.0
            new_lines = []

            if sub.product_lines:
                for pl in sub.product_lines:
                    line_subtotal = float(pl.subtotal or (pl.unit_price * pl.quantity))
                    subtotal += line_subtotal
                    line_tax = line_subtotal * (float(pl.tax_rate or 18.0) / 100.0)
                    total_tax += line_tax
                    new_lines.append(
                        InvoiceLine(
                            id=f"inv-l-{inv_id}-{len(new_lines)}",
                            description=f"{pl.product_name} ({pl.variant_name or 'Standard'}) - {sub.billing_frequency}",
                            quantity=pl.quantity,
                            unit_price=pl.unit_price,
                            amount=line_subtotal,
                        )
                    )
            else:
                line_subtotal = float(sub.unit_price * sub.quantity)
                subtotal = line_subtotal
                total_tax = line_subtotal * (float(sub.taxes or 18.0) / 100.0)
                new_lines.append(
                    InvoiceLine(
                        id=f"inv-l-{inv_id}-0",
                        description=f"{sub.product} ({sub.plan}) - {sub.billing_frequency}",
                        quantity=sub.quantity,
                        unit_price=sub.unit_price,
                        amount=line_subtotal,
                    )
                )

            total_amount = round(subtotal + total_tax, 2)

            new_invoice = Invoice(
                id=inv_id,
                invoice_number=inv_number,
                customer=sub.customer,
                customer_id=sub.customer_id,
                customer_email=sub.customer_email,
                customer_address=customer.address if customer else None,
                customer_gst=customer.gstin if customer else None,
                subscription=sub.subscription_number,
                subscription_id=sub.id,
                invoice_date=sub.next_billing_date or today_str,
                due_date=due_date_str,
                subtotal=round(subtotal, 2),
                tax=round(total_tax, 2),
                discount=0.0,
                total=total_amount,
                paid_amount=0.0,
                outstanding_amount=total_amount,
                status="Confirmed",  # Auto-confirmed cycle invoice
                payment_terms=sub.payment_terms or "Net 15",
                notes=f"Automated recurring billing cycle for {sub.subscription_number}.",
            )
            new_invoice.lines = new_lines
            db.add(new_invoice)

            # Update next billing date to the next upcoming billing cycle
            next_date = calculate_next_billing_date(
                sub.next_billing_date or today_str,
                sub.billing_frequency or "Monthly",
            )
            while next_date <= today_str:
                next_date = calculate_next_billing_date(next_date, sub.billing_frequency or "Monthly")
            sub.next_billing_date = next_date

            # Add activity timeline log to subscription
            timeline_log = SubscriptionTimeline(
                id=f"act-{int(datetime.utcnow().timestamp() * 1000)}-{sub.id}-{len(generated_invoices)}",
                subscription_id=sub.id,
                timestamp=datetime.utcnow().strftime("%Y-%m-%d %I:%M %p"),
                title="Monthly Cycle Auto-Billed",
                description=f"Cycle invoice {inv_number} for ₹{total_amount:,.2f} generated.",
                user="Billing Engine",
                type="invoice",
            )
            db.add(timeline_log)

            # Update customer invoice count and outstanding balance
            if customer:
                customer.total_invoices_count = (customer.total_invoices_count or 0) + 1
                customer.outstanding_balance = (customer.outstanding_balance or 0.0) + total_amount

            generated_invoices.append({
                "invoice_number": inv_number,
                "subscription_number": sub.subscription_number,
                "customer": sub.customer,
                "amount": total_amount,
                "next_billing_date": sub.next_billing_date,
            })

        db.commit()

        return {
            "success": True,
            "generated_count": len(generated_invoices),
            "skipped_count": skipped_count,
            "invoices": generated_invoices,
        }
