import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  Clock,
  Sparkles,
  Percent,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const PortalOutcomeContracts = () => {
  const { portalCustomer, outcomeContracts, serviceCredits } = useData();

  // Filter contracts for this customer
  const myContracts = outcomeContracts.filter(
    (c) =>
      c.customerId === portalCustomer?.id ||
      (portalCustomer?.id && c.customer_id === portalCustomer.id) ||
      (portalCustomer?.email && c.customer_email?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  // Filter credits for this customer
  const myCredits = serviceCredits.filter(
    (cr) =>
      cr.customerId === portalCustomer?.id ||
      (portalCustomer?.id && cr.customer_id === portalCustomer.id) ||
      (portalCustomer?.email && cr.customer_email?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  const totalCreditsEarned = myCredits
    .filter((cr) => cr.status === 'Approved' || cr.status === 'Applied')
    .reduce((sum, cr) => sum + (cr.creditAmount || cr.credit_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Subscription Outcome Contracts</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Contractual Service Level Guarantees</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Measurable service commitments with transparent telemetry and deterministic service credits automatically
            applied if we fail to meet our agreed availability or latency SLAs.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-right shrink-0">
          <span className="text-[11px] text-violet-200 uppercase tracking-wider block">Total Service Credits Earned</span>
          <span className="text-2xl font-black text-white">{formatINR(totalCreditsEarned)}</span>
        </div>
      </div>

      {/* Contract Commitments & Active Contracts */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Outcome Contracts</h2>

        {myContracts.length === 0 ? (
          <Card bodyClassName="text-center py-12">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Outcome Contracts Active</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You do not have any customized outcome-based contracts linked to your subscriptions. Standard platform uptime SLA (99.9%) applies.
            </p>
          </Card>
        ) : (
          myContracts.map((contract) => (
            <Card key={contract.id} bodyClassName="p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                      {contract.contractNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{contract.contract_title || contract.contractNumber}</h3>
                    <Badge status={contract.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Subscription: <strong className="text-slate-700">{contract.subscription_number || contract.subscriptionId}</strong> &bull; Period: {formatDate(contract.startDate)} &rarr; {formatDate(contract.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Baseline Contract Fee</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatINR(contract.contract_value || 0)}
                  </span>
                </div>
              </div>

              {/* SLA Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-600" />
                  <span>Contractual Commitments & Thresholds</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contract.metrics && contract.metrics.length > 0 ? (
                    contract.metrics.map((m) => (
                      <div key={m.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{m.metric_name}</span>
                          <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
                            {m.measurement_unit}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <span className="text-slate-500">Target Commitment:</span>
                          <span className="font-bold text-slate-900">
                            {m.target_value} {m.measurement_unit}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs mt-0.5">
                          <span className="text-slate-500">Tolerance Margin:</span>
                          <span className="text-slate-700">&plusmn;{m.tolerance_margin} {m.measurement_unit}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs mt-0.5 pt-1 border-t border-slate-200">
                          <span className="text-slate-500">Service Credit Rate:</span>
                          <span className="font-bold text-emerald-600">{m.credit_percentage}% / breach</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 col-span-3">No specific metrics configured on this contract.</p>
                  )}
                </div>
              </div>

              {/* Performance Measurements Log */}
              {contract.measurements && contract.measurements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Recent Measured Performance Telemetry
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                          <th className="py-2 px-3">Period</th>
                          <th className="py-2 px-3">Metric</th>
                          <th className="py-2 px-3 text-right">Target</th>
                          <th className="py-2 px-3 text-right">Measured Telemetry</th>
                          <th className="py-2 px-3 text-center">Commitment Status</th>
                          <th className="py-2 px-3 text-right">Recorded At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {contract.measurements.map((meas) => (
                          <tr key={meas.id}>
                            <td className="py-2 px-3 font-medium text-slate-800">{meas.measurement_period}</td>
                            <td className="py-2 px-3 text-slate-600">{meas.metric_name || 'Service Availability'}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{meas.target_value}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {meas.measured_value}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {meas.status === 'Met' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Met
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <XCircle className="w-3 h-3" /> Breached
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400 text-[11px]">
                              {formatDateTime(meas.measured_at || meas.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Service Credits Table */}
      <Card
        title="Service Credits & Invoice Reductions"
        subtitle="Credits generated by contractual SLA performance, transparently deducted from your billing."
      >
        {myCredits.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-800">100% SLA Fulfillment</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No service breaches have occurred. All commitments are operating within contracted tolerances.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Credit #</th>
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4 text-right">Credit Amount</th>
                  <th className="py-3 px-4">Deterministic Calculation Evidence</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Applied Invoice</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCredits.map((crd) => (
                  <tr key={crd.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-violet-600">{crd.creditNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{crd.contract_number || crd.contractId}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                      {formatINR(crd.creditAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={crd.calculationNotes}>
                      {crd.calculationNotes || 'Deterministic SLA breach formula evaluation'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={crd.status} />
                    </td>
                    <td className="py-3 px-4">
                      {crd.appliedInvoiceId ? (
                        <span className="font-mono text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {crd.applied_invoice_number || crd.appliedInvoiceId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending Next Invoice</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatDate(crd.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PortalOutcomeContracts;
