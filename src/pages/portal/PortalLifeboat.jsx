import React, { useState } from 'react';
import {
  LifeBuoy,
  Calendar,
  Clock,
  ArrowDownCircle,
  PauseCircle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export const PortalLifeboat = () => {
  const {
    portalCustomer,
    subscriptions,
    plans,
    lifeboatAdjustments,
    createLifeboatAdjustment,
  } = useData();

  // Filter subscriptions for this customer
  const mySubs = subscriptions.filter(
    (s) =>
      s.customerId === portalCustomer?.id ||
      (portalCustomer?.email && s.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  // Filter adjustments for this customer
  const myAdjustments = lifeboatAdjustments.filter(
    (a) =>
      a.customerId === portalCustomer?.id ||
      (portalCustomer?.id && a.customer_id === portalCustomer.id) ||
      (portalCustomer?.email && a.customer_email?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('Plan_Downgrade');
  const [temporaryPlanId, setTemporaryPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState('');
  const [deferredAmount, setDeferredAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected sub
  const selectedSub = mySubs.find((s) => s.id === selectedSubId);

  const handleOpenModal = () => {
    if (mySubs.length > 0) {
      setSelectedSubId(mySubs[0].id);
      if (plans.length > 0) {
        setTemporaryPlanId(plans[0].id);
      }
    }
    setAdjustmentType('Plan_Downgrade');
    setReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubId || !adjustmentType || !startDate || !endDate) return;
    setIsSubmitting(true);
    try {
      await createLifeboatAdjustment({
        subscription_id: selectedSubId,
        adjustment_type: adjustmentType,
        temporary_plan_id: adjustmentType === 'Plan_Downgrade' ? temporaryPlanId : null,
        start_date: startDate,
        end_date: endDate,
        scheduled_restoration_date: endDate,
        reason: reason || 'Temporary financial flexibility requested by customer',
        deferred_amount: adjustmentType === 'Payment_Deferral' ? Number(deferredAmount) : 0,
      });
      setIsModalOpen(false);
    } catch {
      // toast shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>Subscription Lifeboat</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Financial Flexibility & Relief</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Temporarily pause subscriptions, downgrade tiers, or defer payments during difficult periods without
            permanently cancelling your account or losing configuration history.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenModal}
          disabled={mySubs.length === 0}
          className="bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-lg text-xs shrink-0"
        >
          Request Lifeboat Relief
        </Button>
      </div>

      {/* Principle Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Automatic Restoration</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Original tier and pricing are automatically and idempotently restored when your relief window expires.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <PauseCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Zero Recurring Invoices</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pausing prevents normal recurring billing cycles until your scheduled return date.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Clear Payment Obligations</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Deferred payments remain clearly recorded as outstanding obligations, keeping accounting fully transparent.
            </p>
          </div>
        </div>
      </div>

      {/* Adjustments List */}
      <Card
        title="My Lifeboat Relief Adjustments"
        subtitle="Active and scheduled adjustments, relief durations, and upcoming restoration milestones."
      >
        {myAdjustments.length === 0 ? (
          <div className="text-center py-12">
            <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Active Lifeboat Adjustments</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All your subscriptions are currently running on standard recurring schedules. If you experience financial headwinds, request a temporary adjustment above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Adjustment #</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Relief Type</th>
                  <th className="py-3 px-4">Relief Window</th>
                  <th className="py-3 px-4">Scheduled Restoration</th>
                  <th className="py-3 px-4 text-right">Relief Impact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{adj.adjustmentNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{adj.subscription_number || adj.subscriptionId}</span>
                      <span className="block text-[11px] text-slate-400">{adj.original_plan_name || 'Standard Tier'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {adj.adjustmentType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(adj.startDate)} &rarr; {formatDate(adj.endDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formatDate(adj.scheduledRestorationDate)}</span>
                      </div>
                      {adj.isRestored && (
                        <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">
                          &bull; Restored to Original Plan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {adj.adjustmentType === 'Plan_Downgrade' ? (
                        <span className="text-emerald-600">
                          {formatINR(adj.originalPrice)} &rarr; {formatINR(adj.temporaryPrice)}
                        </span>
                      ) : adj.adjustmentType === 'Payment_Deferral' ? (
                        <span className="text-amber-600">Deferred: {formatINR(adj.deferredAmount)}</span>
                      ) : (
                        <span className="text-blue-600">Full Pause (₹0/mo)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={adj.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Request Lifeboat Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Lifeboat Relief"
        subtitle="Select a temporary adjustment plan to weather financial difficulties without losing your subscription history."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Subscription *
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
              required
            >
              {mySubs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subscriptionNumber} — {sub.product} ({sub.plan}) [₹{sub.totalAmount}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relief Mechanism *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Plan_Downgrade', label: 'Tier Downgrade', icon: ArrowDownCircle },
                { id: 'Subscription_Pause', label: 'Subscription Pause', icon: PauseCircle },
                { id: 'Payment_Deferral', label: 'Payment Deferral', icon: CreditCard },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = adjustmentType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAdjustmentType(opt.id)}
                    className={`flex flex-col items-center text-center p-3 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {adjustmentType === 'Plan_Downgrade' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Temporary Lower Tier Plan *
              </label>
              <select
                value={temporaryPlanId}
                onChange={(e) => setTemporaryPlanId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              >
                {plans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.planName} — {formatINR(pl.price)} / {pl.billingFrequency}
                  </option>
                ))}
              </select>
            </div>
          )}

          {adjustmentType === 'Payment_Deferral' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Deferral Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                value={deferredAmount}
                onChange={(e) => setDeferredAmount(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                This amount remains an outstanding obligation but collection enforcement is paused during the relief window.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relief Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Restoration Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Reason
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Budget restructuring during Q3 seasonal slowdown."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit Relief Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PortalLifeboat;
