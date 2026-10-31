import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  FileCheck2,
  Repeat,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StaffSidebar = ({ isCollapsed, toggleCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Staff navigation contains ONLY the allowed modules
  const staffNavItems = [
    { name: 'Overview', path: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/staff/customers', icon: Users2 },
    { name: 'Quotations', path: '/staff/quotations', icon: FileCheck2 },
    { name: 'Subscriptions', path: '/staff/subscriptions', icon: Repeat },
    { name: 'Invoices', path: '/staff/invoices', icon: Receipt },
    { name: 'Payments', path: '/staff/payments', icon: CreditCard },
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
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Staff Workspace
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

      {/* Staff Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {staffNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

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
      </div>

      {/* Staff Profile at Bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-3 p-1.5 rounded-lg">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || 'Staff Member'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                  STAFF
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.company || 'Operations'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default StaffSidebar;

