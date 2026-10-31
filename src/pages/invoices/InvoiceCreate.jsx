import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { customers, subscriptions, addInvoice } = useData();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [status, setStatus] = useState('Confirmed');
  const [notes, setNotes] = useState('Thank you for choosing Brightloop.');

  const [lines, setLines] = useState([
    {
      id: 'inv-l-1',
      description: 'Brightloop Subscription License Service',
      quantity: 1,
      unitPrice: 5000,
      taxRate: 18,
    },
  ]);

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = field === 'description' ? value : Number(value);
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: 'inv-l-' + Date.now(),
        description: 'Additional Service / Add-on Line',
        quantity: 1,
        unitPrice: 2000,
        taxRate: 18,
      },
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const subtotal = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const tax = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice * (l.taxRate / 100)), 0);
  const total = Math.round(subtotal + tax);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selCust = customers.find((c) => c.id === customerId);
    const selSub = subscriptions.find((s) => s.id === subscriptionId);

    const formattedLines = lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.quantity * l.unitPrice,
    }));

    const newInv = addInvoice({
      customer: selCust?.company || selCust?.name || 'Enterprise Client',
      customerId,
      customerEmail: selCust?.email || 'billing@enterprise.com',
      customerAddress: selCust?.address || 'Registered Office',
      customerGST: selCust?.gstin || '29ABCDE1234F1Z5',
      subscription: selSub ? selSub.subscriptionNumber : 'Direct Invoicing',
      subscriptionId: selSub ? selSub.id : null,
      invoiceDate,
      dueDate,
      subtotal,
      tax,
      discount: 0,
      total,
      status,
      paymentTerms,
      notes,
      lines: formattedLines,
    });

    navigate(`/invoices/${newInv.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/invoices')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={CheckCircle2}
          >
            Generate Tax Invoice
          </Button>
        </div>
      </div>

      <Card title="Invoice Header & Due Dates" subtitle="Set billing client and credit terms">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Account *
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Linked Subscription (Optional)
            </label>
            <select
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">Direct Invoicing (No Contract)</option>
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subscriptionNumber} — {s.customer}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Invoice Date
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Invoice Lines */}
      <Card
        title="Billed Line Items"
        subtitle="Services, subscriptions, and tax breakdown"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={addLine}
          >
            Add Line
          </Button>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 min-w-[260px]">Description</th>
              <th className="py-3 px-4 w-24 text-center">Qty</th>
              <th className="py-3 px-4 w-36">Unit Price (₹)</th>
              <th className="py-3 px-4 w-28 text-center">Taxes</th>
              <th className="py-3 px-4 text-right w-36">Total</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={line.id || idx}>
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                    className="w-16 text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-center font-semibold"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min="0"
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                    className="w-28 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <select
                    value={line.taxRate}
                    onChange={(e) => handleLineChange(idx, 'taxRate', e.target.value)}
                    className="text-xs px-2 py-1.5 rounded border border-slate-200"
                  >
                    <option value={18}>18% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={0}>0%</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  {formatINR(Math.round(line.quantity * line.unitPrice * (1 + line.taxRate / 100)))}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Subtotal: {formatINR(subtotal)} &bull; Taxes (GST): {formatINR(tax)}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-black text-brand-600">{formatINR(total)}</span>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default InvoiceCreate;

