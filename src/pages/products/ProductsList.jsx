import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, ArrowUpDown } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductModal from './ProductModal';

export const ProductsList = () => {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filter products
  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveProduct = (prodData) => {
    if (productToEdit) {
      updateProduct(productToEdit.id, prodData);
    } else {
      addProduct(prodData);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage billable software tiers, storable hardware modules, and variant configurations.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setProductToEdit(null);
            setIsModalOpen(true);
          }}
        >
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product name, internal SKU code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Service">Service</option>
              <option value="Consumable">Consumable</option>
              <option value="Storable">Storable</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No matching products found"
            description="Try modifying search criteria or create a new product catalog item."
            actionLabel="Add Product"
            onAction={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Product Name & Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Sales Price</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Variants</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((product) => {
                const margin = product.salesPrice - (product.costPrice || 0);
                const marginPct = product.salesPrice ? Math.round((margin / product.salesPrice) * 100) : 0;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {product.name}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {product.code || 'BL-PROD'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {product.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatINR(product.salesPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{formatINR(product.costPrice)}</div>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {marginPct}% margin
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">
                          {product.variants?.length || 1}
                        </span>
                        <span className="text-[11px] text-slate-400">variant(s)</span>
                      </div>
                      {product.variants?.[1] && (
                        <div className="text-[10px] text-brand-600 truncate max-w-[150px]">
                          + {product.variants[1].name} ({product.variants[1].priceAdjustment >= 0 ? '+' : ''}₹{product.variants[1].priceAdjustment})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={product.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToEdit(product);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? Subscriptions using this product will retain snapshot history."
      />
    </div>
  );
};

export default ProductsList;

