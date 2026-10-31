import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  LayoutGrid,
  Repeat,
  Receipt,
  CreditCard,
  User,
  ArrowLeft,
  LogOut,
  ChevronDown,
  Network,
  LifeBuoy,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth, ROLES } from '../../context/AuthContext';

export const PortalLayout = () => {
  const { customers, portalCustomerId, setPortalCustomerId, portalCustomer } = useData();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const portalNav = [
    { name: 'Overview', path: '/portal/dashboard', icon: LayoutGrid },
    { name: 'My Subscriptions', path: '/portal/subscriptions', icon: Repeat },
    { name: 'My Invoices', path: '/portal/invoices', icon: Receipt },
    { name: 'Payment History', path: '/portal/payments', icon: CreditCard },
    { name: 'Portability', path: '/portal/portability', icon: Network },
    { name: 'Lifeboat Relief', path: '/portal/lifeboat', icon: LifeBuoy },
    { name: 'SLA Contracts', path: '/portal/contracts', icon: ShieldAlert },
    { name: 'Outcome Exchange', path: '/portal/exchange', icon: ShoppingBag },
    { name: 'My Profile', path: '/portal/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Brightloop Customer Self-Service Experience</span>
          <span className="hidden sm:inline text-slate-400">
            — Logged in as {user?.name || portalCustomer?.name || 'Client'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Admin Demo Customer Switcher (Shown ONLY to Admin inspecting portal) */}
          {user?.role === ROLES.ADMIN && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden md:inline">Viewing as:</span>
              <select
                value={portalCustomerId}
                onChange={(e) => setPortalCustomerId(e.target.value)}
                className="bg-slate-800 text-xs text-white rounded px-2 py-1 border border-slate-700 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
          )}

          {user?.role === ROLES.ADMIN ? (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-1.5 text-xs text-brand-300 hover:text-white transition-colors bg-brand-900/60 hover:bg-brand-800/80 px-2.5 py-1 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Console</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition-colors bg-rose-950/60 hover:bg-rose-900/80 px-2.5 py-1 rounded"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Portal Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-none">
                  Brightloop <span className="text-xs font-normal text-slate-500">Customer Portal</span>
                </h1>
                <p className="text-[11px] text-brand-600 font-medium mt-0.5">{portalCustomer?.company}</p>
              </div>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">{portalCustomer?.name}</p>
                <p className="text-[10px] text-slate-400">{portalCustomer?.email}</p>
              </div>
              <img
                src={portalCustomer?.avatar}
                alt={portalCustomer?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 -mb-px">
            {portalNav.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        Brightloop Self-Service Subscription Experience &bull; Fast, transparent billing powered by Brightloop Cloud
      </footer>
    </div>
  );
};

export default PortalLayout;

