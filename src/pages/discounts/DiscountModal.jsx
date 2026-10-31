import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useData } from '../../context/DataContext';

export const DiscountModal = ({ isOpen, onClose, onSave, discountToEdit = null }) => {
  const { products } = useData();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 15,
    minPurchase: 5000,
    minQuantity: 1,
    applicableProducts: 'all',
    applicableSubscriptions: 'all',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2025-12-31',
    usageLimit: 100,
    status: 'Active',
    description: '',
  });

  useEffect(() => {
    if (discountToEdit) {
      setFormData({
        name: discountToEdit.name || '',
        code: discountToEdit.code || '',
        type: discountToEdit.type || 'percentage',
        value: discountToEdit.value || 0,
        minPurchase: discountToEdit.minPurchase || 0,
        minQuantity: discountToEdit.minQuantity || 1,
        applicableProducts: discountToEdit.applicableProducts || 'all',
        applicableSubscriptions: discountToEdit.applicableSubscriptions || 'all',
        startDate: discountToEdit.startDate || '',
        endDate: discountToEdit.endDate || '',
        usageLimit: discountToEdit.usageLimit || 100,
        status: discountToEdit.status || 'Active',
        description: discountToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        code: 'PROMO' + Math.floor(100 + Math.random() * 900),
        type: 'percentage',
        value: 15,
        minPurchase: 5000,
        minQuantity: 1,
        applicableProducts: 'all',
        applicableSubscriptions: 'all',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '2025-12-31',
        usageLimit: 100,
        status: 'Active',
        description: '',
      });
    }
  }, [discountToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={discountToEdit ? `Edit Discount: ${discountToEdit.name}` : 'Create Discount Coupon / Rule'}
      subtitle="Define percentage concessions or flat rupee allowances"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {discountToEdit ? 'Save Changes' : 'Create Discount'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discount Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Diwali Enterprise Concession"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="FESTIVE2024"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discount Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Rupee (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discount Value {formData.type === 'percentage' ? '(%)' : '(₹)'} *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usage Limit (Count)
            </label>
            <input
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Min Purchase Requirement (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.minPurchase}
              onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Min Order Quantity (Seats)
            </label>
            <input
              type="number"
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Valid From
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Campaign Scope & Description
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Commercial justification, partner concessions..."
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default DiscountModal;

