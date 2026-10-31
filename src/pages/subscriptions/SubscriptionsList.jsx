import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Repeat,
  Eye,
  Calendar,
  CreditCard,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  RotateCw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

export const SubscriptionsList = () => {
  const navigate = useNavigate();
  const { subscriptions, updateSubscriptionStatus, renewSubscription } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filtered = subscriptions.filter((s) => {
    const matchesQuery =
      s.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesFreq = frequencyFilter === 'ALL' || s.billingFrequency === frequencyFilter;

    return matchesQuery && matchesStatus && matchesFreq;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end recurring lifecycle: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &rarr; Closed.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => navigate('/subscriptions/new')}
        >
          New Subscription
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subscription #, customer company, plan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Quotation">Quotation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={frequencyFilter}
              onChange={(e) => {
                setFrequencyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No subscriptions found"
            description="Create a recurring agreement or convert an existing confirmed quotation."
            actionLabel="Create Subscription"
            onAction={() => navigate('/subscriptions/new')}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Product</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4">Terms</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => navigate(`/subscriptions/${sub.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-brand-600">
                    {sub.subscriptionNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{sub.customer}</div>
                    <span className="text-[11px] text-slate-400">{sub.customerEmail}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{sub.plan}</div>
                    <div className="text-[11px] text-slate-400">{sub.product}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {sub.billingFrequency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {sub.paymentTerms || 'Immediate'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {formatDate(sub.expiryDate)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatINR(sub.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={sub.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Contextual Quick Actions based on Status */}
                      {sub.status === 'Draft' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Quotation')}
                          className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200"
                        >
                          Send Quote
                        </button>
                      )}

                      {sub.status === 'Quotation' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Confirmed')}
                          className="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200"
                        >
                          Confirm
                        </button>
                      )}

                      {sub.status === 'Confirmed' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Active')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-xs"
                        >
                          Activate
                        </button>
                      )}

                      {sub.status === 'Active' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Paused')}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Pause subscription"
                        >
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}

                      {sub.status === 'Paused' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Active')}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Resume subscription"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/subscriptions/${sub.id}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="View subscription details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
};

export default SubscriptionsList;

