import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useData } from '../../context/DataContext';

export const PlanModal = ({ isOpen, onClose, onSave, planToEdit = null }) => {
  const { products } = useData();

  const [formData, setFormData] = useState({
    planName: '',
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    billingFrequency: 'Monthly',
    price: 4500,
    minQuantity: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2025-12-31',
    autoClose: false,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    status: 'Active',
    description: '',
  });

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        planName: planToEdit.planName || '',
        productId: planToEdit.productId || products[0]?.id || '',
        productName: planToEdit.productName || '',
        billingFrequency: planToEdit.billingFrequency || 'Monthly',
        price: planToEdit.price || 0,
        minQuantity: planToEdit.minQuantity || 1,
        startDate: planToEdit.startDate || '',
        endDate: planToEdit.endDate || '',
        autoClose: !!planToEdit.autoClose,
        allowEarlyClosure: planToEdit.allowEarlyClosure ?? true,
        allowPause: planToEdit.allowPause ?? true,
        allowRenewal: planToEdit.allowRenewal ?? true,
        status: planToEdit.status || 'Active',
        description: planToEdit.description || '',
      });
    } else {
      setFormData({
        planName: '',
        productId: products[0]?.id || '',
        productName: products[0]?.name || '',
        billingFrequency: 'Monthly',
        price: 4500,
        minQuantity: 1,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '2025-12-31',
        autoClose: false,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        status: 'Active',
        description: '',
      });
    }
  }, [planToEdit, isOpen, products]);

  const handleProductChange = (prodId) => {
    const sel = products.find((p) => p.id === prodId);
    setFormData({
      ...formData,
      productId: prodId,
      productName: sel ? sel.name : '',
      price: sel ? sel.salesPrice : formData.price,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.planName) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={planToEdit ? `Edit Plan: ${planToEdit.planName}` : 'Create Subscription Plan'}
      subtitle="Configure billing cadence, pricing rules, and lifecycle permissions"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {planToEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              placeholder="e.g. Enterprise Monthly Scale"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Associated Product *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Billing Frequency
            </label>
            <select
              value={formData.billingFrequency}
              onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Recurring Price (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Min Quantity
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
              Availability Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Availability End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Target audience, user tiers, quota limits..."
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Lifecycle Permissions Checkboxes */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Subscription Lifecycle Permissions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span>Allow Customer to Pause</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.allowEarlyClosure}
                onChange={(e) => setFormData({ ...formData, allowEarlyClosure: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span>Allow Early Closure</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.allowRenewal}
                onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span>Allow Auto / Manual Renewal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formData.autoClose}
                onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span>Auto-Close on Expiry Date</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default PlanModal;

