import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';

export const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRole = (user?.role || '').toUpperCase();
  const isAllowed = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

  if (!isAllowed) {
    // If staff user is trying to access standard entity routes, rewrite to /staff
    if (userRole === ROLES.STAFF) {
      const path = location.pathname;
      const staffModules = ['/quotations', '/subscriptions', '/invoices', '/payments', '/customers'];
      const matchedModule = staffModules.find((mod) => path === mod || path.startsWith(`${mod}/`));
      if (matchedModule) {
        return <Navigate to={`/staff${path}`} replace />;
      }
      return <Navigate to="/staff/dashboard" replace />;
    }

    // If customer user tries to access non-customer routes
    if (userRole === ROLES.CUSTOMER) {
      return <Navigate to="/portal/dashboard" replace />;
    }

    // If admin tries to access staff or customer-only routes
    if (userRole === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default RoleProtectedRoute;

