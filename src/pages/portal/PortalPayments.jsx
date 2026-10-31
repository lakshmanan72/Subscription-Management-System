import React from 'react';
import { CreditCard, CheckCircle2, Download } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';

export const PortalPayments = () => {
  const { portalCustomer, payments } = useData();

  const myPays = payments.filter(
    (p) => p.customerId === portalCustomer?.id || (portalCustomer?.email && p.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );
  const totalSettled = myPays.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payment History & Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical settlement telemetry for {portalCustomer?.company}.
          </p>
        </div>

        <div className="bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
          Total Settled to Date: {formatINR(totalSettled)}
        </div>
      </div>

      <Card bodyClassName="p-0 overflow-x-auto">
        {myPays.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No payment receipts yet</h3>
            <p className="text-xs text-slate-500">Payments will appear here immediately upon reconciliation.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt Reference</th>
                <th className="py-3 px-4">Settled Invoice</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transaction / UTR #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPays.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-brand-600">
                    {p.paymentReference}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                    {p.invoice}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    {p.transactionId || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatINR(p.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{p.status}</span>
                    </span>
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

export default PortalPayments;

