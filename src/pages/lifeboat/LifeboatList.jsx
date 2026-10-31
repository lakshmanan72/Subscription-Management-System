import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Clock,
  ArrowDownCircle,
  PauseCircle,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const LifeboatList = () => {
  const {
    lifeboatAdjustments,
    reviewLifeboatAdjustment,
    restoreLifeboatAdjustment,
    processExpiredLifeboatAdjustments,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isProcessingSweep, setIsProcessingSweep] = useState(false);

  // Review Modal
  const [adjustmentToReview, setAdjustmentToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Early Restore Modal
  const [adjustmentToRestore, setAdjustmentToRestore] = useState(null);
  const [restoreNotes, setRestoreNotes] = useState('');

  const filtered = lifeboatAdjustments.filter((adj) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (adj.adjustmentNumber || adj.id || '').toLowerCase().includes(q) ||
      (adj.customer_name || adj.customerName || '').toLowerCase().includes(q) ||
      (adj.subscription_number || adj.subscriptionId || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || adj.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentToReview) return;
    setIsSubmitting(true);
    try {
      await reviewLifeboatAdjustment(adjustmentToReview.id, reviewAction, reviewNotes);
      setAdjustmentToReview(null);
    } catch {
      // toast in DataContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!adjustmentToRestore) return;
    setIsSubmitting(true);
    try {
      await restoreLifeboatAdjustment(adjustmentToRestore.id, restoreNotes);
      setAdjustmentToRestore(null);
    } catch {
      // toast in DataContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSweep = async () => {
    setIsProcessingSweep(true);
    try {
      await processExpiredLifeboatAdjustments();
    } catch {
      // handled
    } finally {
      setIsProcessingSweep(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>Innovation Module 2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscription Lifeboat Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer temporary relief requests, approve adjustments, and manage automatic restoration schedules.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={handleRunSweep}
          isLoading={isProcessingSweep}
          className="text-xs text-teal-700 border-teal-300 hover:bg-teal-50 shrink-0"
        >
          Run Expired Restorations Sweep
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Adjustments</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{lifeboatAdjustments.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {lifeboatAdjustments.filter((a) => a.status === 'Requested').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-teal-500 uppercase tracking-wider">Active Relief</span>
          <div className="text-2xl font-black text-teal-600 mt-1">
            {lifeboatAdjustments.filter((a) => a.status === 'Active' || a.status === 'Approved').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Restored Subscriptions</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {lifeboatAdjustments.filter((a) => a.isRestored || a.is_restored).length}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search adjustment #, customer, or subscription..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-slate-500 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Restored">Restored</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-4">Adjustment #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Adjustment Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Restoration Due</th>
                <th className="py-3 px-4 text-right">Relief Terms</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No lifeboat adjustments found matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                      {adj.adjustmentNumber || adj.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{adj.customer_name}</span>
                      <span className="text-[10px] text-slate-400">{adj.customer_id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {adj.subscription_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {adj.adjustmentType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(adj.startDate)} &rarr; {formatDate(adj.endDate)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formatDate(adj.scheduledRestorationDate)}</span>
                      </div>
                      {adj.isRestored && (
                        <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">
                          &bull; Original Restored
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {adj.adjustmentType === 'Plan_Downgrade' ? (
                        <span className="text-emerald-600">
                          {formatINR(adj.originalPrice)} &rarr; {formatINR(adj.temporaryPrice)}
                        </span>
                      ) : adj.adjustmentType === 'Payment_Deferral' ? (
                        <span className="text-amber-600">Deferred: {formatINR(adj.deferredAmount)}</span>
                      ) : (
                        <span className="text-blue-600">Paused (₹0)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={adj.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {adj.status === 'Requested' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setAdjustmentToReview(adj);
                              setReviewAction('Approve');
                              setReviewNotes('');
                            }}
                            className="text-[11px] py-1 px-2.5 bg-teal-600 hover:bg-teal-700"
                          >
                            Review
                          </Button>
                        )}

                        {(adj.status === 'Active' || adj.status === 'Approved') && !adj.isRestored && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAdjustmentToRestore(adj);
                              setRestoreNotes('');
                            }}
                            className="text-[11px] py-1 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {adjustmentToReview && (
        <Modal
          isOpen={!!adjustmentToReview}
          onClose={() => setAdjustmentToReview(null)}
          title={`Review Lifeboat Request: ${adjustmentToReview.adjustmentNumber}`}
          subtitle="Authorize or reject customer temporary relief without modifying recurring invoices silently."
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{adjustmentToReview.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Relief Mechanism:</span>
                <span className="font-bold text-slate-800">{adjustmentToReview.adjustmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Restoration:</span>
                <span className="font-bold text-amber-600">
                  {formatDate(adjustmentToReview.scheduledRestorationDate)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('Approve')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    reviewAction === 'Approve'
                      ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Approve Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('Reject')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    reviewAction === 'Reject'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Reject Request
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Notes</label>
              <textarea
                rows={3}
                placeholder="Enter review decision notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdjustmentToReview(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Restore Modal */}
      {adjustmentToRestore && (
        <Modal
          isOpen={!!adjustmentToRestore}
          onClose={() => setAdjustmentToRestore(null)}
          title={`Restore Original Plan: ${adjustmentToRestore.adjustmentNumber}`}
          subtitle="Revert the subscription to its original tier configuration idempotently."
        >
          <form onSubmit={handleRestoreSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
              <p className="font-semibold">Idempotent Restoration Confirmation:</p>
              <p className="mt-0.5">
                The subscription will immediately return to original plan pricing. Normal recurring invoice generation will resume on the next billing date.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Restoration Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Early restoration requested by customer after recovery."
                value={restoreNotes}
                onChange={(e) => setRestoreNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdjustmentToRestore(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" isLoading={isSubmitting}>
                Confirm Restoration
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LifeboatList;
