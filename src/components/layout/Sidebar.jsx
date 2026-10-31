import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileCheck2,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Users2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Network,
  LifeBuoy,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isCollapsed, toggleCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Plans', path: '/plans', icon: Layers },
    { name: 'Quotations', path: '/quotations', icon: FileCheck2 },
    { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Discounts', path: '/discounts', icon: Percent },
    { name: 'Customers', path: '/customers', icon: Users2 },
    { name: 'Continuity Net', path: '/continuity', icon: Network },
    { name: 'Lifeboat Relief', path: '/lifeboat', icon: LifeBuoy },
    { name: 'Outcome Contracts', path: '/contracts', icon: ShieldAlert },
    { name: 'Outcome Exchange', path: '/exchange', icon: ShoppingBag },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-slate-200/90 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
                Bright<span className="text-brand-600">loop</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-1">
                Subscription Cloud
              </span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden md:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />
              )}
            </NavLink>
          );
        })}

        {/* Customer Portal Shortcut */}
        <div className="pt-4 mt-2 border-t border-slate-100">
          <NavLink
            to="/portal"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-brand-600 hover:bg-brand-50/50 transition-colors group ${
              location.pathname.startsWith('/portal') ? 'bg-brand-50 text-brand-700 font-semibold' : ''
            }`}
            title="Customer Self-Service Portal"
          >
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-600 shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Customer Portal</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700 font-semibold">
                  Demo
                </span>
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* User Profile at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-700">
                {user?.name || 'Priyanka Sen'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.role || 'Super Admin'}
              </span>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

