import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  RotateCw,
  XCircle,
  Clock,
  Calendar,
  Building,
  CreditCard,
  FileText,
  Plus,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate, getStatusBadge } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    subscriptions,
    updateSubscriptionStatus,
    renewSubscription,
    addInvoice,
  } = useData();

  const subscription = subscriptions.find((s) => s.id === id);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    variant: 'danger',
  });

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Subscription Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested subscription reference does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  // Stepper lifecycle stages
  const stages = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
  const currentStageIndex = stages.indexOf(subscription.status);

  // Generate an invoice from this subscription
  const handleGenerateInvoice = () => {
    const lines = subscription.productLines || [];
    let subtotal = 0;
    let tax = 0;
    if (lines.length > 0) {
      subtotal = lines.reduce((acc, l) => acc + (Number(l.quantity || 1) * Number(l.unitPrice || 0)), 0);
      tax = lines.reduce((acc, l) => acc + (Number(l.quantity || 1) * Number(l.unitPrice || 0) * (Number(l.taxRate || 18) / 100)), 0);
    } else {
      subtotal = Math.round(subscription.totalAmount / 1.18);
      tax = subscription.totalAmount - subtotal;
    }
    const total = Math.round(subtotal + tax);

    const newInv = addInvoice({
      customer: subscription.customer,
      customerId: subscription.customerId,
      customerEmail: subscription.customerEmail,
      subscription: subscription.subscriptionNumber,
      subscriptionId: subscription.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      subtotal,
      tax: Math.round(tax),
      discount: 0,
      total,
      status: 'Confirmed',
      paymentTerms: subscription.paymentTerms || 'Net 15',
      lines: lines.length > 0 ? lines.map((pl) => ({
        description: `${pl.productName} (${pl.variantName || 'Standard'}) - ${subscription.billingFrequency}`,
        quantity: pl.quantity || 1,
        unitPrice: pl.unitPrice,
        amount: pl.total || (pl.quantity * pl.unitPrice),
      })) : [
        {
          description: `${subscription.product} - ${subscription.billingFrequency}`,
          quantity: subscription.quantity || 1,
          unitPrice: subscription.unitPrice || subtotal,
          amount: subtotal,
        }
      ],
    });

    navigate(`/invoices/${newInv.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subscriptions</span>
        </button>

        {/* Dynamic Context Actions Based on Current Lifecycle Status */}
        <div className="flex flex-wrap items-center gap-2">
          {subscription.status === 'Draft' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={Send}
                onClick={() => updateSubscriptionStatus(subscription.id, 'Quotation')}
              >
                Send Quotation
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => updateSubscriptionStatus(subscription.id, 'Confirmed')}
              >
                Confirm Subscription
              </Button>
            </>
          )}

          {subscription.status === 'Quotation' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => updateSubscriptionStatus(subscription.id, 'Confirmed')}
            >
              Confirm Quotation
            </Button>
          )}

          {subscription.status === 'Confirmed' && (
            <Button
              variant="success"
              size="sm"
              icon={PlayCircle}
              onClick={() => updateSubscriptionStatus(subscription.id, 'Active')}
            >
              Activate Contract
            </Button>
          )}

          {subscription.status === 'Active' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={handleGenerateInvoice}
              >
                Generate Cycle Invoice
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={PauseCircle}
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Pause Subscription',
                    message: `Are you sure you want to pause recurring billing for ${subscription.customer}? No automatic invoices will be created until resumed.`,
                    action: () => updateSubscriptionStatus(subscription.id, 'Paused', 'Operator paused contract.'),
                    variant: 'amber',
                  })
                }
              >
                Pause
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCw}
                onClick={() => renewSubscription(subscription.id)}
              >
                Renew (+1 Year)
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Close Subscription',
                    message: `Closing subscription ${subscription.subscriptionNumber} will terminate active recurring billing immediately.`,
                    action: () => updateSubscriptionStatus(subscription.id, 'Closed', 'Contract closed by admin.'),
                    variant: 'danger',
                  })
                }
              >
                Close Contract
              </Button>
            </>
          )}

          {subscription.status === 'Paused' && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={PlayCircle}
                onClick={() => updateSubscriptionStatus(subscription.id, 'Active', 'Contract resumed by operator.')}
              >
                Resume Subscription
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Close Subscription',
                    message: 'Terminate paused subscription permanently?',
                    action: () => updateSubscriptionStatus(subscription.id, 'Closed', 'Closed while paused.'),
                    variant: 'danger',
                  })
                }
              >
                Close
              </Button>
            </>
          )}

          {subscription.status === 'Closed' && (
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              onClick={() => renewSubscription(subscription.id)}
            >
              Re-activate Contract
            </Button>
          )}
        </div>
      </div>

      {/* Visual Stepper Lifecycle Bar */}
      <Card bodyClassName="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lifecycle Progress:
          </span>

          <div className="flex items-center w-full max-w-2xl justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            {stages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex || (subscription.status === 'Paused' && st === 'Active');

              return (
                <div key={st} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white border-brand-600 ring-4 ring-brand-100'
                        : isPast
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1 whitespace-nowrap ${
                      isCurrent ? 'text-brand-700 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Details Hero Card */}
      <Card bodyClassName="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {subscription.subscriptionNumber}
              </span>
              <Badge status={subscription.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700">{subscription.customer}</strong>
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>{subscription.customerEmail}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start: {formatDate(subscription.startDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Expires: {formatDate(subscription.expiryDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>Terms: {subscription.paymentTerms || 'Immediate'}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-right min-w-[220px]">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Recurring Value</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {formatINR(subscription.totalAmount)}
            </div>
            <span className="text-xs text-brand-600 font-semibold block mt-0.5">
              per {subscription.billingFrequency}
            </span>
          </div>
        </div>

        {/* Product Lines Breakdown */}
        <div className="pt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Contracted Product Lines & Quantities
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Variant Option</th>
                  <th className="py-2.5 px-4 text-center">Seats / Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-center">Tax Rate</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscription.productLines?.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{line.productName}</td>
                    <td className="py-3 px-4 text-slate-500">{line.variantName || 'Standard'}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{line.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatINR(line.unitPrice)}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{line.taxRate || 18}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(line.total || Math.round(line.quantity * line.unitPrice * 1.18))}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">{subscription.product}</td>
                    <td className="py-3 px-4 text-slate-500">Standard</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{subscription.quantity || 1}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatINR(subscription.unitPrice)}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{subscription.taxes}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(subscription.totalAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Activity Timeline Feed */}
      <Card
        title="Subscription Audit & Activity Timeline"
        subtitle="Chronological audit trail of lifecycle events, renewals, and invoice runs"
      >
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {subscription.activityTimeline?.map((item) => (
            <div key={item.id} className="relative flex items-start gap-3">
              <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-brand-600 ring-4 ring-white" />
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 w-full">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                <div className="mt-2 text-[10px] font-medium text-slate-400">
                  Logged by: <span className="text-slate-600">{item.user}</span>
                </div>
              </div>
            </div>
          )) || (
            <p className="text-xs text-slate-400">No activity recorded yet.</p>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => {
          if (confirmDialog.action) confirmDialog.action();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
    </div>
  );
};

export default SubscriptionDetail;

