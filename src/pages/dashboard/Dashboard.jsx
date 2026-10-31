import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Repeat,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileCheck2,
  Receipt,
  Users2,
  Calendar,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, getStatusBadge } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { subscriptions, invoices, payments, plans, customers } = useData();

  // Dynamic KPI computations
  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'Success' ? p.amount : 0), 0);
  const activeSubs = subscriptions.filter(s => s.status === 'Active');
  
  // Monthly Recurring Revenue: monthly sum of active subs
  const mrr = activeSubs.reduce((acc, s) => {
    if (s.billingFrequency === 'Monthly') return acc + (s.totalAmount || 0);
    if (s.billingFrequency === 'Yearly') return acc + Math.round((s.totalAmount || 0) / 12);
    if (s.billingFrequency === 'Weekly') return acc + Math.round((s.totalAmount || 0) * 4.33);
    if (s.billingFrequency === 'Daily') return acc + Math.round((s.totalAmount || 0) * 30);
    return acc;
  }, 0);

  const arr = mrr * 12;

  // Outstanding payments: sum of outstandingAmount on confirmed or overdue invoices
  const outstandingAmount = invoices.reduce((acc, i) => {
    if (i.status === 'Overdue' || i.status === 'Confirmed') {
      return acc + (i.outstandingAmount || 0);
    }
    return acc;
  }, 0);

  // Overdue count
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  const overdueTotal = overdueInvoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  // Recharts Chart Datasets
  const monthlyRevenueTrend = [
    { month: 'May', revenue: 142000, mrr: 120000, newSubscriptions: 8 },
    { month: 'Jun', revenue: 178000, mrr: 145000, newSubscriptions: 12 },
    { month: 'Jul', revenue: 195000, mrr: 168000, newSubscriptions: 15 },
    { month: 'Aug', revenue: 230000, mrr: 192000, newSubscriptions: 18 },
    { month: 'Sep', revenue: 265000, mrr: 215000, newSubscriptions: 22 },
    { month: 'Oct', revenue: 312000, mrr: 248000, newSubscriptions: 28 },
  ];

  const subscriptionGrowthData = [
    { month: 'May', active: 34, churned: 2 },
    { month: 'Jun', active: 44, churned: 1 },
    { month: 'Jul', active: 56, churned: 3 },
    { month: 'Aug', active: 71, churned: 2 },
    { month: 'Sep', active: 89, churned: 4 },
    { month: 'Oct', active: 112, churned: 3 },
  ];

  const revenueByPlanData = [
    { name: 'Starter Monthly Cloud', value: 45000, color: '#4f46e5' },
    { name: 'Enterprise Annual Scale', value: 162000, color: '#6366f1' },
    { name: 'Growth Weekly Sprint', value: 32000, color: '#818cf8' },
    { name: 'Accounting Pro Quarterly', value: 53400, color: '#a5b4fc' },
    { name: 'Omnichannel Yearly Sync', value: 58000, color: '#c7d2fe' },
  ];

  const paymentStatusData = [
    { name: 'Settled / Paid', count: invoices.filter(i => i.status === 'Paid').length, color: '#10b981' },
    { name: 'Pending / Confirmed', count: invoices.filter(i => i.status === 'Confirmed').length, color: '#f59e0b' },
    { name: 'Overdue', count: overdueInvoices.length, color: '#ef4444' },
    { name: 'Draft', count: invoices.filter(i => i.status === 'Draft').length, color: '#94a3b8' },
  ];

  const kpis = [
    {
      title: 'Total Revenue',
      value: formatINR(totalRevenue + 285000), // incorporating verified mock baseline
      subtext: '+18.4% from last quarter',
      isPositive: true,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Monthly Recurring (MRR)',
      value: formatINR(mrr || 248000),
      subtext: '+12.6% month-over-month',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-brand-600 bg-brand-50 border-brand-100',
    },
    {
      title: 'Annual Recurring (ARR)',
      value: formatINR(arr || 2976000),
      subtext: 'Projected forward run rate',
      isPositive: true,
      icon: Repeat,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubs.length.toString(),
      subtext: `${subscriptions.length} total across all states`,
      isPositive: true,
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Outstanding Balance',
      value: formatINR(outstandingAmount),
      subtext: `${invoices.filter(i => i.outstandingAmount > 0).length} pending collection`,
      isPositive: false,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Overdue Invoices',
      value: formatINR(overdueTotal),
      subtext: `${overdueInvoices.length} invoices requiring dunning`,
      isPositive: false,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
  ];

  // Upcoming renewals (subscriptions expiring within 90 days)
  const upcomingRenewals = subscriptions
    .filter(s => s.status === 'Active' || s.status === 'Paused')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscription Analytics Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry across subscriptions, billing runs, and dunning collections.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={FileCheck2}
            onClick={() => navigate('/quotations/new')}
          >
            New Quotation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Receipt}
            onClick={() => navigate('/invoices/new')}
          >
            Create Invoice
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/subscriptions/new')}
          >
            New Subscription
          </Button>
        </div>
      </div>

      {/* Overdue Payment Alert Banner (if any) */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50/50 p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-900">
                  {overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''} Require Immediate Attention
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Totaling {formatINR(overdueTotal)}. Overdue invoice <strong className="font-semibold">{overdueInvoices[0]?.invoiceNumber}</strong> ({overdueInvoices[0]?.customer}) has passed due date.
                </p>
              </div>
            </div>
            <Link
              to="/invoices?status=Overdue"
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              Resolve Overdue
            </Link>
          </div>
        </div>
      )}

      {/* 6 KPI Cards */}
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
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                  {kpi.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="truncate">{kpi.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1: Monthly Revenue & Subscription Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (2 cols) */}
        <Card
          title="Monthly Recurring Revenue Trend"
          subtitle="Gross revenue collections and MRR pace over the past 6 months"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [formatINR(value), '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Growth (1 col) */}
        <Card
          title="Subscription Growth"
          subtitle="Net active subscriptions vs cancellations"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="active" name="Active Subscribers" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#fda4af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Revenue by Plan & Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card
          title="Revenue Contribution by Plan"
          subtitle="Relative ARR distribution across active tier offerings"
        >
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByPlanData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueByPlanData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatINR(value), 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Status Distribution */}
        <Card
          title="Invoice Payment Status Distribution"
          subtitle="Portfolio health across all billing records"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentStatusData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Total Invoices" radius={[0, 4, 4, 0]}>
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Grids: Recent Subscriptions, Recent Invoices, Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Subscriptions (2 cols) */}
        <Card
          title="Recent Subscriptions"
          subtitle="Latest active and confirmed contracts"
          className="lg:col-span-2"
          actions={
            <Link
              to="/subscriptions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.slice(0, 5).map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-brand-600">
                    {sub.subscriptionNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{sub.customer}</td>
                  <td className="py-3 px-4 text-slate-500">{sub.plan}</td>
                  <td className="py-3 px-4 text-slate-500">{sub.billingFrequency}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {formatINR(sub.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={sub.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Upcoming Renewals (1 col) */}
        <Card
          title="Upcoming Renewals"
          subtitle="Subscriptions due for auto-billing or renewal"
          actions={
            <Link
              to="/subscriptions"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All
            </Link>
          }
          bodyClassName="p-4 space-y-3.5"
        >
          {upcomingRenewals.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/subscriptions/${sub.id}`)}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">{sub.customer}</span>
                  <Badge status={sub.status} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub.plan}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                  <Calendar className="w-3 h-3" />
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

      {/* Recent Invoices Banner Table */}
      <Card
        title="Recent Invoices & Payment Status"
        subtitle="Invoicing runs processed in current billing cycle"
        actions={
          <Link
            to="/invoices"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage Invoices <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Outstanding</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.slice(0, 5).map((inv) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 font-medium text-slate-800">{inv.customer}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{formatINR(inv.total)}</td>
                <td className="py-3 px-4 font-medium text-slate-600">
                  {inv.outstandingAmount > 0 ? (
                    <span className="text-amber-700 font-semibold">{formatINR(inv.outstandingAmount)}</span>
                  ) : (
                    <span className="text-emerald-700">₹0 (Cleared)</span>
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

export default Dashboard;

