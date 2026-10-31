import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Receipt,
  Clock,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PrintableInvoice from './PrintableInvoice';
import PaymentRecordModal from '../payments/PaymentRecordModal';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    invoices,
    payments,
    settings,
    confirmInvoice,
    cancelInvoice,
    sendInvoice,
  } = useData();

  const invoice = invoices.find((i) => i.id === id);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' | 'printable'

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Invoice Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested invoice reference does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id || p.invoice === invoice.invoiceNumber);

  const handleSend = () => {
    sendInvoice(invoice.id, invoice.customerEmail);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'Draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => confirmInvoice(invoice.id)}
            >
              Confirm Invoice
            </Button>
          )}

          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <Button
              variant="success"
              size="sm"
              icon={CreditCard}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Record Payment
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Mail}
            onClick={handleSend}
          >
            Send to Customer
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Tax Invoice
          </Button>

          {invoice.status !== 'Cancelled' && invoice.status !== 'Paid' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50"
              icon={XCircle}
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Render Official Printable Invoice Component */}
      <PrintableInvoice
        invoice={invoice}
        companySettings={settings}
        onSend={handleSend}
        onPrint={() => window.print()}
      />

      {/* Reconciled Payments History Card */}
      <Card
        title="Payment Reconciliations & Receipts"
        subtitle="Payments credited toward this tax invoice"
      >
        {invoicePayments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No payments have been recorded for this invoice yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Receipt Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Transaction / UTR</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicePayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-semibold text-brand-600">{p.paymentReference}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{p.transactionId || '—'}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatINR(p.amount)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedInvoice={invoice}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={() => {
          cancelInvoice(invoice.id);
          setIsCancelDialogOpen(false);
        }}
        title="Cancel Tax Invoice"
        message={`Are you sure you want to cancel invoice ${invoice.invoiceNumber}? This will mark it as void and reverse outstanding dues.`}
      />
    </div>
  );
};

export default InvoiceDetail;

