import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Plus, Trash2, Calendar, CreditCard } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const SubscriptionCreate = () => {
  const navigate = useNavigate();
  const { customers, products, plans, addSubscription } = useData();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const expDateObj = new Date();
  expDateObj.setFullYear(expDateObj.getFullYear() + 1);
  const [expiryDate, setExpiryDate] = useState(expDateObj.toISOString().slice(0, 10));

  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [status, setStatus] = useState('Draft');
  const [autoRenew, setAutoRenew] = useState(true);

  // Line item config
  const initialPlan = plans.find((p) => p.id === planId) || plans[0];
  const initialProd = products.find((p) => p.id === initialPlan?.productId) || products[0];

  const [lines, setLines] = useState([
    {
      id: 'sub-l-' + Date.now(),
      productId: initialProd?.id || '',
      productName: initialProd?.name || 'Brightloop Service',
      variantName: initialProd?.variants?.[0]?.name || 'Standard Edition',
      quantity: 1,
      unitPrice: initialPlan?.price || 4500,
      taxRate: 18,
    },
  ]);

  const handlePlanChange = (newPlanId) => {
    setPlanId(newPlanId);
    const selPlan = plans.find((p) => p.id === newPlanId);
    if (selPlan) {
      const selProd = products.find((p) => p.id === selPlan.productId) || products[0];
      const initialVariant = selProd?.variants?.[0];
      const adjustment = Number(initialVariant?.priceAdjustment || 0);
      setLines([
        {
          id: 'sub-l-' + Date.now(),
          productId: selProd?.id || '',
          productName: selProd?.name || '',
          variantName: initialVariant?.name || 'Standard Edition',
          quantity: 1,
          unitPrice: selPlan.price + adjustment,
          taxRate: 18,
        },
      ]);
    }
  };

  const handleVariantChange = (index, variantName) => {
    const line = lines[index];
    const currentProd = products.find((p) => p.id === line.productId);
    const selPlan = plans.find((p) => p.id === planId);
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

  const subtotal = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const taxes = lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice * (l.taxRate / 100)), 0);
  const totalAmount = Math.round(subtotal + taxes);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selCust = customers.find((c) => c.id === customerId);
    const selPlan = plans.find((p) => p.id === planId);
    const selProd = products.find((p) => p.id === selPlan?.productId) || products[0];

    const formattedLines = lines.map((l) => ({
      ...l,
      subtotal: l.quantity * l.unitPrice,
      total: Math.round(l.quantity * l.unitPrice * (1 + l.taxRate / 100)),
    }));

    const newSub = addSubscription({
      customer: selCust?.company || selCust?.name || 'Enterprise Customer',
      customerId,
      customerEmail: selCust?.email || 'client@enterprise.com',
      plan: selPlan?.planName || 'Enterprise Plan',
      planId,
      product: selProd?.name || 'Brightloop Engine',
      productId: selProd?.id || 'prod-1',
      billingFrequency: selPlan?.billingFrequency || 'Monthly',
      startDate,
      expiryDate,
      paymentTerms,
      quantity: lines[0]?.quantity || 1,
      unitPrice: lines[0]?.unitPrice || 4500,
      taxes: 18,
      totalAmount,
      status,
      nextBillingDate: startDate,
      autoRenew,
      productLines: formattedLines,
    });

    navigate(`/subscriptions/${newSub.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subscriptions</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/subscriptions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={CheckCircle2}
          >
            Create Subscription
          </Button>
        </div>
      </div>

      {/* Main Details Card */}
      <Card title="Subscription Setup & Terms" subtitle="Specify client, cadence, and recurring terms">
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
              Select Plan *
            </label>
            <select
              required
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.planName} ({p.billingFrequency} - {formatINR(p.price)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Terms
            </label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
            >
              <option value="Immediate">Immediate Settlement</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 60">Net 60 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Lifecycle Stage
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
            >
              <option value="Draft">Draft</option>
              <option value="Quotation">Quotation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Active">Active (Live recurring)</option>
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span>Enable Automatic Contract Renewal</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Product Lines Configuration */}
      <Card
        title="Contracted Product Lines"
        subtitle="Seats, unit price, and variant add-on pricing"
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 min-w-[200px]">Product</th>
              <th className="py-3 px-4 min-w-[160px]">Variant Add-on</th>
              <th className="py-3 px-4 w-28 text-center">Seats / Qty</th>
              <th className="py-3 px-4 w-36">Unit Price (₹)</th>
              <th className="py-3 px-4 w-28 text-center">Taxes</th>
              <th className="py-3 px-4 text-right w-36">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => {
              const currentProd = products.find((p) => p.id === line.productId);
              const lineTotal = line.quantity * line.unitPrice * (1 + line.taxRate / 100);

              return (
                <tr key={line.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {line.productName}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={line.variantName}
                      onChange={(e) => handleVariantChange(idx, e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      {currentProd?.variants?.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.priceAdjustment >= 0 ? '+' : ''}₹{v.priceAdjustment})
                        </option>
                      )) || <option value="Standard Edition">Standard Edition</option>}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-20 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-center font-semibold"
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
                  <td className="py-3 px-4 text-center text-slate-600">
                    GST 18%
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(Math.round(lineTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Calculation Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Calculated subtotal ({formatINR(subtotal)}) + GST 18% ({formatINR(taxes)})
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-black text-brand-600">{formatINR(totalAmount)}</span>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default SubscriptionCreate;

