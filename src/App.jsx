import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth, ROLES } from './context/AuthContext';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import StaffDashboardLayout from './components/layout/StaffDashboardLayout';
import PortalLayout from './components/layout/PortalLayout';

// Protection
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin & Staff Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import StaffDashboard from './pages/staff/StaffDashboard';

// Shared Entity Pages
import ProductsList from './pages/products/ProductsList';
import ProductDetail from './pages/products/ProductDetail';
import PlansList from './pages/plans/PlansList';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationCreate from './pages/quotations/QuotationCreate';
import QuotationDetail from './pages/quotations/QuotationDetail';
import SubscriptionsList from './pages/subscriptions/SubscriptionsList';
import SubscriptionCreate from './pages/subscriptions/SubscriptionCreate';
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail';
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceCreate from './pages/invoices/InvoiceCreate';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import PaymentsList from './pages/payments/PaymentsList';
import DiscountsList from './pages/discounts/DiscountsList';
import CustomersList from './pages/customers/CustomersList';
import CustomerDetail from './pages/customers/CustomerDetail';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

// Portal Pages
import PortalOverview from './pages/portal/PortalOverview';
import PortalSubscriptions from './pages/portal/PortalSubscriptions';
import PortalInvoices from './pages/portal/PortalInvoices';
import PortalPayments from './pages/portal/PortalPayments';
import PortalProfile from './pages/portal/PortalProfile';

const NotFound = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-black text-2xl mb-4">
      404
    </div>
    <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mb-6">
      The requested route does not exist in the Brightloop workspace.
    </p>
    <Link
      to="/"
      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors"
    >
      Return to Home
    </Link>
  </div>
);

// Automatic root redirector based on authenticated user's role
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  const role = (user?.role || '').toUpperCase();
  if (role === ROLES.STAFF) return <Navigate to="/staff/dashboard" replace />;
  if (role === ROLES.CUSTOMER) return <Navigate to="/portal/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '12px',
            borderRadius: '10px',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Root Redirector */}
        <Route path="/" element={<RootRedirect />} />

        {/* ADMIN DASHBOARD ROUTES - Restricted to ADMIN */}
        <Route
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <DashboardLayout />
            </RoleProtectedRoute>
          }
        >
          <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Admin Catalog & Plans */}
          <Route path="products" element={<ProductsList />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="plans" element={<PlansList />} />

          {/* Quotations */}
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="quotations/new" element={<QuotationCreate />} />
          <Route path="quotations/:id" element={<QuotationDetail />} />

          {/* Subscriptions */}
          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="subscriptions/new" element={<SubscriptionCreate />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetail />} />

          {/* Invoices */}
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/new" element={<InvoiceCreate />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />

          {/* Payments */}
          <Route path="payments" element={<PaymentsList />} />

          {/* Discounts */}
          <Route path="discounts" element={<DiscountsList />} />

          {/* Customers */}
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />

          {/* Reports & Settings (Admin Only) */}
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* STAFF DASHBOARD ROUTES - Restricted to STAFF */}
        <Route
          path="/staff"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.STAFF]}>
              <StaffDashboardLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />

          {/* Staff Accessible Operational Modules */}
          <Route path="customers" element={<CustomersList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />

          <Route path="quotations" element={<QuotationsList />} />
          <Route path="quotations/new" element={<QuotationCreate />} />
          <Route path="quotations/:id" element={<QuotationDetail />} />

          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="subscriptions/new" element={<SubscriptionCreate />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetail />} />

          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/new" element={<InvoiceCreate />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />

          <Route path="payments" element={<PaymentsList />} />
        </Route>

        {/* CUSTOMER PORTAL ROUTES - Restricted to CUSTOMER */}
        <Route
          path="/portal"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <PortalLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<PortalOverview />} />
          <Route path="dashboard" element={<PortalOverview />} />
          <Route path="subscriptions" element={<PortalSubscriptions />} />
          <Route path="invoices" element={<PortalInvoices />} />
          <Route path="payments" element={<PortalPayments />} />
          <Route path="profile" element={<PortalProfile />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
