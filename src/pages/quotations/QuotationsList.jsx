import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileCheck2, Eye, ArrowRight, Repeat } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

export const QuotationsList = () => {
  const navigate = useNavigate();
  const { quotations, convertQuotationToSubscription } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filtered = quotations.filter((q) => {
    const matchesQuery =
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.templateName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sales proposals, custom pricing lines, and subscription conversion workflows.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => navigate('/quotations/new')}
        >
          New Quotation
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotation reference, customer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Quotation">Quotation Sent</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No quotations found"
            description="Draft a proposal with custom quantities, taxes, and validity terms."
            actionLabel="Create Quotation"
            onAction={() => navigate('/quotations/new')}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Template / Scope</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Validity Date</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((quo) => (
                <tr
                  key={quo.id}
                  onClick={() => navigate(`/quotations/${quo.id}`)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-brand-600">
                    {quo.id}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {quo.customer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {quo.templateName || 'Standard Package'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(quo.date)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(quo.validityDate)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatINR(quo.total)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={quo.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {quo.status === 'Confirmed' ? (
                        <button
                          onClick={() => {
                            const newSub = convertQuotationToSubscription(quo.id);
                            if (newSub) navigate(`/subscriptions/${newSub.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
                          title="Convert to Active Subscription"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Convert to Sub</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/quotations/${quo.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default QuotationsList;

