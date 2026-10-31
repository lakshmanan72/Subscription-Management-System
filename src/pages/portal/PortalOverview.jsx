import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Repeat,
  Receipt,
  CreditCard,
  Calendar,
  AlertCircle,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const PortalOverview = () => {
  const navigate = useNavigate();
  const {
    portalCustomer,
    subscriptions,
    invoices,
    payments,
    updateSubscriptionStatus,
  } = useData();

  // Filter strictly for current authenticated customer
  const mySubs = subscriptions.filter(
    (s) => s.customerId === portalCustomer?.id || (portalCustomer?.email && s.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );
  const myInvs = invoices.filter(
    (i) => i.customerId === portalCustomer?.id || (portalCustomer?.email && i.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );
  const myPays = payments.filter(
    (p) => p.customerId === portalCustomer?.id || (portalCustomer?.email && p.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  const activeSubs = mySubs.filter((s) => s.status === 'Active');
  const outstandingAmount = myInvs.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);
  const overdueInvs = myInvs.filter((i) => i.status === 'Overdue');

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-400/30">
            Client Self-Service Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
            Welcome back, {portalCustomer?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Managing subscription licenses and automated billing for <strong>{portalCustomer?.company}</strong>.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 text-right">
          <span className="text-[11px] text-slate-300 uppercase tracking-wider block">Outstanding Balance</span>
          <div className="text-2xl font-black text-white mt-0.5">
            {formatINR(outstandingAmount)}
          </div>
          <span className="text-[11px] text-brand-300 block mt-1">
            {overdueInvs.length > 0 ? `${overdueInvs.length} invoice(s) due for settlement` : 'All accounts in good standing'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Active Subscriptions
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {activeSubs.length}
            </div>
            <Link to="/portal/subscriptions" className="text-xs text-brand-600 font-medium hover:underline mt-1 inline-block">
              View contracts &rarr;
            </Link>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Repeat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Invoices
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {myInvs.length}
            </div>
            <Link to="/portal/invoices" className="text-xs text-brand-600 font-medium hover:underline mt-1 inline-block">
              View invoices &rarr;
            </Link>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Payment Receipts
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {myPays.length}
            </div>
            <Link to="/portal/payments" className="text-xs text-brand-600 font-medium hover:underline mt-1 inline-block">
              Payment history &rarr;
            </Link>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Subscriptions Grid */}
      <Card
        title="Your Active Subscriptions"
        subtitle="Manage billing status, pause temporarily, or review renewal timelines"
        actions={
          <Link
            to="/portal/subscriptions"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {mySubs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No subscriptions found for this account.</p>
        ) : (
          <div className="space-y-4">
            {mySubs.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{sub.product}</span>
                    <Badge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan: <strong className="text-slate-700">{sub.plan}</strong> &bull; Seats: {sub.quantity || 1} &bull; Cadence: {sub.billingFrequency}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Next Renewal: {formatDate(sub.expiryDate)}</span>
                    </span>
                    <span>Amount: <strong>{formatINR(sub.totalAmount)}</strong></span>
                  </div>
                </div>

                {/* Self Service Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {sub.status === 'Active' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={PauseCircle}
                      onClick={() =>
                        updateSubscriptionStatus(
                          sub.id,
                          'Paused',
                          'Customer initiated self-service temporary pause.'
                        )
                      }
                    >
                      Request Pause
                    </Button>
                  )}

                  {sub.status === 'Paused' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={PlayCircle}
                      onClick={() =>
                        updateSubscriptionStatus(
                          sub.id,
                          'Active',
                          'Customer resumed subscription.'
                        )
                      }
                    >
                      Resume
                    </Button>
                  )}

                  <Link to="/portal/subscriptions">
                    <Button variant="secondary" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Invoices */}
      <Card
        title="Recent Invoices"
        subtitle="Download or view computer-generated tax receipts"
        actions={
          <Link
            to="/portal/invoices"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Invoices <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Invoice #</th>
              <th className="py-2.5 px-4">Invoice Date</th>
              <th className="py-2.5 px-4">Due Date</th>
              <th className="py-2.5 px-4 text-right">Total Amount</th>
              <th className="py-2.5 px-4 text-right">Outstanding</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myInvs.slice(0, 4).map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-semibold text-brand-600">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.total)}</td>
                <td className="py-3 px-4 text-right font-semibold">
                  {inv.outstandingAmount > 0 ? (
                    <span className="text-rose-600">{formatINR(inv.outstandingAmount)}</span>
                  ) : (
                    <span className="text-emerald-700">₹0</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge status={inv.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="p-1.5 text-slate-400 hover:text-brand-600 inline-block"
                    title="View & Print"
                  >
                    <Printer className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default PortalOverview;

