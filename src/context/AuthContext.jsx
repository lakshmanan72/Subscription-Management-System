import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
        const parsed = JSON.parse(saved);
        if (parsed.role === 'Super Admin') parsed.role = ROLES.ADMIN;
        if (parsed.role === 'Customer') parsed.role = ROLES.CUSTOMER;
        if (parsed.role === 'Billing Admin' || parsed.role === 'Staff') parsed.role = ROLES.STAFF;
        return parsed;
      } catch {
        return DEFAULT_ADMIN;
      }
    }
    return DEFAULT_ADMIN;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('brightloop_is_auth') !== 'false';
  });

  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('brightloop_current_user', JSON.stringify(user));
      localStorage.setItem('brightloop_is_auth', 'true');
    } else {
      localStorage.removeItem('brightloop_current_user');
      localStorage.setItem('brightloop_is_auth', 'false');
    }
  }, [user, isAuthenticated]);

  const login = async (email, password) => {
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return { success: false, message: 'Please enter both email and password.' };
    }

    const emailClean = email.toLowerCase().trim();

    // 1. Check in registered users list
    let registeredUsers = [];
    try {
      registeredUsers = JSON.parse(localStorage.getItem('brightloop_registered_users') || '[]');
    } catch {
      registeredUsers = [];
    }

    const matchedRegistered = registeredUsers.find(
      (u) => u.email.toLowerCase() === emailClean
    );

    // 2. Check in settings staff members list
    let staffMembers = [];
    try {
      const settings = JSON.parse(localStorage.getItem('bl_settings') || '{}');
      staffMembers = settings.staffMembers || [];
    } catch {
      staffMembers = [];
    }

    const matchedStaff = staffMembers.find(
      (s) => s.email && s.email.toLowerCase() === emailClean
    );

    let authenticatedUser;

    if (matchedRegistered) {
      authenticatedUser = { ...matchedRegistered };
    } else if (matchedStaff) {
      authenticatedUser = {
        id: matchedStaff.id || 'usr-staff-' + Date.now(),
        name: matchedStaff.name,
        email: matchedStaff.email,
        role: ROLES.STAFF,
        company: 'Brightloop Operations',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedStaff.name)}&background=6366f1&color=fff`,
        isCustomer: false,
      };
    } else if (emailClean === 'priyanka@brightloop.io' || emailClean.startsWith('admin')) {
      authenticatedUser = {
        ...DEFAULT_ADMIN,
        email: emailClean,
        name: emailClean === 'priyanka@brightloop.io' ? 'Priyanka Sen' : emailClean.split('@')[0],
      };
    } else if (emailClean === 'rohan.d@brightloop.io' || emailClean.includes('staff') || emailClean.includes('ops')) {
      authenticatedUser = {
        ...DEFAULT_STAFF,
        email: emailClean,
        name: emailClean === 'rohan.d@brightloop.io' ? 'Rohan Deshmukh' : emailClean.split('@')[0],
      };
    } else if (emailClean === 'aditi@zenithtech.in' || emailClean.includes('client') || emailClean.includes('customer')) {
      authenticatedUser = {
        ...DEFAULT_CUSTOMER,
        email: emailClean,
        name: emailClean === 'aditi@zenithtech.in' ? 'Aditi Rao' : emailClean.split('@')[0],
      };
    } else {
      // Any other demo customer account - NEVER default to ADMIN
      authenticatedUser = {
        id: 'cust-demo-' + Date.now(),
        customerId: 'cust-demo-' + Date.now(),
        name: emailClean.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        email: emailClean,
        company: 'Client Portal Account',
        role: ROLES.CUSTOMER,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(emailClean)}&background=4f46e5&color=fff`,
        isCustomer: true,
      };
    }

    setUser(authenticatedUser);
    setIsAuthenticated(true);
    localStorage.setItem('brightloop_auth_token', 'mock_jwt_token_' + Date.now());
    toast.success(`Welcome back, ${authenticatedUser.name}!`);
    return { success: true, role: authenticatedUser.role };
  };

  const register = async ({ name, email, company, password }) => {
    const emailClean = (email || '').toLowerCase().trim();

    if (!emailClean) {
      return { success: false, message: 'Valid email is required.' };
    }

    // Duplicate check
    let registeredUsers = [];
    try {
      registeredUsers = JSON.parse(localStorage.getItem('brightloop_registered_users') || '[]');
    } catch {
      registeredUsers = [];
    }

    const isDuplicate =
      DEMO_CREDENTIALS.some((u) => u.email.toLowerCase() === emailClean) ||
      registeredUsers.some((u) => u.email.toLowerCase() === emailClean);

    if (isDuplicate) {
      toast.error('An account with this email address already exists.');
      return { success: false, message: 'An account with this email address already exists.' };
    }

    const uniqueId = Date.now().toString();
    const newCustomerUser = {
      id: 'usr-cust-' + uniqueId,
      customerId: 'cust-' + uniqueId,
      name: name.trim(),
      email: emailClean,
      company: company?.trim() || `${name.trim()}'s Organization`,
      role: ROLES.CUSTOMER, // STRICT: ALWAYS CUSTOMER. NEVER ADMIN OR STAFF.
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`,
      isCustomer: true,
      createdAt: new Date().toISOString(),
    };

    registeredUsers.push(newCustomerUser);
    localStorage.setItem('brightloop_registered_users', JSON.stringify(registeredUsers));

    setUser(newCustomerUser);
    setIsAuthenticated(true);
    localStorage.setItem('brightloop_auth_token', 'mock_jwt_token_' + Date.now());
    toast.success('Registration successful! Welcome to your customer portal.');
    return { success: true, role: ROLES.CUSTOMER };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('brightloop_auth_token');
    localStorage.removeItem('brightloop_current_user');
    localStorage.setItem('brightloop_is_auth', 'false');
    toast.success('Successfully logged out.');
  };

  const switchUserType = (type) => {
    const roleKey = (type || '').toUpperCase();
    if (roleKey === 'CUSTOMER') {
      setUser(DEFAULT_CUSTOMER);
      toast('Switched to Demo Customer View (Aditi Rao)', { icon: '👤' });
    } else if (roleKey === 'STAFF') {
      setUser(DEFAULT_STAFF);
      toast('Switched to Staff Workspace (Rohan Deshmukh)', { icon: '💼' });
    } else {
      setUser(DEFAULT_ADMIN);
      toast('Switched to Admin Console (Priyanka Sen)', { icon: '🛡️' });
    }
    setIsAuthenticated(true);
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
