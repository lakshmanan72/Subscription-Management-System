import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Eye, Mail, Phone, Building, ArrowUpRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatINR, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

export const CustomersList = () => {
  const navigate = useNavigate();
  const { customers, subscriptions, invoices, addCustomer } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    city: 'Bengaluru, Karnataka',
  });

  const filtered = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustForm.name || !newCustForm.email) return;
    addCustomer(newCustForm);
    setIsAddModalOpen(false);
    setNewCustForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      gstin: '',
      address: '',
      city: 'Bengaluru, Karnataka',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers & Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise clients, billing contacts, active contract portfolios, and receivables.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <Card bodyClassName="p-3 sm:p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, corporate company, email, or contact phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
          />
        </div>
      </Card>

      {/* Table Card */}
      <Card bodyClassName="p-0 overflow-x-auto">
        {paginated.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Register a new customer account or adjust your search filter."
            actionLabel="Add Customer"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-center">Active Subs</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((cust) => {
                const custSubs = subscriptions.filter((s) => s.customerId === cust.id);
                const activeCount = custSubs.filter((s) => s.status === 'Active').length;
                const custInvs = invoices.filter((i) => i.customerId === cust.id);
                const computedOutstanding = custInvs.reduce((acc, inv) => acc + (inv.outstandingAmount || 0), 0);

                return (
                  <tr
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={cust.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}`}
                          alt={cust.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {cust.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{cust.company}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{cust.email}</div>
                      <span className="text-slate-400">{cust.phone || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(cust.registrationDate)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        {activeCount || cust.activeSubscriptionsCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {custInvs.length || cust.totalInvoicesCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {computedOutstanding > 0 ? (
                        <span className="text-rose-600">{formatINR(computedOutstanding)}</span>
                      ) : (
                        <span className="text-emerald-700">₹0 (Cleared)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/customers/${cust.id}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        title="View client account"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-modal border border-slate-200 max-w-lg w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Register New Customer</h3>
              <form onSubmit={handleCreateCustomer} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustForm.name}
                    onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                    placeholder="e.g. Varun Reddy"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newCustForm.company}
                    onChange={(e) => setNewCustForm({ ...newCustForm, company: e.target.value })}
                    placeholder="e.g. Reddy Cloud Systems LLP"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newCustForm.email}
                      onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                      placeholder="varun@reddycloud.in"
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={newCustForm.phone}
                      onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                      placeholder="+91 98888 77777"
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GSTIN Tax ID
                  </label>
                  <input
                    type="text"
                    value={newCustForm.gstin}
                    onChange={(e) => setNewCustForm({ ...newCustForm, gstin: e.target.value })}
                    placeholder="29AABCR1234F1Z3"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Customer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;

