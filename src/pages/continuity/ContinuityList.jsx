import React, { useState } from 'react';
import {
  Network,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileCode2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  History,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const ContinuityList = () => {
  const {
    portabilityRequests,
    reviewPortabilityRequest,
    completePortabilityMigration,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Review Modal
  const [requestToReview, setRequestToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Snapshot/Inspect Modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Complete Modal
  const [requestToComplete, setRequestToComplete] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const filtered = portabilityRequests.filter((req) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (req.requestNumber || req.id || '').toLowerCase().includes(q) ||
      (req.customer_name || req.customerName || '').toLowerCase().includes(q) ||
      (req.destinationProvider || req.destination_provider || '').toLowerCase().includes(q) ||
      (req.destinationPlan || req.destination_plan || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  // KPI computations
  const totalUnusedMigrated = portabilityRequests
    .filter((r) => r.status === 'Completed' || r.status === 'Approved')
    .reduce((acc, r) => acc + (r.unusedPrepaidValue || r.unused_prepaid_value || 0), 0);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!requestToReview) return;
    setIsSubmitting(true);
    try {
      await reviewPortabilityRequest(requestToReview.id, reviewAction, reviewNotes);
      setRequestToReview(null);
    } catch {
      // error toast handled in DataContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!requestToComplete) return;
    setIsSubmitting(true);
    try {
      await completePortabilityMigration(requestToComplete.id, completeNotes);
      setRequestToComplete(null);
    } catch {
      // toast in DataContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Innovation Module 1</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subscription Continuity Network
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer migration requests, verify calculated unspent prepaid amounts, and complete controlled handshakes.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{portabilityRequests.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Awaiting Review</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {portabilityRequests.filter((r) => r.status === 'Submitted' || r.status === 'Under_Review').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Approved Migrations</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {portabilityRequests.filter((r) => r.status === 'Approved').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-subtle">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Unused Value Ported</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatINR(totalUnusedMigrated)}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search request #, customer, or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-slate-500 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under_Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
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
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Source Subscription</th>
                <th className="py-3 px-4">Destination Target</th>
                <th className="py-3 px-4 text-right">Unused Prepaid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Requested</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No portability requests found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      {req.requestNumber || req.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {req.customer_name || req.customerName || 'Client Org'}
                      </span>
                      <span className="text-[10px] text-slate-400">{req.customer_id || req.customerId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 block">
                        {req.subscription_number || req.subscriptionId}
                      </span>
                      <span className="text-[10px] text-slate-400">{req.source_plan_name || 'Active Plan'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {req.destinationProvider || req.destination_provider}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {req.destinationPlan || req.destination_plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                      {formatINR(req.unusedPrepaidValue || req.unused_prepaid_value)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {formatDate(req.created_at || req.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedRequest(req)}
                          className="text-[11px] py-1 px-2"
                        >
                          Inspect
                        </Button>

                        {(req.status === 'Submitted' || req.status === 'Under_Review') && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setRequestToReview(req);
                              setReviewAction('Approve');
                              setReviewNotes('');
                            }}
                            className="text-[11px] py-1 px-2 bg-indigo-600 hover:bg-indigo-700"
                          >
                            Review
                          </Button>
                        )}

                        {req.status === 'Approved' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setRequestToComplete(req);
                              setCompleteNotes('');
                            }}
                            className="text-[11px] py-1 px-2"
                          >
                            Complete
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
      {requestToReview && (
        <Modal
          isOpen={!!requestToReview}
          onClose={() => setRequestToReview(null)}
          title={`Review Portability Request: ${requestToReview.requestNumber || requestToReview.id}`}
          subtitle="Authorize or reject the migration request after verifying destination provider compatibility."
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{requestToReview.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Provider:</span>
                <span className="font-bold text-slate-800">{requestToReview.destinationProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculated Unspent Value:</span>
                <span className="font-bold text-emerald-600">
                  {formatINR(requestToReview.unusedPrepaidValue)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('Approve')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    reviewAction === 'Approve'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Approve Migration
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Review Notes & Compatibility Findings
              </label>
              <textarea
                rows={3}
                placeholder="Enter review decision rationale..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRequestToReview(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Modal */}
      {requestToComplete && (
        <Modal
          isOpen={!!requestToComplete}
          onClose={() => setRequestToComplete(null)}
          title="Finalize Controlled Migration Handshake"
          subtitle="Mark this migration as Completed without deleting or altering the original subscription record."
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold">Business Rule Confirmation:</p>
              <p className="mt-0.5">
                The original subscription will be flagged as Migrated. Historical invoices and receipts are fully preserved in the database.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Completion Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Migration handshake acknowledged by destination provider."
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRequestToComplete(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" isLoading={isSubmitting}>
                Finalize Migration
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Portability Record: ${selectedRequest.requestNumber || selectedRequest.id}`}
          subtitle="Cryptographic record snapshot, SHA-256 fingerprint, and audit trail."
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <Badge status={selectedRequest.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Unused Value</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatINR(selectedRequest.unusedPrepaidValue || selectedRequest.unused_prepaid_value)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Source Subscription</span>
                <span className="font-mono font-bold text-slate-800">{selectedRequest.subscription_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Destination Provider</span>
                <span className="font-semibold text-slate-800">{selectedRequest.destinationProvider}</span>
              </div>
            </div>

            {selectedRequest.records && selectedRequest.records.length > 0 && (
              <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-200">
                <span className="font-bold text-brand-900 block mb-1">SHA-256 Cryptographic Record Fingerprint</span>
                <code className="block p-2 bg-white rounded border border-brand-200 font-mono text-[10px] break-all text-slate-700">
                  {selectedRequest.records[0].record_fingerprint}
                </code>
                <span className="text-[10px] text-brand-600 mt-1 block font-mono">
                  Portable Token: {selectedRequest.records[0].portable_token}
                </span>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Immutable Audit Trail Events</h4>
              <div className="space-y-2 border-l-2 border-brand-200 pl-3">
                {selectedRequest.events && selectedRequest.events.length > 0 ? (
                  selectedRequest.events.map((ev) => (
                    <div key={ev.id} className="text-slate-600">
                      <span className="font-semibold text-slate-800 capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>{' '}
                      &bull; <span className="text-[10px] text-slate-400">{formatDateTime(ev.created_at)}</span>
                      <p className="text-[11px] text-slate-500">{ev.event_notes || 'Handshake step logged.'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Request submitted; awaiting reviewer action.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContinuityList;
