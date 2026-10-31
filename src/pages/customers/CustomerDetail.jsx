import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Repeat,
  Receipt,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, subscriptions, invoices, payments, setPortalCustomerId } = useData();

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="text-center py-16">
        <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Customer Account Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested customer record does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const customerSubs = subscriptions.filter((s) => s.customerId === customer.id);
  const customerInvs = invoices.filter((i) => i.customerId === customer.id);
  const customerPays = payments.filter((p) => p.customerId === customer.id || customerInvs.some(inv => inv.id === p.invoiceId));

  const totalBilled = customerInvs.reduce((acc, i) => acc + (i.total || 0), 0);
  const totalPaid = customerInvs.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const totalOutstanding = customerInvs.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  const handleOpenAsPortalUser = () => {
    setPortalCustomerId(customer.id);
    navigate('/portal');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>

        <Button
          variant="secondary"
          size="sm"
          icon={ExternalLink}
          onClick={handleOpenAsPortalUser}
        >
          View as Customer in Portal
        </Button>
      </div>

      {/* Customer Profile Card */}
      <Card bodyClassName="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <img
              src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}`}
              alt={customer.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  Client Account
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.company}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone || '—'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <strong>GSTIN:</strong> {customer.gstin || '29ABCDE1234F1Z5'} &bull; <strong>Address:</strong> {customer.address || customer.city}
              </p>
            </div>
          </div>

          {/* Balance Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 min-w-[240px] text-right space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Outstanding Due</span>
              <span className={`text-xl font-black ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatINR(totalOutstanding)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Total Billed: <strong className="text-slate-800">{formatINR(totalBilled)}</strong> &bull; Paid: <span className="text-emerald-600 font-semibold">{formatINR(totalPaid)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscriptions History Table */}
      <Card
        title="Subscription Contracts"
        subtitle={`Active and past subscription agreements (${customerSubs.length})`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/subscriptions/new')}
          >
            Add Subscription
          </Button>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        {customerSubs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No subscriptions on record for this customer.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Subscription #</th>
                <th className="py-2.5 px-4">Plan & Product</th>
                <th className="py-2.5 px-4">Cadence</th>
                <th className="py-2.5 px-4">Expiry Date</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerSubs.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-brand-600">{sub.subscriptionNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{sub.plan}</div>
                    <div className="text-[11px] text-slate-400">{sub.product}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{sub.billingFrequency}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(sub.expiryDate)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(sub.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <Badge status={sub.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Invoice History Table */}
      <Card
        title="Billing & Invoice History"
        subtitle={`All invoices issued to ${customer.company} (${customerInvs.length})`}
        bodyClassName="p-0 overflow-x-auto"
      >
        {customerInvs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No invoices issued to this customer yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Paid</th>
                <th className="py-2.5 px-4 text-right">Outstanding</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerInvs.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(inv.total)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatINR(inv.paidAmount || 0)}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default CustomerDetail;

