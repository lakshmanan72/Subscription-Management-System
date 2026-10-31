import React, { useState } from 'react';
import { Receipt, Printer, CreditCard, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import PrintableInvoice from '../invoices/PrintableInvoice';
import PaymentRecordModal from '../payments/PaymentRecordModal';

export const PortalInvoices = () => {
  const { portalCustomer, invoices, settings } = useData();

  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const myInvs = invoices.filter(
    (i) => i.customerId === portalCustomer?.id || (portalCustomer?.email && i.customerEmail?.toLowerCase() === portalCustomer.email.toLowerCase())
  );

  const filtered = myInvs.filter((inv) => {
    if (filter === 'ALL') return true;
    return inv.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Billing & Tax Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download GST-compliant tax invoices, check outstanding amounts, and make settlements.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
          {['ALL', 'Confirmed', 'Paid', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                filter === st
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      <Card bodyClassName="p-0 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-500">All accounts are up to date.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Contract Ref</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const isOverdue = inv.status === 'Overdue';

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isOverdue ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-brand-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {inv.subscription || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatINR(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold">
                      {inv.outstandingAmount > 0 ? (
                        <span className={isOverdue ? 'text-rose-600' : 'text-amber-700'}>
                          {formatINR(inv.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">₹0 (Paid)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CreditCard}
                            onClick={() => setSelectedInvoiceForPay(inv)}
                          >
                            Pay Now
                          </Button>
                        )}
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Printable Invoice Modal */}
      {selectedInvoiceForPrint && (
        <Modal
          isOpen={!!selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
          title={`Tax Invoice: ${selectedInvoiceForPrint.invoiceNumber}`}
          maxWidth="max-w-4xl"
        >
          <PrintableInvoice
            invoice={selectedInvoiceForPrint}
            companySettings={settings}
            onPrint={() => window.print()}
          />
        </Modal>
      )}

      {/* Payment Settlement Modal */}
      {selectedInvoiceForPay && (
        <PaymentRecordModal
          isOpen={!!selectedInvoiceForPay}
          onClose={() => setSelectedInvoiceForPay(null)}
          preselectedInvoice={selectedInvoiceForPay}
        />
      )}
    </div>
  );
};

export default PortalInvoices;

