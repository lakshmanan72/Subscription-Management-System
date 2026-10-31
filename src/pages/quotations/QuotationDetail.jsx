import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck2,
  Repeat,
  Printer,
  CheckCircle,
  Clock,
  Calendar,
  Building,
  Mail,
  Send,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, updateQuotation, convertQuotationToSubscription } = useData();

  const quotation = quotations.find((q) => q.id === id);

  if (!quotation) {
    return (
      <div className="text-center py-16">
        <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Quotation Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested quotation reference does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/quotations')}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus) => {
    updateQuotation(quotation.id, { status: newStatus });
  };

  const handleConvert = () => {
    const sub = convertQuotationToSubscription(quotation.id);
    if (sub) {
      navigate(`/subscriptions/${sub.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        {/* Dynamic Context Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Quotation
          </Button>

          {quotation.status === 'Draft' && (
            <Button
              variant="secondary"
              size="sm"
              icon={Send}
              onClick={() => handleStatusChange('Quotation')}
            >
              Mark Sent to Client
            </Button>
          )}

          {quotation.status === 'Quotation' && (
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleStatusChange('Confirmed')}
            >
              Confirm Quotation
            </Button>
          )}

          {quotation.status === 'Confirmed' && (
            <Button
              variant="primary"
              size="sm"
              icon={Repeat}
              onClick={handleConvert}
            >
              Convert to Active Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Main Quotation Header Card */}
      <Card bodyClassName="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-slate-900">{quotation.id}</span>
              <Badge status={quotation.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Template: <span className="font-semibold text-slate-700">{quotation.templateName || 'Standard'}</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Issued: {formatDate(quotation.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Valid Until: {formatDate(quotation.validityDate)}</span>
              </div>
            </div>
          </div>

          {/* Customer Snapshot Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 min-w-[260px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Customer Account
            </span>
            <div className="text-sm font-bold text-slate-900">{quotation.customer}</div>
            <p className="text-xs text-slate-500 mt-0.5">Primary Billing Contact</p>
          </div>
        </div>

        {/* Lines Breakdown */}
        <div className="pt-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Quoted Line Items
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Variant</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-center">Taxes</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.lines?.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{line.productName}</div>
                      <div className="text-[11px] text-brand-600">{line.planName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{line.variantName || '—'}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">{line.quantity}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">{formatINR(line.unitPrice)}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{line.taxRate || 18}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(line.total || (line.quantity * line.unitPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-100">
            <div className="max-w-md text-xs text-slate-500">
              <span className="font-semibold text-slate-700 block mb-1">Commercial Notes:</span>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {quotation.notes || 'Standard terms apply.'}
              </p>
            </div>

            <div className="w-full md:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatINR(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes (GST)</span>
                <span className="font-semibold text-slate-800">{formatINR(quotation.tax)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatINR(quotation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-brand-600">{formatINR(quotation.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuotationDetail;

