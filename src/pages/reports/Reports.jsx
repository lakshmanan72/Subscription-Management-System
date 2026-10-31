import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Repeat,
  AlertCircle,
  CreditCard,
  Users,
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
import { formatINR, formatDate, exportToCSV } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const Reports = () => {
  const { subscriptions, invoices, payments, customers, products } = useData();

  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'subscriptions' | 'payments' | 'overdue' | 'customers'
  const [dateRange, setDateRange] = useState('YTD'); // '30D' | '90D' | 'YTD' | 'ALL'

  // Dynamic calculations
  const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'Success' ? p.amount : 0), 0);
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');
  const overdueTotal = overdueInvoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  // Revenue Report Chart
  const revenueTrendData = [
    { period: 'Jan 2024', grossRevenue: 120000, netCollections: 110000, taxes: 21600 },
    { period: 'Feb 2024', grossRevenue: 145000, netCollections: 135000, taxes: 26100 },
    { period: 'Mar 2024', grossRevenue: 180000, netCollections: 172000, taxes: 32400 },
    { period: 'Apr 2024', grossRevenue: 210000, netCollections: 198000, taxes: 37800 },
    { period: 'May 2024', grossRevenue: 245000, netCollections: 232000, taxes: 44100 },
    { period: 'Jun 2024', grossRevenue: 290000, netCollections: 275000, taxes: 52200 },
    { period: 'Jul 2024', grossRevenue: 330000, netCollections: 312000, taxes: 59400 },
    { period: 'Aug 2024', grossRevenue: 375000, netCollections: 355000, taxes: 67500 },
    { period: 'Sep 2024', grossRevenue: 410000, netCollections: 395000, taxes: 73800 },
    { period: 'Oct 2024', grossRevenue: 465000, netCollections: 440000, taxes: 83700 },
  ];

  // Frequency distribution data
  const frequencyDistData = [
    { name: 'Monthly', count: subscriptions.filter(s => s.billingFrequency === 'Monthly').length, fill: '#4f46e5' },
    { name: 'Yearly', count: subscriptions.filter(s => s.billingFrequency === 'Yearly').length, fill: '#6366f1' },
    { name: 'Weekly', count: subscriptions.filter(s => s.billingFrequency === 'Weekly').length, fill: '#818cf8' },
    { name: 'Daily', count: subscriptions.filter(s => s.billingFrequency === 'Daily').length, fill: '#a5b4fc' },
  ];

  // Export handlers
  const handleExportCSV = () => {
    if (activeTab === 'revenue') {
      const columns = [
        { label: 'Invoice #', key: 'invoiceNumber' },
        { label: 'Customer', key: 'customer' },
        { label: 'Date', key: 'invoiceDate' },
        { label: 'Subtotal (INR)', key: 'subtotal' },
        { label: 'GST Tax (INR)', key: 'tax' },
        { label: 'Total (INR)', key: 'total' },
        { label: 'Status', key: 'status' },
      ];
      exportToCSV('Brightloop_Revenue_Report', invoices, columns);
    } else if (activeTab === 'subscriptions') {
      const columns = [
        { label: 'Subscription #', key: 'subscriptionNumber' },
        { label: 'Customer', key: 'customer' },
        { label: 'Plan', key: 'plan' },
        { label: 'Cadence', key: 'billingFrequency' },
        { label: 'Start Date', key: 'startDate' },
        { label: 'Expiry Date', key: 'expiryDate' },
        { label: 'Total (INR)', key: 'totalAmount' },
        { label: 'Status', key: 'status' },
      ];
      exportToCSV('Brightloop_Subscriptions_Report', subscriptions, columns);
    } else if (activeTab === 'payments') {
      const columns = [
        { label: 'Receipt #', key: 'paymentReference' },
        { label: 'Customer', key: 'customer' },
        { label: 'Invoice', key: 'invoice' },
        { label: 'Method', key: 'paymentMethod' },
        { label: 'Amount (INR)', key: 'amount' },
        { label: 'Date', key: 'paymentDate' },
        { label: 'UTR/Txn', key: 'transactionId' },
      ];
      exportToCSV('Brightloop_Payments_Report', payments, columns);
    } else if (activeTab === 'overdue') {
      const columns = [
        { label: 'Invoice #', key: 'invoiceNumber' },
        { label: 'Customer', key: 'customer' },
        { label: 'Due Date', key: 'dueDate' },
        { label: 'Outstanding (INR)', key: 'outstandingAmount' },
        { label: 'Status', key: 'status' },
      ];
      exportToCSV('Brightloop_Overdue_Report', overdueInvoices, columns);
    } else if (activeTab === 'customers') {
      const columns = [
        { label: 'Name', key: 'name' },
        { label: 'Company', key: 'company' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'GSTIN', key: 'gstin' },
        { label: 'City', key: 'city' },
      ];
      exportToCSV('Brightloop_Customer_Report', customers, columns);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial & Operational Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated audit ledgers, MRR/ARR velocity reports, and debtor aging analyses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none font-medium"
          >
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last Quarter (90 Days)</option>
            <option value="YTD">Year to Date (2024)</option>
            <option value="ALL">All Recorded History</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Category Navigation Tabs */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'revenue', label: 'Revenue Report', icon: DollarSign },
          { id: 'subscriptions', label: 'Subscription Report', icon: Repeat },
          { id: 'payments', label: 'Payment Ledger', icon: CreditCard },
          { id: 'overdue', label: 'Overdue Dunning Report', icon: AlertCircle },
          { id: 'customers', label: 'Customer Cohorts', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE REPORT */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total Gross Revenue
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatINR(totalRevenue)}</div>
              <span className="text-[11px] text-emerald-600 font-medium">+22.4% vs previous period</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Tax Collections (GST)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatINR(Math.round(totalRevenue * 0.18))}</div>
              <span className="text-[11px] text-slate-500">18% standard compliance</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Average Revenue Per User
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{formatINR(Math.round(totalRevenue / (customers.length || 1)))}</div>
              <span className="text-[11px] text-brand-600 font-medium">B2B annual contracts</span>
            </div>
          </div>

          <Card
            title="Monthly Revenue & Tax Generation Trend"
            subtitle="Historical gross collections and associated tax liability"
          >
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value) => [formatINR(value), '']} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#colRev)" />
                  <Area type="monotone" dataKey="netCollections" name="Net Collected" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION REPORT */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Active Contracts
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{activeSubs.length}</div>
              <span className="text-[11px] text-emerald-600 font-medium">92% retention rate</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Total Contract Portfolio
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{subscriptions.length}</div>
              <span className="text-[11px] text-slate-500">Across all lifecycle phases</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Auto-Renewal Enabled
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {subscriptions.filter(s => s.autoRenew).length}
              </div>
              <span className="text-[11px] text-brand-600 font-medium">Low churn probability</span>
            </div>
          </div>

          <Card title="Cadence Distribution" subtitle="Active contracts segmented by billing period">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyDistData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Subscriptions" radius={[4, 4, 0, 0]}>
                    {frequencyDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PAYMENT LEDGER */}
      {activeTab === 'payments' && (
        <Card title="Consolidated Payment Journal" subtitle="All cleared transaction entries" bodyClassName="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-brand-600">{p.paymentReference}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{p.customer}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{p.invoice}</td>
                  <td className="py-3 px-4">{p.paymentMethod}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(p.amount)}</td>
                  <td className="py-3 px-4">
                    <Badge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* TAB 4: OVERDUE DUNNING REPORT */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">
                  Total Delinquent Balance: {formatINR(overdueTotal)}
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {overdueInvoices.length} invoices are currently beyond credit grace periods.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExportCSV}
            >
              Export Overdue CSV
            </Button>
          </div>

          <Card title="Delinquent Invoices Requiring Dunning" bodyClassName="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-rose-50/50 bg-rose-50/20">
                    <td className="py-3 px-4 font-semibold text-rose-700">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{inv.customer}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">{formatINR(inv.total)}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-700">{formatINR(inv.outstandingAmount)}</td>
                    <td className="py-3 px-4">
                      <Badge status="Overdue" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 5: CUSTOMER COHORTS */}
      {activeTab === 'customers' && (
        <Card title="Client Account Master Directory" bodyClassName="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Corporate Entity</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-brand-600 font-medium">{c.company}</td>
                  <td className="py-3 px-4 text-slate-500">{c.email}</td>
                  <td className="py-3 px-4 text-slate-500">{c.phone || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(c.registrationDate)}</td>
                  <td className="py-3 px-4 text-right font-bold">
                    {c.outstandingBalance > 0 ? (
                      <span className="text-rose-600">{formatINR(c.outstandingBalance)}</span>
                    ) : (
                      <span className="text-emerald-700">₹0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Reports;

