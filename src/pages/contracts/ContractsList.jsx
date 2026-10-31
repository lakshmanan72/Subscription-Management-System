import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Activity,
  CheckCircle2,
  XCircle,
  Receipt,
  FileCheck2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export const ContractsList = () => {
  const {
    outcomeContracts,
    serviceCredits,
    subscriptions,
    customers,
    invoices,
    createOutcomeContract,
    recordContractMeasurement,
    reviewServiceCredit,
    applyServiceCreditToInvoice,
  } = useData();

  const [activeTab, setActiveTab] = useState('contracts');

  // Contract Creation Modal
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [metricName, setMetricName] = useState('Service Availability');
  const [targetValue, setTargetValue] = useState(99.9);
  const [toleranceMargin, setToleranceMargin] = useState(0.05);
  const [creditPct, setCreditPct] = useState(10.0);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // Telemetry Recording Modal
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [telemetryContractId, setTelemetryContractId] = useState('');
  const [telemetryPeriod, setTelemetryPeriod] = useState('October 2026');
  const [measuredValue, setMeasuredValue] = useState(99.4);
  const [isManualEvidence, setIsManualEvidence] = useState(false);
  const [evidenceSource, setEvidenceSource] = useState('Datadog Synthetic Monitoring');
  const [isSubmittingTelemetry, setIsSubmittingTelemetry] = useState(false);

  // Credit Review Modal
  const [creditToReview, setCreditToReview] = useState(null);
  const [creditReviewAction, setCreditReviewAction] = useState('Approve');
  const [creditReviewNotes, setCreditReviewNotes] = useState('');
  const [isSubmittingCreditReview, setIsSubmittingCreditReview] = useState(false);

  // Apply Credit to Invoice Modal
  const [creditToApply, setCreditToApply] = useState(null);
  const [targetInvoiceId, setTargetInvoiceId] = useState('');
  const [isApplyingCredit, setIsApplyingCredit] = useState(false);

  // Filter open invoices for the credit's customer
  const eligibleInvoices = invoices.filter((i) => {
    if (!creditToApply) return false;
    const matchesCustomer =
      i.customerId === creditToApply.customer_id || i.customerId === creditToApply.customerId;
    const isOpen = i.status === 'Draft' || i.status === 'Confirmed' || i.status === 'Overdue';
    return matchesCustomer && isOpen;
  });

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedSubscriptionId) return;
    setIsCreatingContract(true);
    try {
      await createOutcomeContract({
        customer_id: selectedCustomerId,
        subscription_id: selectedSubscriptionId,
        contract_title: contractTitle || 'Enterprise SLA Outcome Agreement',
        start_date: startDate,
        end_date: endDate,
        metrics: [
          {
            metric_name: metricName,
            target_value: Number(targetValue),
            tolerance_margin: Number(toleranceMargin),
            measurement_unit: metricName.includes('Availability') ? '%' : 'ms',
            credit_percentage: Number(creditPct),
            calculation_rule: 'PROPORTIONAL_DEFICIT',
          },
        ],
      });
      setIsContractModalOpen(false);
    } catch {
      // toast in DataContext
    } finally {
      setIsCreatingContract(false);
    }
  };

  const handleRecordTelemetry = async (e) => {
    e.preventDefault();
    if (!telemetryContractId) return;
    setIsSubmittingTelemetry(true);
    try {
      await recordContractMeasurement(telemetryContractId, {
        measurement_period: telemetryPeriod,
        measured_value: Number(measuredValue),
        is_manual_evidence: isManualEvidence,
        evidence_source: evidenceSource,
      });
      setIsTelemetryModalOpen(false);
    } catch {
      // toast in DataContext
    } finally {
      setIsSubmittingTelemetry(false);
    }
  };

  const handleReviewCreditSubmit = async (e) => {
    e.preventDefault();
    if (!creditToReview) return;
    setIsSubmittingCreditReview(true);
    try {
      await reviewServiceCredit(creditToReview.id, creditReviewAction, creditReviewNotes);
      setCreditToReview(null);
    } catch {
      // handled
    } finally {
      setIsSubmittingCreditReview(false);
    }
  };

  const handleApplyCreditSubmit = async (e) => {
    e.preventDefault();
    if (!creditToApply || !targetInvoiceId) return;
    setIsApplyingCredit(true);
    try {
      await applyServiceCreditToInvoice(creditToApply.id, targetInvoiceId);
      setCreditToApply(null);
    } catch {
      // handled
    } finally {
      setIsApplyingCredit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Innovation Module 3</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Outcome Contracts & Service Credits
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage contractual SLAs, record telemetry measurements, evaluate breach formulas deterministically, and apply approved credits to invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={Activity}
            onClick={() => {
              if (outcomeContracts.length > 0) setTelemetryContractId(outcomeContracts[0].id);
              setIsTelemetryModalOpen(true);
            }}
            className="text-xs text-violet-700 border-violet-300 hover:bg-violet-50"
          >
            Record Telemetry
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              if (customers.length > 0) setSelectedCustomerId(customers[0].id);
              if (subscriptions.length > 0) setSelectedSubscriptionId(subscriptions[0].id);
              setIsContractModalOpen(true);
            }}
            className="text-xs bg-violet-600 hover:bg-violet-700"
          >
            Create Contract
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'contracts'
                ? 'border-violet-600 text-violet-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Outcome Contracts ({outcomeContracts.length})
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'credits'
                ? 'border-violet-600 text-violet-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Service Credits & Invoice Application ({serviceCredits.length})
          </button>
        </nav>
      </div>

      {/* Tab 1: Contracts List */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4">Contract #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Subscription #</th>
                    <th className="py-3 px-4">Contract Term</th>
                    <th className="py-3 px-4">Configured SLA Commitments</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outcomeContracts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No outcome contracts created yet. Click 'Create Contract' to set up SLA commitments.
                      </td>
                    </tr>
                  ) : (
                    outcomeContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-600">
                          {c.contractNumber || c.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{c.customer_name}</span>
                          <span className="text-[10px] text-slate-400">{c.customer_id}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {c.subscription_number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(c.startDate)} &rarr; {formatDate(c.endDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {c.metrics?.map((m) => (
                              <span
                                key={m.id}
                                className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-semibold"
                              >
                                {m.metric_name}: {m.target_value}
                                {m.measurement_unit} (&plusmn;{m.tolerance_margin}) &bull; {m.credit_percentage}% crd
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge status={c.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Service Credits & Invoice Application */}
      {activeTab === 'credits' && (
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3 px-4">Credit #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contract #</th>
                    <th className="py-3 px-4 text-right">Credit Amount</th>
                    <th className="py-3 px-4">Deterministic Breach Evidence</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Applied Invoice</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceCredits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No service credits calculated. Record a performance telemetry breach to evaluate credits.
                      </td>
                    </tr>
                  ) : (
                    serviceCredits.map((crd) => (
                      <tr key={crd.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-600">
                          {crd.creditNumber || crd.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{crd.customer_name}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{crd.contract_number}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                          {formatINR(crd.creditAmount || crd.credit_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={crd.calculationNotes}>
                          {crd.calculationNotes || 'Deterministic SLA breach calculation'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge status={crd.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          {crd.appliedInvoiceId || crd.applied_invoice_id ? (
                            <span className="font-mono text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {crd.applied_invoice_number || crd.appliedInvoiceId || crd.applied_invoice_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unapplied</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(crd.status === 'Eligible' || crd.status === 'Requested') && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setCreditToReview(crd);
                                  setCreditReviewAction('Approve');
                                  setCreditReviewNotes('');
                                }}
                                className="text-[11px] py-1 px-2.5 bg-violet-600 hover:bg-violet-700"
                              >
                                Review
                              </Button>
                            )}

                            {crd.status === 'Approved' && !crd.appliedInvoiceId && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => {
                                  setCreditToApply(crd);
                                  setTargetInvoiceId('');
                                }}
                                className="text-[11px] py-1 px-2.5"
                              >
                                Apply to Invoice
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
        </div>
      )}

      {/* Modal: Create Contract */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Create Subscription Outcome Contract"
        subtitle="Establish contractual SLA commitments with deterministic credit remedies."
      >
        <form onSubmit={handleCreateContract} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title *</label>
            <input
              type="text"
              placeholder="e.g. Enterprise Tier-1 Cloud Availability SLA"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Subscription *</label>
              <select
                value={selectedSubscriptionId}
                onChange={(e) => setSelectedSubscriptionId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              >
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subscriptionNumber} — {s.product} ({s.customer_name || s.customerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 space-y-3">
            <span className="text-xs font-bold text-violet-900 block">Metric & SLA Guarantee Parameters</span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Metric Name</label>
                <input
                  type="text"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Value (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tolerance Margin</label>
                <input
                  type="number"
                  step="0.01"
                  value={toleranceMargin}
                  onChange={(e) => setToleranceMargin(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Credit Rate (% / breach)</label>
                <input
                  type="number"
                  step="0.1"
                  value={creditPct}
                  onChange={(e) => setCreditPct(e.target.value)}
                  className="w-full text-xs rounded border border-slate-300 px-2 py-1.5"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsContractModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingContract}>
              Create Outcome Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Telemetry */}
      <Modal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        title="Record Performance Telemetry Measurement"
        subtitle="Submit verified telemetry. Deterministic credit formulas will automatically evaluate any SLA breach."
      >
        <form onSubmit={handleRecordTelemetry} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome Contract *</label>
            <select
              value={telemetryContractId}
              onChange={(e) => setTelemetryContractId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
              required
            >
              {outcomeContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} — {c.customer_name} ({c.contract_title || 'SLA Contract'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Measurement Period *</label>
              <input
                type="text"
                placeholder="e.g. October 2026"
                value={telemetryPeriod}
                onChange={(e) => setTelemetryPeriod(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Measured Value *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 99.4"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telemetry / Evidence Source</label>
            <input
              type="text"
              placeholder="e.g. Datadog APM, Prometheus, or Pingdom synthetic logs"
              value={evidenceSource}
              onChange={(e) => setEvidenceSource(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isManual"
              checked={isManualEvidence}
              onChange={(e) => setIsManualEvidence(e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="isManual" className="text-xs text-slate-700 font-medium">
              Flag as manually submitted customer evidence (vs automated system telemetry)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsTelemetryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingTelemetry}>
              Evaluate & Save Measurement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Credit */}
      {creditToReview && (
        <Modal
          isOpen={!!creditToReview}
          onClose={() => setCreditToReview(null)}
          title={`Review Service Credit: ${creditToReview.creditNumber}`}
          subtitle="Authorize or reject generated service credit prior to invoice application."
        >
          <form onSubmit={handleReviewCreditSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{creditToReview.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculated Credit:</span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatINR(creditToReview.creditAmount || creditToReview.credit_amount)}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <strong>Breach Evidence:</strong> {creditToReview.calculationNotes}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreditReviewAction('Approve')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    creditReviewAction === 'Approve'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Approve Service Credit
                </button>
                <button
                  type="button"
                  onClick={() => setCreditReviewAction('Reject')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    creditReviewAction === 'Reject'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Reject Credit
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review Notes</label>
              <textarea
                rows={2}
                placeholder="Audit notes for this credit decision..."
                value={creditReviewNotes}
                onChange={(e) => setCreditReviewNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setCreditToReview(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingCreditReview}>
                Save Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Apply Credit to Invoice */}
      {creditToApply && (
        <Modal
          isOpen={!!creditToApply}
          onClose={() => setCreditToApply(null)}
          title={`Apply Credit (${formatINR(creditToApply.creditAmount || creditToApply.credit_amount)}) to Invoice`}
          subtitle={`Select an eligible open invoice for ${creditToApply.customer_name}.`}
        >
          <form onSubmit={handleApplyCreditSubmit} className="space-y-4">
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200 text-xs text-violet-900">
              <p className="font-semibold">Financial Safety Rules Applied:</p>
              <p className="mt-0.5">
                The original invoice total is preserved. The credit amount is deducted from the invoice's outstanding balance, and marked as Applied.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Open Invoice *</label>
              {eligibleInvoices.length === 0 ? (
                <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded border border-rose-200">
                  No open or overdue invoices found for this customer. A newly generated invoice will automatically receive this credit during next billing run.
                </p>
              ) : (
                <select
                  value={targetInvoiceId}
                  onChange={(e) => setTargetInvoiceId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                  required
                >
                  <option value="">Select Invoice...</option>
                  {eligibleInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — Outstanding: {formatINR(inv.outstandingAmount || inv.totalAmount)} ({inv.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setCreditToApply(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                disabled={!targetInvoiceId || eligibleInvoices.length === 0}
                isLoading={isApplyingCredit}
              >
                Apply Credit to Invoice
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ContractsList;
