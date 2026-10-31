import React, { useState } from 'react';
import { Plus, Search, Percent, Edit, Power, Calculator, Tag, Calendar, CheckCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import DiscountModal from './DiscountModal';

export const DiscountsList = () => {
  const { discounts, addDiscount, updateDiscount, toggleDiscountStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState(null);

  // Interactive Live Discount Calculator Playground
  const [calcOrderAmount, setCalcOrderAmount] = useState(25000);
  const [selectedCouponCode, setSelectedCouponCode] = useState(discounts[0]?.code || 'FESTIVE2024');

  const filtered = discounts.filter((d) => {
    const matchesQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  const handleSave = (discData) => {
    if (discountToEdit) {
      updateDiscount(discountToEdit.id, discData);
    } else {
      addDiscount(discData);
    }
  };

  // Live calculator calculation
  const activeCoupon = discounts.find((d) => d.code === selectedCouponCode);
  let simulatedSavings = 0;
  let eligibilityNote = '';

  if (activeCoupon) {
    if (calcOrderAmount < (activeCoupon.minPurchase || 0)) {
      eligibilityNote = `Order amount is below minimum purchase threshold of ${formatINR(activeCoupon.minPurchase)}.`;
    } else {
      if (activeCoupon.type === 'percentage') {
        simulatedSavings = Math.round((calcOrderAmount * activeCoupon.value) / 100);
      } else {
        simulatedSavings = Math.min(calcOrderAmount, activeCoupon.value);
      }
    }
  }

  const finalSimulatedTotal = Math.max(0, calcOrderAmount - simulatedSavings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discount & Promotional Rules</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure promotional percentage vouchers, migration concessions, and volume rebates.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setDiscountToEdit(null);
            setIsModalOpen(true);
          }}
        >
          Create Discount
        </Button>
      </div>

      {/* Live Calculator Playground Card */}
      <Card
        title="Interactive Discount Calculator"
        subtitle="Simulate real-time concession calculations against contract order values"
        className="bg-gradient-to-r from-brand-50/50 via-white to-indigo-50/30 border-brand-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Simulated Contract Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={calcOrderAmount}
              onChange={(e) => setCalcOrderAmount(Number(e.target.value))}
              className="w-full text-sm font-bold text-slate-900 px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Test Coupon Code
            </label>
            <select
              value={selectedCouponCode}
              onChange={(e) => setSelectedCouponCode(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-brand-700 outline-none"
            >
              {discounts.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code} — {d.name} ({d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Saves</span>
              <span className="text-lg font-black text-emerald-600">{formatINR(simulatedSavings)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Effective Net Total</span>
              <span className="text-lg font-black text-slate-900">{formatINR(finalSimulatedTotal)}</span>
            </div>
          </div>
        </div>

        {eligibilityNote && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            ⚠️ {eligibilityNote}
          </p>
        )}
      </Card>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon name, promo code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Discount Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Rupee (₹)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No promotional discounts found"
            description="Create a discount coupon code to incentivize renewals or migrations."
            actionLabel="Create Discount"
            onAction={() => {
              setDiscountToEdit(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Coupon Code & Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Benefit</th>
                <th className="py-3 px-4">Min Spend</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Usage Pace</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((disc) => {
                const isActive = disc.status === 'Active';

                return (
                  <tr key={disc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-xs">
                          {disc.code}
                        </span>
                        <span className="font-semibold text-slate-900">{disc.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{disc.description}</p>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-700">
                      {disc.type}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {disc.type === 'percentage' ? `${disc.value}% off` : formatINR(disc.value)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatINR(disc.minPurchase || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {formatDate(disc.startDate)} &rarr; {formatDate(disc.endDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {disc.usageCount || 0} / {disc.usageLimit || '∞'}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((disc.usageCount || 0) / (disc.usageLimit || 100)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleDiscountStatus(disc.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setDiscountToEdit(disc);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit discount"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDiscountToEdit(null);
        }}
        onSave={handleSave}
        discountToEdit={discountToEdit}
      />
    </div>
  );
};

export default DiscountsList;

