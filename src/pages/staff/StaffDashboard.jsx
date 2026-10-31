import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users2,
  Repeat,
  FileCheck2,
  Receipt,
  Clock,
  AlertCircle,
  Plus,
  ShieldAlert,
  Calendar,
  ChevronRight,
  CreditCard,
  Building,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const StaffDashboard = () => {
  const navigate = useNavigate();
  const { customers, subscriptions, quotations, invoices, payments } = useData();

  // Operational metrics
  const totalCustomers = customers.length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'Active').length;
  const pendingQuotations = quotations.filter((q) => q.status === 'Quotation' || q.status === 'Draft').length;
  const totalInvoices = invoices.length;
  const outstandingPayments = invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const overdueTotal = overdueInvoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  const kpis = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      subtext: 'Registered accounts',
      icon: Users2,
      color: 'text-brand-600 bg-brand-50 border-brand-100',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      subtext: `${subscriptions.length} total contracts`,
      icon: Repeat,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Pending Quotations',
      value: pendingQuotations.toString(),
      subtext: 'Awaiting client approval',
      icon: FileCheck2,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      subtext: `${invoices.filter((i) => i.status === 'Paid').length} reconciled`,
      icon: Receipt,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Outstanding Payments',
      value: formatINR(outstandingPayments),
      subtext: `${invoices.filter((i) => i.outstandingAmount > 0).length} open balances`,
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Overdue Invoices',
      value: formatINR(overdueTotal),
      subtext: `${overdueInvoices.length} past due date`,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  // Upcoming renewals (within 90 days)
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'Active' || s.status === 'Paused')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff Operations Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              Internal Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time subscriber lifecycle management, quotation processing, and billing collection workflows.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={FileCheck2}
            onClick={() => navigate('/staff/quotations/new')}
          >
            New Quotation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Receipt}
            onClick={() => navigate('/staff/invoices/new')}
          >
            Create Invoice
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/staff/subscriptions/new')}
          >
            New Subscription
          </Button>
        </div>
      </div>

      {/* Overdue Invoice Alerts Banner */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50/50 p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-900">
                  {overdueInvoices.length} Delinquent Invoice{overdueInvoices.length > 1 ? 's' : ''} Require Follow-up
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Total outstanding overdue: <strong>{formatINR(overdueTotal)}</strong>. Immediate collections outreach is recommended.
                </p>
              </div>
            </div>
            <Link
              to="/staff/invoices"
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Review Invoices
            </Link>
          </div>
        </div>
      )}

      {/* 6 Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
                <div className="mt-1 text-[11px] text-slate-400 truncate">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Recent Quotations & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotations (2 cols) */}
        <Card
          title="Recent Quotations"
          subtitle="Proposals pending client confirmation"
          className="lg:col-span-2"
          actions={
            <Link
              to="/staff/quotations"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.slice(0, 4).map((quo) => (
                <tr
                  key={quo.id}
                  onClick={() => navigate(`/staff/quotations/${quo.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-brand-600">{quo.id}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{quo.customer}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(quo.validityDate)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(quo.total)}</td>
                  <td className="py-3 px-4">
                    <Badge status={quo.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Upcoming Renewals Widget (1 col) */}
        <Card
          title="Upcoming Renewals"
          subtitle="Subscriptions expiring within 90 days"
          actions={
            <Link
              to="/staff/subscriptions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All
            </Link>
          }
          bodyClassName="p-4 space-y-3"
        >
          {upcomingRenewals.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/staff/subscriptions/${sub.id}`)}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900">{sub.customer}</span>
                  <Badge status={sub.status} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub.plan}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Expires: {formatDate(sub.expiryDate)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900">
                  {formatINR(sub.totalAmount)}
                </span>
                <p className="text-[10px] text-slate-400">{sub.billingFrequency}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Row 2: Recent Subscriptions & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <Card
          title="Recent Subscriptions"
          subtitle="Latest active and confirmed contracts"
          actions={
            <Link
              to="/staff/subscriptions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.slice(0, 4).map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/staff/subscriptions/${sub.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-brand-600">{sub.subscriptionNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{sub.customer}</td>
                  <td className="py-3 px-4 text-slate-500">{sub.billingFrequency}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(sub.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <Badge status={sub.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Recent Customers */}
        <Card
          title="Recent Customers"
          subtitle="Latest registered client accounts"
          actions={
            <Link
              to="/staff/customers"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.slice(0, 4).map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => navigate(`/staff/customers/${cust.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{cust.company}</div>
                    <div className="text-[11px] text-slate-500">{cust.name} &bull; {cust.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(cust.registrationDate)}</td>
                  <td className="py-3 px-4 text-right font-bold">
                    {cust.outstandingBalance > 0 ? (
                      <span className="text-rose-600">{formatINR(cust.outstandingBalance)}</span>
                    ) : (
                      <span className="text-emerald-700">₹0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Row 3: Recent Invoices & Collections */}
      <Card
        title="Recent Invoices & Collections"
        subtitle="Latest billing cycle runs and customer payment states"
        actions={
          <Link
            to="/staff/invoices"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Invoices <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Outstanding</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.slice(0, 5).map((inv) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/staff/invoices/${inv.id}`)}
                className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                  inv.status === 'Overdue' ? 'bg-rose-50/40' : ''
                }`}
              >
                <td className="py-3 px-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{inv.customer}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.total)}</td>
                <td className="py-3 px-4 text-right font-semibold">
                  {inv.outstandingAmount > 0 ? (
                    <span className={inv.status === 'Overdue' ? 'text-rose-600' : 'text-amber-700'}>
                      {formatINR(inv.outstandingAmount)}
                    </span>
                  ) : (
                    <span className="text-emerald-700">₹0 (Paid)</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default StaffDashboard;

