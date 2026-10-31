// Centralized FastAPI / RESTful Endpoints
// Ready for backend swap with zero changes to frontend page components

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CURRENT_USER: '/auth/me',
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id) => `/products/${id}`,
    VARIANTS: (id) => `/products/${id}/variants`,
  },
  PLANS: {
    BASE: '/plans',
    BY_ID: (id) => `/plans/${id}`,
    TOGGLE_STATUS: (id) => `/plans/${id}/status`,
  },
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id) => `/quotations/${id}`,
    CONVERT_TO_SUBSCRIPTION: (id) => `/quotations/${id}/convert`,
  },
  SUBSCRIPTIONS: {
    BASE: '/subscriptions',
    BY_ID: (id) => `/subscriptions/${id}`,
    UPDATE_STATUS: (id) => `/subscriptions/${id}/status`,
    RENEW: (id) => `/subscriptions/${id}/renew`,
    TIMELINE: (id) => `/subscriptions/${id}/timeline`,
  },
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id) => `/invoices/${id}`,
    CONFIRM: (id) => `/invoices/${id}/confirm`,
    CANCEL: (id) => `/invoices/${id}/cancel`,
    SEND: (id) => `/invoices/${id}/send`,
  },
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id) => `/payments/${id}`,
    RECORD: '/payments/record',
  },
  DISCOUNTS: {
    BASE: '/discounts',
    BY_ID: (id) => `/discounts/${id}`,
    TOGGLE_STATUS: (id) => `/discounts/${id}/status`,
  },
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id) => `/customers/${id}`,
    SUBSCRIPTIONS: (id) => `/customers/${id}/subscriptions`,
    INVOICES: (id) => `/customers/${id}/invoices`,
  },
  REPORTS: {
    REVENUE: '/reports/revenue',
    SUBSCRIPTIONS: '/reports/subscriptions',
    PAYMENTS: '/reports/payments',
    OVERDUE: '/reports/overdue',
    CUSTOMERS: '/reports/customers',
  },
  SETTINGS: {
    COMPANY: '/settings/company',
    TAXES: '/settings/taxes',
    STAFF: '/settings/staff',
    NOTIFICATIONS: '/settings/notifications',
  },
};

