import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package, Layers, Repeat, CheckCircle, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductModal from './ProductModal';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, plans, subscriptions, updateProduct, deleteProduct } = useData();

  const product = products.find((p) => p.id === id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!product) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested product does not exist or has been removed.</p>
        <Button variant="secondary" onClick={() => navigate('/products')}>
          Back to Product Catalog
        </Button>
      </div>
    );
  }

  const associatedPlans = plans.filter((pl) => pl.productId === product.id);
  const associatedSubs = subscriptions.filter((s) => s.productId === product.id);

  const margin = product.salesPrice - (product.costPrice || 0);
  const marginPct = product.salesPrice ? Math.round((margin / product.salesPrice) * 100) : 0;

  const handleUpdate = (updatedData) => {
    updateProduct(product.id, updatedData);
  };

  const handleDelete = () => {
    deleteProduct(product.id);
    navigate('/products');
  };

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Product
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card bodyClassName="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
                <Badge status={product.status} />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                SKU / Code: {product.code || 'BL-PROD'} &bull; Type: {product.type}
              </p>
              <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                {product.description || 'No detailed description provided.'}
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Base Sales Price
              </span>
              <div className="text-2xl font-black text-slate-900">
                {formatINR(product.salesPrice)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 mt-1">
              Cost: {formatINR(product.costPrice)} &bull;{' '}
              <span className="text-emerald-600 font-semibold">{marginPct}% Margin</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Variants & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variants Breakdown */}
        <Card
          title="Product Variants & Pricing Overrides"
          subtitle="Specific configurations and brand add-ons"
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Variant Name</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Price Adjustment</th>
                <th className="py-2.5 px-4 text-right">Effective Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {product.variants?.map((v, idx) => {
                const effective = product.salesPrice + (Number(v.priceAdjustment) || 0);
                return (
                  <tr key={v.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{v.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {v.sku || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {v.priceAdjustment > 0 ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{formatINR(v.priceAdjustment)}
                        </span>
                      ) : v.priceAdjustment < 0 ? (
                        <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {formatINR(v.priceAdjustment)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0 (Base)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(effective)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Associated Subscription Plans */}
        <Card
          title="Subscription Plans Offering This Product"
          subtitle="Recurring billing frequency packages"
          actions={
            <Link
              to="/plans"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Manage Plans
            </Link>
          }
          bodyClassName="p-4 space-y-3"
        >
          {associatedPlans.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No subscription plans currently linked to this product.
            </p>
          ) : (
            associatedPlans.map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate(`/plans`)}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{pl.planName}</span>
                    <Badge status={pl.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Frequency: <span className="font-medium text-slate-700">{pl.billingFrequency}</span> &bull; Min Qty: {pl.minQuantity}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{formatINR(pl.price)}</span>
                  <p className="text-[10px] text-slate-400">per {pl.billingFrequency.toLowerCase()}</p>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
        productToEdit={product}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Deleting this product will remove it from future quotation selectors. Active subscriptions will remain unaffected."
      />
    </div>
  );
};

export default ProductDetail;

