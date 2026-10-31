import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Receipt,
  Eye,
  Printer,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import PaymentRecordModal from '../payments/PaymentRecordModal';

export const InvoicesList = () => {
  const navigate = useNavigate();
  const { invoices, confirmInvoice, cancelInvoice } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Record payment modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  const filtered = invoices.filter((inv) => {
    const matchesQuery =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.subscription && inv.subscription.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Overdue' ? inv.status === 'Overdue' : inv.status === statusFilter);

    return matchesQuery && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tax invoices, GST compliance lines, and settlement reconciliation.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => navigate('/invoices/new')}
        >
          Create Invoice
        </Button>
      </div>

      {/* Search & Filter */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, subscription..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="Create an invoice or generate one from an active subscription."
            actionLabel="Create Invoice"
            onAction={() => navigate('/invoices/new')}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Subscription</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Tax</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((inv) => {
                const isOverdue = inv.status === 'Overdue';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className={`hover:bg-slate-50/90 transition-colors group cursor-pointer ${
                      isOverdue ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 font-semibold text-brand-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900">
                      {inv.customer}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                      {inv.subscription || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {formatINR(inv.subtotal)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">
                      {formatINR(inv.tax)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      {formatINR(inv.total)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-700 font-medium">
                      {formatINR(inv.paidAmount || 0)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold">
                      {inv.outstandingAmount > 0 ? (
                        <span className={isOverdue ? 'text-rose-600' : 'text-amber-700'}>
                          {formatINR(inv.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                            title="Record Payment"
                          >
                            Pay
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="View / Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      {selectedInvoiceForPayment && (
        <PaymentRecordModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          preselectedInvoice={selectedInvoiceForPayment}
        />
      )}
    </div>
  );
};

export default InvoicesList;

