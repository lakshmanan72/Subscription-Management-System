import React from 'react';
import { Sparkles, Printer, Download, Mail, CheckCircle2 } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';

export const PrintableInvoice = ({ invoice, companySettings, onPrint, onSend }) => {
  if (!invoice) return null;

  const company = companySettings?.companyProfile || {
    name: 'Brightloop Technologies India Pvt Ltd',
    legalName: 'Brightloop Cloud Services Private Limited',
    taxId: '29AABCB1234F1Z9',
    pan: 'AABCB1234F',
    email: 'billing@brightloop.io',
    phone: '+91 (080) 4123-8900',
    website: 'https://brightloop.io',
    address: 'Level 5, Embassy Tech Village, Outer Ring Road, Devarabisanahalli, Bengaluru, Karnataka, 560103',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10 max-w-4xl mx-auto" id="printable-invoice">
      {/* Top Banner & Control Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Official Tax Invoice Copy
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSend && (
            <Button variant="secondary" size="sm" icon={Mail} onClick={onSend}>
              Email Customer
            </Button>
          )}
          <Button variant="primary" size="sm" icon={Printer} onClick={onPrint || (() => window.print())}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Bright<span className="text-brand-600">loop</span>
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800">{company.legalName}</p>
          <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
            {company.address}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <strong>GSTIN:</strong> {company.taxId} &bull; <strong>PAN:</strong> {company.pan}
          </p>
          <p className="text-xs text-slate-500">{company.email} &bull; {company.phone}</p>
        </div>

        <div className="sm:text-right">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Tax Invoice
          </h2>
          <div className="text-sm font-bold text-brand-600 mt-1">{invoice.invoiceNumber}</div>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div>
              <span className="text-slate-400">Invoice Date: </span>
              <span className="font-semibold text-slate-800">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div>
              <span className="text-slate-400">Due Date: </span>
              <span className="font-semibold text-slate-800">{formatDate(invoice.dueDate)}</span>
            </div>
            <div>
              <span className="text-slate-400">Contract Ref: </span>
              <span className="font-mono font-medium text-slate-700">{invoice.subscription || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Billed To / Client Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Billed To
          </span>
          <h4 className="text-base font-bold text-slate-900">{invoice.customer}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{invoice.customerEmail}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">
            {invoice.customerAddress || 'Client Registered Address'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <strong>Customer GSTIN:</strong> {invoice.customerGST || '29ABCDE1234F1Z5'}
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Payment & Status
          </span>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border mb-2 bg-slate-50 text-slate-800">
            Status: {invoice.status}
          </div>
          <div className="text-xs text-slate-500">
            Terms: <span className="font-semibold text-slate-800">{invoice.paymentTerms || 'Immediate'}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-2">Item Description</th>
              <th className="py-3 px-2 text-center">Qty</th>
              <th className="py-3 px-2 text-right">Unit Rate</th>
              <th className="py-3 px-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lines?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3.5 px-2">
                  <div className="font-semibold text-slate-900">{item.description}</div>
                  <span className="text-[11px] text-slate-400">HSN/SAC: 998313 (IT Software as a Service)</span>
                </td>
                <td className="py-3.5 px-2 text-center font-medium text-slate-700">{item.quantity}</td>
                <td className="py-3.5 px-2 text-right text-slate-700">{formatINR(item.unitPrice)}</td>
                <td className="py-3.5 px-2 text-right font-bold text-slate-900">
                  {formatINR(item.amount || item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Bank Wire Instructions */}
      <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-sm w-full">
          <span className="font-bold text-slate-800 block mb-1">Bank Settlement Details</span>
          <p>Bank: HDFC Bank Ltd (Indiranagar)</p>
          <p>A/C Name: Brightloop Cloud Services Pvt Ltd</p>
          <p>A/C No: 50200088991234</p>
          <p>IFSC Code: HDFC0001234</p>
          <p className="mt-1.5 text-[11px] text-slate-400">UPI ID: billing@brightloop</p>
        </div>

        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Subtotal</span>
            <span className="font-semibold text-slate-800">{formatINR(invoice.subtotal)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>CGST (9%)</span>
            <span className="font-semibold text-slate-800">{formatINR(Math.round(invoice.tax / 2))}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>SGST (9%)</span>
            <span className="font-semibold text-slate-800">{formatINR(Math.round(invoice.tax / 2))}</span>
          </div>

          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Applied Discount</span>
              <span className="font-semibold">-{formatINR(invoice.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Invoice Total</span>
            <span className="text-brand-600">{formatINR(invoice.total)}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600 pt-1">
            <span>Paid to Date</span>
            <span className="font-semibold text-emerald-700">{formatINR(invoice.paidAmount || 0)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Balance Outstanding</span>
            <span className={invoice.outstandingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {formatINR(invoice.outstandingAmount || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Footer Declaration */}
      <div className="mt-10 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
        This is a computer-generated tax invoice and requires no physical signature under the Indian IT Act, 2000.
      </div>
    </div>
  );
};

export default PrintableInvoice;

