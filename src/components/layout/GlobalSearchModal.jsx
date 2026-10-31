import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Layers, FileText, Users, CreditCard, ChevronRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth, ROLES } from '../../context/AuthContext';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { products, subscriptions, invoices, customers } = useData();
  const { user } = useAuth();

  const isStaff = user?.role === ROLES.STAFF;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredSubs = subscriptions
    .filter(s => s.subscriptionNumber.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q))
    .slice(0, 3);

  const filteredInvoices = invoices
    .filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q))
    .slice(0, 3);

  // Staff cannot access products
  const filteredProducts = isStaff
    ? []
    : products
        .filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
        .slice(0, 3);

  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    .slice(0, 3);

  const hasResults = filteredSubs.length > 0 || filteredInvoices.length > 0 || filteredProducts.length > 0 || filteredCustomers.length > 0;

  const handleSelect = (url) => {
    navigate(url);
    onClose();
  };

  const getTargetUrl = (type, id) => {
    const prefix = isStaff ? '/staff' : '';
    if (type === 'sub') return `${prefix}/subscriptions/${id}`;
    if (type === 'inv') return `${prefix}/invoices/${id}`;
    if (type === 'cust') return `${prefix}/customers/${id}`;
    if (type === 'prod') return `/products/${id}`;
    return '/';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center pt-16 sm:pt-24 p-4">
        <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-modal border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-100">
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search subscriptions, invoices, customers... (Esc to close)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {!hasResults && query && (
              <p className="text-center text-sm text-slate-500 py-8">
                No matching results found for "{query}".
              </p>
            )}

            {filteredSubs.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Subscriptions
                </div>
                {filteredSubs.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(getTargetUrl('sub', s.id))}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-sm transition-colors group"
                  >
                    <div>
                      <span className="font-semibold text-brand-600">{s.subscriptionNumber}</span>
                      <span className="text-slate-500 ml-2">— {s.customer}</span>
                      <div className="text-xs text-slate-400">{s.plan}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            )}

            {filteredInvoices.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Invoices
                </div>
                {filteredInvoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelect(getTargetUrl('inv', inv.id))}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-sm transition-colors group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{inv.invoiceNumber}</span>
                      <span className="text-slate-500 ml-2">— {inv.customer}</span>
                      <div className="text-xs text-slate-400">Total: ₹{inv.total?.toLocaleString('en-IN')}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            )}

            {filteredCustomers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Customers
                </div>
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(getTargetUrl('cust', c.id))}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-sm transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-slate-400 text-xs ml-2">({c.company})</span>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            )}

            {!isStaff && filteredProducts.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Products
                </div>
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(getTargetUrl('prod', p.id))}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-sm transition-colors group"
                  >
                    <div>
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({p.code})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">Ctrl+K</kbd> anywhere</span>
            <span>Brightloop Quick Command</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
