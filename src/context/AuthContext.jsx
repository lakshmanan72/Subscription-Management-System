import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
};

// Official Demo Credentials for Hackathon
export const DEMO_CREDENTIALS = [
  {
    id: 'usr-admin-1',
    name: 'Priyanka Sen',
    email: 'priyanka@brightloop.io',
    password: 'Admin@Brightloop123!',
    role: ROLES.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    company: 'Brightloop Technologies',
    isCustomer: false,
  },
  {
    id: 'usr-staff-1',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@brightloop.io',
    password: 'Staff@Brightloop123!',
    role: ROLES.STAFF,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    company: 'Brightloop Operations',
    isCustomer: false,
  },
  {
    id: 'cust-1',
    name: 'Aditi Rao',
    email: 'aditi@zenithtech.in',
    password: 'Client@Zenith123!',
    role: ROLES.CUSTOMER,
    customerId: 'cust-1',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    company: 'Zenith Technologies Pvt Ltd',
    isCustomer: true,
  },
];

const DEFAULT_ADMIN = DEMO_CREDENTIALS[0];
const DEFAULT_STAFF = DEMO_CREDENTIALS[1];
const DEFAULT_CUSTOMER = DEMO_CREDENTIALS[2];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ADMIN;
      }
    }
    return DEFAULT_ADMIN;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('brightloop_auth_token') || localStorage.getItem('brightloop_is_auth') === 'true';
  });

  // Verify and restore authenticated user session on mount
  useEffect(() => {
    const token = localStorage.getItem('brightloop_auth_token');
    if (token) {
      apiClient
        .get(API_ENDPOINTS.AUTH.CURRENT_USER)
        .then((userData) => {
          if (userData && userData.id) {
            const role = (userData.role || 'CUSTOMER').toUpperCase();
            const enrichedUser = {
              ...userData,
              role,
              isCustomer: role === ROLES.CUSTOMER,
              avatar:
                userData.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=4f46e5&color=fff`,
            };
            setUser(enrichedUser);
            setIsAuthenticated(true);
            localStorage.setItem('brightloop_current_user', JSON.stringify(enrichedUser));
            localStorage.setItem('brightloop_is_auth', 'true');
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('brightloop_auth_token');
          localStorage.removeItem('brightloop_current_user');
          localStorage.setItem('brightloop_is_auth', 'false');
          setIsAuthenticated(false);
          setUser(null);
        });
    }
  }, []);

  const login = async (email, password) => {
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return { success: false, message: 'Please enter both email and password.' };
    }

    const emailClean = email.toLowerCase().trim();

    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: emailClean,
        password: password,
      });

      if (res && res.access_token) {
        localStorage.setItem('brightloop_auth_token', res.access_token);
        const role = (res.user?.role || 'CUSTOMER').toUpperCase();
        const authenticatedUser = {
          ...res.user,
          role,
          isCustomer: role === ROLES.CUSTOMER,
          avatar:
            res.user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user?.name || 'User')}&background=4f46e5&color=fff`,
        };

        setUser(authenticatedUser);
        setIsAuthenticated(true);
        localStorage.setItem('brightloop_current_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('brightloop_is_auth', 'true');
        toast.success(`Welcome back, ${authenticatedUser.name}!`);
        return { success: true, role: authenticatedUser.role };
      }
    } catch (err) {
      // Fallback for offline demo mode if backend is unreachable
      const matchedDemo = DEMO_CREDENTIALS.find(
        (u) => u.email.toLowerCase() === emailClean && u.password === password
      );
      if (matchedDemo) {
        setUser(matchedDemo);
        setIsAuthenticated(true);
        localStorage.setItem('brightloop_current_user', JSON.stringify(matchedDemo));
        localStorage.setItem('brightloop_is_auth', 'true');
        toast.success(`Welcome back, ${matchedDemo.name}!`);
        return { success: true, role: matchedDemo.role };
      }

      toast.error(err.message || 'Authentication failed. Please verify credentials.');
      return { success: false, message: err.message || 'Authentication failed.' };
    }
  };

  const register = async ({ name, email, company, password }) => {
    const emailClean = (email || '').toLowerCase().trim();

    if (!emailClean) {
      return { success: false, message: 'Valid email is required.' };
    }

    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: emailClean,
        company: company?.trim() || `${name.trim()}'s Organization`,
        password: password,
      });

      if (res && res.access_token) {
        localStorage.setItem('brightloop_auth_token', res.access_token);
        const role = (res.user?.role || 'CUSTOMER').toUpperCase();
        const newCustomerUser = {
          ...res.user,
          role,
          isCustomer: true,
          avatar:
            res.user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user?.name || name)}&background=4f46e5&color=fff`,
        };

        setUser(newCustomerUser);
        setIsAuthenticated(true);
        localStorage.setItem('brightloop_current_user', JSON.stringify(newCustomerUser));
        localStorage.setItem('brightloop_is_auth', 'true');
        toast.success('Registration successful! Welcome to your customer portal.');
        return { success: true, role: ROLES.CUSTOMER };
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
      return { success: false, message: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore network errors during logout
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('brightloop_auth_token');
    localStorage.removeItem('brightloop_current_user');
    localStorage.setItem('brightloop_is_auth', 'false');
    toast.success('Successfully logged out.');
  };

  const switchUserType = async (type) => {
    const roleKey = (type || '').toUpperCase();
    let targetCred = DEFAULT_ADMIN;
    if (roleKey === 'CUSTOMER') {
      targetCred = DEFAULT_CUSTOMER;
    } else if (roleKey === 'STAFF') {
      targetCred = DEFAULT_STAFF;
    }

    // Attempt real login with demo credentials so JWT is set for active session
    try {
      await login(targetCred.email, targetCred.password);
    } catch {
      setUser(targetCred);
      setIsAuthenticated(true);
      localStorage.setItem('brightloop_current_user', JSON.stringify(targetCred));
      localStorage.setItem('brightloop_is_auth', 'true');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        switchUserType,
        ROLES,
        DEMO_CREDENTIALS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
