import React, { useState } from 'react';
import { Repeat, Calendar, Clock, CreditCard, PauseCircle, PlayCircle, XCircle, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export const PortalSubscriptions = () => {
  const { portalCustomer, subscriptions, updateSubscriptionStatus } = useData();

  const mySubs = subscriptions.filter(
    (s) => s.customerId === portalCustomer?.id || (portalCustomer?.email && s.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    variant: 'danger',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">My Subscriptions & Licenses</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review active plans, manage pause requests, and monitor upcoming renewal dates.
        </p>
      </div>

      {mySubs.length === 0 ? (
        <Card bodyClassName="text-center py-12">
          <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No active subscriptions</h3>
          <p className="text-xs text-slate-500">Contact Brightloop sales to activate your enterprise license.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {mySubs.map((sub) => (
            <Card key={sub.id} bodyClassName="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {sub.subscriptionNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{sub.product}</h3>
                    <Badge status={sub.status} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Plan Offering: <strong>{sub.plan}</strong> &bull; Billing Cadence: <span className="capitalize">{sub.billingFrequency}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Start Date: {formatDate(sub.startDate)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Next Renewal: {formatDate(sub.expiryDate)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Payment Terms: {sub.paymentTerms || 'Net 15'}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Recurring Fee</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {formatINR(sub.totalAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Includes GST 18%</span>
                </div>
              </div>

              {/* Product Lines Breakdown */}
              <div className="py-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Licensed Product Lines
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100">
                        <th className="py-2">Item</th>
                        <th className="py-2">Variant / Edition</th>
                        <th className="py-2 text-center">Allocated Seats</th>
                        <th className="py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sub.productLines?.map((pl, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-medium text-slate-800">{pl.productName}</td>
                          <td className="py-2.5 text-slate-500">{pl.variantName || 'Standard'}</td>
                          <td className="py-2.5 text-center font-bold text-slate-700">{pl.quantity}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(pl.total || (pl.quantity * pl.unitPrice))}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td className="py-2.5 font-medium text-slate-800">{sub.product}</td>
                          <td className="py-2.5 text-slate-500">Standard Edition</td>
                          <td className="py-2.5 text-center font-bold text-slate-700">{sub.quantity || 1}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(sub.totalAmount)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Auto-renewal is active. Invoices are dispatched 7 days prior to renewal.
                </div>

                <div className="flex items-center gap-2">
                  {sub.status === 'Active' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={PauseCircle}
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Request Temporary Pause',
                          message: `Pause subscription ${sub.subscriptionNumber}? Recurring billing will be held until resumed.`,
                          action: () => updateSubscriptionStatus(sub.id, 'Paused', 'Customer requested pause via self-service portal.'),
                          variant: 'amber',
                        })
                      }
                    >
                      Request Pause
                    </Button>
                  )}

                  {sub.status === 'Paused' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={PlayCircle}
                      onClick={() => updateSubscriptionStatus(sub.id, 'Active', 'Customer resumed subscription via portal.')}
                    >
                      Resume Subscription
                    </Button>
                  )}

                  {sub.status !== 'Closed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      icon={XCircle}
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Request Subscription Cancellation',
                          message: `Are you sure you want to terminate subscription ${sub.subscriptionNumber}? Your license access will conclude at the end of the billing term.`,
                          action: () => updateSubscriptionStatus(sub.id, 'Closed', 'Customer cancelled subscription via self-service portal.'),
                          variant: 'danger',
                        })
                      }
                    >
                      Request Cancellation
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
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

export default PortalSubscriptions;

