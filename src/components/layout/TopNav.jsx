import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  RotateCcw,
  LogOut,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import NotificationsDropdown from './NotificationsDropdown';
import GlobalSearchModal from './GlobalSearchModal';

export const TopNav = ({ toggleMobileSidebar, isStaff = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchUserType } = useAuth();
  const { resetAllData } = useData();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isStaffUser = isStaff || user?.role === ROLES.STAFF || location.pathname.startsWith('/staff');

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs from pathname
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbLabels = {
    dashboard: 'Dashboard',
    products: 'Products',
    plans: 'Plans',
    quotations: 'Quotations',
    subscriptions: 'Subscriptions',
    invoices: 'Invoices',
    payments: 'Payments',
    discounts: 'Discounts',
    customers: 'Customers',
    reports: 'Reports',
    settings: 'Settings',
    portal: 'Customer Portal',
    staff: 'Staff',
    admin: 'Admin Console',
  };

  const homeRoute = isStaffUser ? '/staff/dashboard' : '/admin/dashboard';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        {/* Left Side: Mobile toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Bar */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-hidden">
            <Link to={homeRoute} className="hover:text-brand-600 transition-colors shrink-0 font-semibold text-slate-700">
              Brightloop
            </Link>
            {pathnames.map((segment, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const label = breadcrumbLabels[segment.toLowerCase()] || segment;

              return (
                <React.Fragment key={routeTo}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  {isLast ? (
                    <span className="text-slate-900 font-semibold truncate capitalize">
                      {label}
                    </span>
                  ) : (
                    <Link
                      to={routeTo}
                      className="hover:text-brand-600 transition-colors truncate capitalize"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Global Search, Quick Switch, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search records...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono font-medium text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Customer Portal Shortcut Pill - shown ONLY for Admin */}
          {!isStaffUser && (
            <Link
              to="/portal"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100/70 text-xs font-medium transition-colors"
            >
              <span>Customer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
              <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-modal border border-slate-200 z-50 py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user?.role === ROLES.STAFF
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : user?.role === ROLES.CUSTOMER
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-brand-50 text-brand-700 border-brand-200'
                  }`}>
                    {user?.role || 'ADMIN'}
                  </span>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Fast Persona Switch
                  </div>
                  <button
                    onClick={() => {
                      switchUserType('admin');
                      setIsProfileOpen(false);
                      navigate('/dashboard');
                    }}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2.5 ${
                      user?.role === ROLES.ADMIN ? 'font-bold text-brand-700 bg-brand-50/50' : 'text-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-brand-600" />
                    <span>Admin View (Priyanka Sen)</span>
                  </button>
                  <button
                    onClick={() => {
                      switchUserType('staff');
                      setIsProfileOpen(false);
                      navigate('/staff/dashboard');
                    }}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2.5 ${
                      user?.role === ROLES.STAFF ? 'font-bold text-indigo-700 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Staff Member (Rohan Deshmukh)</span>
                  </button>
                  <button
                    onClick={() => {
                      switchUserType('customer');
                      setIsProfileOpen(false);
                      navigate('/portal/dashboard');
                    }}
                    className={`w-full px-4 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2.5 ${
                      user?.role === ROLES.CUSTOMER ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Client Portal (Aditi Rao)</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      resetAllData();
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>Reset Demo Data</span>
                  </button>
                  {!isStaffUser && (
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 block"
                    >
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>System Settings</span>
                    </Link>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                      navigate('/auth/login');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default TopNav;
