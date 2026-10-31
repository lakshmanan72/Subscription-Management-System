import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Calculator, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const QuotationCreate = () => {
  const navigate = useNavigate();
  const { customers, products, plans, addQuotation } = useData();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [templateName, setTemplateName] = useState('Standard SaaS Annual Package');
  const [validityDays, setValidityDays] = useState(30);
  const [status, setStatus] = useState('Draft');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('Includes dedicated onboarding and first-year platform license.');

  // Dynamic Product and Plan line items
  const [lines, setLines] = useState([
    {
      id: 'line-' + Date.now(),
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      planId: plans[0]?.id || '',
      planName: plans[0]?.planName || '',
      variantName: products[0]?.variants?.[0]?.name || 'Standard Edition',
      quantity: 1,
      unitPrice: products[0]?.salesPrice || 4500,
      taxRate: 18,
    },
  ]);

  const handleProductChange = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === prodId);
    const relatedPlan = plans.find((pl) => pl.productId === prodId) || plans[0];
    const initialVariant = selectedProd?.variants?.[0];
    const adjustment = Number(initialVariant?.priceAdjustment || 0);
    const basePrice = relatedPlan?.price || selectedProd?.salesPrice || 4500;

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      productId: prodId,
      productName: selectedProd?.name || '',
      planId: relatedPlan?.id || '',
      planName: relatedPlan?.planName || '',
      variantName: initialVariant?.name || 'Standard Edition',
      unitPrice: basePrice + adjustment,
    };
    setLines(updated);
  };

  const handlePlanChange = (index, planId) => {
    const selPlan = plans.find((pl) => pl.id === planId);
    const line = lines[index];
    const currentProd = products.find((p) => p.id === line.productId);
    const selectedVariant = currentProd?.variants?.find((v) => v.name === line.variantName);
    const adjustment = Number(selectedVariant?.priceAdjustment || 0);
    const basePrice = selPlan?.price || currentProd?.salesPrice || 4500;

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      planId,
      planName: selPlan?.planName || '',
      unitPrice: basePrice + adjustment,
    };
    setLines(updated);
  };

  const handleVariantChange = (index, variantName) => {
    const line = lines[index];
    const currentProd = products.find((p) => p.id === line.productId);
    const selPlan = plans.find((pl) => pl.id === line.planId);
    const basePrice = selPlan?.price || currentProd?.salesPrice || 4500;
    const selectedVariant = currentProd?.variants?.find((v) => v.name === variantName);
    const adjustment = Number(selectedVariant?.priceAdjustment || 0);

    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      variantName,
      unitPrice: basePrice + adjustment,
    };
    setLines(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = (field === 'quantity' || field === 'unitPrice' || field === 'taxRate')
      ? Number(value)
      : value;
    setLines(updated);
  };

  const addLine = () => {
    const defaultProd = products[0];
    const defaultPlan = plans[0];
    setLines([
      ...lines,
      {
        id: 'line-' + Date.now(),
        productId: defaultProd?.id || '',
        productName: defaultProd?.name || '',
        planId: defaultPlan?.id || '',
        planName: defaultPlan?.planName || '',
        variantName: defaultProd?.variants?.[0]?.name || 'Standard',
        quantity: 1,
        unitPrice: defaultPlan?.price || defaultProd?.salesPrice || 4500,
        taxRate: 18,
      },
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  const totalTax = lines.reduce((acc, line) => {
    const lineSub = line.quantity * line.unitPrice;
    return acc + (lineSub * (line.taxRate / 100));
  }, 0);
  const grandTotal = Math.max(0, subtotal + totalTax - Number(discountAmount || 0));

  const validityDateObj = new Date();
  validityDateObj.setDate(validityDateObj.getDate() + Number(validityDays));
  const validityDateStr = validityDateObj.toISOString().slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCustomer = customers.find((c) => c.id === customerId);

    const formattedLines = lines.map((l) => ({
      ...l,
      subtotal: l.quantity * l.unitPrice,
      total: Math.round(l.quantity * l.unitPrice * (1 + l.taxRate / 100)),
    }));

    const newQuo = addQuotation({
      customer: selectedCustomer?.company || selectedCustomer?.name || 'Enterprise Client',
      customerId,
      templateName,
      date: new Date().toISOString().slice(0, 10),
      validityDate: validityDateStr,
      status,
      lines: formattedLines,
      subtotal,
      tax: totalTax,
      discount: Number(discountAmount || 0),
      total: grandTotal,
      notes,
    });

    navigate(`/quotations/${newQuo.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/quotations')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={CheckCircle2}
          >
            Save Quotation
          </Button>
        </div>
      </div>

      {/* Main Details Card */}
      <Card title="Quotation Header & Customer Terms" subtitle="Specify client account and validity terms">
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
              Quotation Template
            </label>
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="Standard SaaS Annual Package">Standard SaaS Annual Package</option>
              <option value="Enterprise Multi-Store Agreement">Enterprise Multi-Store Agreement</option>
              <option value="Logistics Multi-Hub Proposal">Logistics Multi-Hub Proposal</option>
              <option value="Custom Enterprise POC">Custom Enterprise POC</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Validity Window
            </label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value={15}>15 Days ({validityDateStr})</option>
              <option value={30}>30 Days ({validityDateStr})</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="Draft">Draft</option>
              <option value="Quotation">Quotation (Issued to Client)</option>
              <option value="Confirmed">Confirmed (Approved by Client)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product & Plan Lines Card */}
      <Card
        title="Quotation Lines & Pricing Configuration"
        subtitle="Add product tiers, quantities, unit prices, and GST rates"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={addLine}
          >
            Add Line Item
          </Button>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 min-w-[200px]">Product</th>
              <th className="py-3 px-4 min-w-[180px]">Plan & Frequency</th>
              <th className="py-3 px-4 min-w-[150px]">Variant Add-on</th>
              <th className="py-3 px-4 w-24">Qty</th>
              <th className="py-3 px-4 w-32">Unit Price (₹)</th>
              <th className="py-3 px-4 w-24">Taxes</th>
              <th className="py-3 px-4 text-right w-32">Subtotal</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => {
              const currentProd = products.find((p) => p.id === line.productId);
              const lineSubtotal = line.quantity * line.unitPrice;

              return (
                <tr key={line.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={line.planId}
                      onChange={(e) => handlePlanChange(idx, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {plans.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.planName} ({pl.billingFrequency})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={line.variantName}
                      onChange={(e) => handleVariantChange(idx, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {currentProd?.variants?.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.priceAdjustment >= 0 ? '+' : ''}₹{v.priceAdjustment})
                        </option>
                      )) || <option value="Standard Edition">Standard Edition</option>}
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-20 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-center font-medium"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      value={line.unitPrice}
                      onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                      className="w-28 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-800"
                    />
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={line.taxRate}
                      onChange={(e) => handleLineChange(idx, 'taxRate', e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value={18}>GST 18%</option>
                      <option value={5}>GST 5%</option>
                      <option value={0}>Zero 0%</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(lineSubtotal)}
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
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Summary and Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Terms & Customer Remarks" className="lg:col-span-2">
          <textarea
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special commercial terms, payment milestones, SLA guarantees..."
            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none text-slate-700"
          />
        </Card>

        {/* Calculations Box */}
        <Card title="Commercial Calculation" bodyClassName="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Applicable Taxes (GST 18%)</span>
            <span className="font-semibold text-slate-900">{formatINR(totalTax)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Commercial Discount (₹)</span>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-24 text-xs px-2 py-1 border border-slate-200 rounded text-right font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Grand Total</span>
            <span className="text-xl font-black text-brand-600">{formatINR(grandTotal)}</span>
          </div>
        </Card>
      </div>
    </form>
  );
};

export default QuotationCreate;

