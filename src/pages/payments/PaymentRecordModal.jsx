import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';

export const PaymentRecordModal = ({ isOpen, onClose, preselectedInvoice = null }) => {
  const { invoices, customers, recordPayment } = useData();

  const [invoiceId, setInvoiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  // Eligible invoices for recording payment
  const openInvoices = invoices.filter((i) => i.outstandingAmount > 0 || i.status !== 'Paid');

  useEffect(() => {
    if (preselectedInvoice) {
      setInvoiceId(preselectedInvoice.id);
      setCustomerId(preselectedInvoice.customerId || '');
      setAmount(preselectedInvoice.outstandingAmount || preselectedInvoice.total || '');
      setNotes(`Settlement for invoice ${preselectedInvoice.invoiceNumber}`);
    } else if (openInvoices.length > 0) {
      const first = openInvoices[0];
      setInvoiceId(first.id);
      setCustomerId(first.customerId || '');
      setAmount(first.outstandingAmount || first.total || '');
      setNotes(`Settlement for invoice ${first.invoiceNumber}`);
    }
  }, [preselectedInvoice, isOpen]);

  const handleInvoiceSelect = (id) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setCustomerId(inv.customerId || '');
      setAmount(inv.outstandingAmount || inv.total || '');
      setNotes(`Settlement for invoice ${inv.invoiceNumber}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    recordPayment({
      invoiceId,
      customerId,
      amount: Number(amount),
      paymentMethod,
      notes,
    });

    onClose();
  };

  const currentInvoice = invoices.find((i) => i.id === invoiceId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment Settlement"
      subtitle="Reconcile customer payment against outstanding tax invoices"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Record Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Target Invoice *
          </label>
          <select
            value={invoiceId}
            onChange={(e) => handleInvoiceSelect(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {openInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} — {inv.customer} (Pending: {formatINR(inv.outstandingAmount || inv.total)})
              </option>
            ))}
          </select>
          {currentInvoice && (
            <p className="text-[11px] text-slate-500 mt-1">
              Total Invoice Amount: <strong className="text-slate-700">{formatINR(currentInvoice.total)}</strong> &bull; Outstanding: <span className="text-rose-600 font-bold">{formatINR(currentInvoice.outstandingAmount)}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
            >
              <option value="UPI">UPI (Razorpay / PhonePe)</option>
              <option value="Bank transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="Card">Corporate Credit / Debit Card</option>
              <option value="Cash">Cash Counter Receipt</option>
              <option value="Other">Other / Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Settlement Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Reconciliation Remarks / UTR Reference
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bank UTR #9823482, Razorpay pay_id..."
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none text-slate-700"
          />
        </div>
      </form>
    </Modal>
  );
};

export default PaymentRecordModal;

