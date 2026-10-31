import React, { useState } from 'react';
import { Plus, Search, CreditCard, CheckCircle2, Eye, ArrowUpRight, DollarSign, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import PaymentRecordModal from './PaymentRecordModal';

export const PaymentsList = () => {
  const { payments, invoices } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

  // Compute metrics
  const totalSettled = payments.reduce((acc, p) => acc + (p.status === 'Success' ? p.amount : 0), 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0);

  const filtered = payments.filter((p) => {
    const matchesQuery =
      p.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.invoice && p.invoice.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;

    return matchesQuery && matchesMethod;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments & Collections</h1>
          <p className="text-xs text-slate-500 mt-1">
            Settlement records across UPI, Bank Wire, Corporate Cards, and cash receipts.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsRecordModalOpen(true)}
        >
          Record Payment
        </Button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
              Total Settled Payments
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatINR(totalSettled)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Reconciled in bank feeds</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
              Outstanding Receivables
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatINR(totalOutstanding)}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Pending client clearance</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
              Payment Transactions
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {payments.length}
            </div>
            <span className="text-[11px] text-brand-600 font-medium">100% gateway success rate</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl border border-brand-100">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by payment reference, customer, invoice #, transaction ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Bank transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records found"
            description="Record a customer payment settlement against open invoices."
            actionLabel="Record Payment"
            onAction={() => setIsRecordModalOpen(true)}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction / UTR</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPaymentDetail(p)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-brand-600">
                    {p.paymentReference}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {p.customer}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {p.invoice || 'Manual'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {p.transactionId || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatINR(p.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedPaymentDetail(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      title="View payment breakdown"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Record Payment Modal */}
      <PaymentRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      {/* Payment Details Drawer/Modal */}
      {selectedPaymentDetail && (
        <Card
          title={`Payment Receipt: ${selectedPaymentDetail.paymentReference}`}
          subtitle="Transaction telemetry & bank reconciliation"
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedPaymentDetail(null)}
            >
              Close
            </Button>
          }
          className="border-brand-200 bg-brand-50/20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Customer</span>
              <strong className="text-slate-900 text-sm">{selectedPaymentDetail.customer}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Target Invoice</span>
              <span className="font-semibold text-brand-600">{selectedPaymentDetail.invoice}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Amount Paid</span>
              <span className="text-base font-bold text-emerald-700">{formatINR(selectedPaymentDetail.amount)}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Transaction / UTR</span>
              <span className="font-mono text-slate-700">{selectedPaymentDetail.transactionId || '—'}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
            <strong>Notes:</strong> {selectedPaymentDetail.notes || 'No additional remarks.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default PaymentsList;

