import React, { useState } from 'react';
import {
  Network,
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Calendar,
  DollarSign,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const PortalPortability = () => {
  const { portalCustomer, subscriptions, portabilityRequests, createPortabilityRequest } = useData();

  // Filter subscriptions for this customer
  const mySubs = subscriptions.filter(
    (s) =>
      s.customerId === portalCustomer?.id ||
      (portalCustomer?.email && s.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  // Filter portability requests for this customer
  const myRequests = portabilityRequests.filter(
    (r) =>
      r.customerId === portalCustomer?.id ||
      (portalCustomer?.id && r.customer_id === portalCustomer.id) ||
      (portalCustomer?.email && r.customer_email?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [destinationProvider, setDestinationProvider] = useState('');
  const [destinationPlan, setDestinationPlan] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Calculate live deterministic unused value preview for selected sub
  const selectedSub = mySubs.find((s) => s.id === selectedSubId);
  const estimatedPrepaid = selectedSub?.totalAmount || selectedSub?.total_amount || 0;
  let estimatedUnused = 0;
  if (selectedSub && selectedSub.startDate && selectedSub.expiryDate) {
    const start = new Date(selectedSub.startDate).getTime();
    const expiry = new Date(selectedSub.expiryDate).getTime();
    const now = Date.now();
    const totalDays = Math.max(1, Math.round((expiry - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.round((expiry - now) / (1000 * 60 * 60 * 24)));
    estimatedUnused = Math.round((estimatedPrepaid * remainingDays) / totalDays);
  }

  const handleOpenCreate = () => {
    if (mySubs.length > 0) {
      setSelectedSubId(mySubs[0].id);
    }
    setDestinationProvider('');
    setDestinationPlan('');
    setReason('');
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubId || !destinationProvider || !destinationPlan) return;
    setIsSubmitting(true);
    try {
      await createPortabilityRequest({
        subscription_id: selectedSubId,
        destination_provider: destinationProvider,
        destination_plan: destinationPlan,
        reason: reason || 'Customer initiated portability request',
      });
      setIsCreateOpen(false);
    } catch {
      // error toast handled in DataContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>Subscription Continuity Network</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Subscription Portability</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Migrate active subscriptions to another compatible provider without losing your subscription history,
            accumulated invoices, or unspent prepaid value.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          disabled={mySubs.length === 0}
          className="bg-brand-500 hover:bg-brand-400 text-white font-semibold shadow-lg text-xs shrink-0"
        >
          Request Portability
        </Button>
      </div>

      {/* Rules Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Deterministic Proration</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unused prepaid value is computed strictly by daily mathematical proration, verified before migration.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">History Preserved</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Original subscriptions, invoices, and payment receipts remain intact and are never deleted.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Controlled Handshake</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Each migration generates an immutable snapshot record and requires administrative review.
            </p>
          </div>
        </div>
      </div>

      {/* Portability Requests Table */}
      <Card
        title="My Migration Requests"
        subtitle="Track submitted portability requests, review approval statuses, and verify portable record fingerprints."
      >
        {myRequests.length === 0 ? (
          <div className="text-center py-12">
            <Network className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Portability Requests Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't requested any subscription migrations. Click 'Request Portability' above to migrate an active plan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Destination Provider</th>
                  <th className="py-3 px-4">Destination Plan</th>
                  <th className="py-3 px-4 text-right">Unused Prepaid Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Requested On</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{req.requestNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{req.subscription_number || req.subscriptionId}</span>
                      <span className="block text-[11px] text-slate-400">{req.source_plan_name || 'Cloud Plan'}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{req.destinationProvider}</td>
                    <td className="py-3 px-4 text-slate-600">{req.destinationPlan}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatINR(req.unusedPrepaidValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{formatDate(req.createdAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedRequest(req)}
                        className="text-[11px]"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Eligible Subscriptions Snapshot */}
      <Card
        title="Eligible Active Subscriptions"
        subtitle="Active plans available for portability review and deterministic proration."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mySubs.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-brand-300 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700">{sub.subscriptionNumber}</span>
                  <Badge status={sub.status} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.product || 'Enterprise Cloud'}</h4>
                <p className="text-xs text-slate-500">
                  Plan: {sub.plan} &bull; Next renewal: {formatDate(sub.expiryDate)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Prepaid Amount</span>
                <span className="text-base font-black text-slate-900">{formatINR(sub.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Create Portability Request Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Request Subscription Portability"
        subtitle="Initiate a controlled migration request with deterministic proration computation."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Subscription to Migrate *
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              required
            >
              {mySubs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subscriptionNumber} — {sub.product} ({sub.plan}) [₹{sub.totalAmount}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Compatible Provider *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Cloud Solutions"
                value={destinationProvider}
                onChange={(e) => setDestinationProvider(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Plan Offering *
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise Cloud Suite"
                value={destinationPlan}
                onChange={(e) => setDestinationPlan(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Migration Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Multi-cloud consolidation or cross-organization migration."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Mathematical Proration Live Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Total Plan Prepaid Amount:</span>
              <span className="font-bold">{formatINR(estimatedPrepaid)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
              <span>Deterministic Unused Prepaid Estimate:</span>
              <span className="font-bold text-emerald-600">{formatINR(estimatedUnused)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Note: The final unspent credit will be calculated deterministically at the exact time of review and snapshot creation.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit Migration Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inspect Request Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Portability Request: ${selectedRequest.requestNumber}`}
          subtitle="Cryptographic snapshot, audit trail events, and portable record details."
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
                  {formatINR(selectedRequest.unusedPrepaidValue)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Destination Provider</span>
                <span className="font-semibold text-slate-800">{selectedRequest.destinationProvider}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Destination Plan</span>
                <span className="font-semibold text-slate-800">{selectedRequest.destinationPlan}</span>
              </div>
            </div>

            {selectedRequest.records && selectedRequest.records.length > 0 && (
              <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-200">
                <span className="font-bold text-brand-900 block mb-1">Portable Record Fingerprint (SHA-256)</span>
                <code className="block p-2 bg-white rounded border border-brand-200 font-mono text-[10px] break-all text-slate-700">
                  {selectedRequest.records[0].record_fingerprint}
                </code>
                <span className="text-[10px] text-brand-600 mt-1 block">
                  Token: {selectedRequest.records[0].portable_token}
                </span>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Migration Audit Trail Events</h4>
              <div className="space-y-2 border-l-2 border-brand-200 pl-3">
                {selectedRequest.events && selectedRequest.events.length > 0 ? (
                  selectedRequest.events.map((ev) => (
                    <div key={ev.id} className="text-slate-600">
                      <span className="font-semibold text-slate-800 capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>{' '}
                      &bull; <span className="text-[10px] text-slate-400">{formatDateTime(ev.created_at)}</span>
                      <p className="text-[11px] text-slate-500">{ev.event_notes || 'Handshake logged.'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Request submitted; awaiting reviewer assignment.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PortalPortability;
