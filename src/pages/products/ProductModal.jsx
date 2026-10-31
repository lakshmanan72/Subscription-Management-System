import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

export const ProductModal = ({ isOpen, onClose, onSave, productToEdit = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Service',
    salesPrice: 4500,
    costPrice: 1200,
    status: 'Active',
    description: '',
    variants: [{ id: 'var-1', name: 'Standard Edition', priceAdjustment: 0, sku: 'STD' }],
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        code: productToEdit.code || '',
        type: productToEdit.type || 'Service',
        salesPrice: productToEdit.salesPrice || 0,
        costPrice: productToEdit.costPrice || 0,
        status: productToEdit.status || 'Active',
        description: productToEdit.description || '',
        variants: productToEdit.variants?.length
          ? [...productToEdit.variants]
          : [{ id: 'var-1', name: 'Standard Edition', priceAdjustment: 0, sku: 'STD' }],
      });
    } else {
      setFormData({
        name: '',
        code: `BL-${Math.floor(100 + Math.random() * 900)}`,
        type: 'Service',
        salesPrice: 5000,
        costPrice: 1500,
        status: 'Active',
        description: '',
        variants: [
          { id: 'var-1', name: 'Standard Edition', priceAdjustment: 0, sku: 'STD' },
          { id: 'var-2', name: 'Odoo Enterprise Connector', priceAdjustment: 560, sku: 'ODOO-SYNC' },
        ],
      });
    }
  }, [productToEdit, isOpen]);

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = field === 'priceAdjustment' ? Number(value) : value;
    setFormData({ ...formData, variants: updated });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          id: 'var-' + Date.now(),
          name: '',
          priceAdjustment: 0,
          sku: 'SKU-' + (formData.variants.length + 1),
        },
      ],
    });
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) return;
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, idx) => idx !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Edit Product: ${productToEdit.name}` : 'Add New Enterprise Product'}
      subtitle="Define pricing, margins, stock tracking, and pricing variants"
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {productToEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Brightloop CRM Core"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="BL-PROD-01"
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Service">Service</option>
              <option value="Consumable">Consumable</option>
              <option value="Storable">Storable Product</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Base Sales Price (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.salesPrice}
              onChange={(e) => setFormData({ ...formData, salesPrice: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cost Price (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description & Notes
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key capabilities, SLA inclusions, license terms..."
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Product Variants & Price Adjustments */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-600" />
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Product Variants & Dynamic Adjustments
              </label>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mb-2">
            Price adjustment adds to or discounts the base price (e.g., Odoo Brand connector adds +₹560).
          </p>

          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {formData.variants.map((v, idx) => (
              <div key={v.id || idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Variant name (e.g. Odoo Standard Brand)"
                  value={v.name}
                  onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-1 focus:ring-brand-500"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] text-slate-400">+/- ₹</span>
                  <input
                    type="number"
                    placeholder="Adj"
                    value={v.priceAdjustment}
                    onChange={(e) => handleVariantChange(idx, 'priceAdjustment', e.target.value)}
                    className="w-20 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none font-semibold text-slate-800"
                  />
                </div>
                <input
                  type="text"
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                  className="w-24 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  disabled={formData.variants.length <= 1}
                  className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;

