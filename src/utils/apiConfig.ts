/**
 * API Configuration Utility
 * Provides centralized configuration for API endpoints
 */

// Base API URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL;

// API endpoints configuration
const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },
  
  // Dashboard endpoints
  DASHBOARD: {
    ANALYTICS: `${API_BASE_URL}/dashboard`,
  },
  
  // Cases endpoints
  CASES: {
    BASE: `${API_BASE_URL}/cases`,
    DETAIL: (id: string) => `${API_BASE_URL}/cases/${id}`,
    TASKS: (id: string) => `${API_BASE_URL}/cases/${id}/tasks`,
    NOTES: (id: string) => `${API_BASE_URL}/cases/${id}/notes`,
  },
  
  // Clients endpoints
  CLIENTS: {
    BASE: `${API_BASE_URL}/clients`,
    DETAIL: (id: string) => `${API_BASE_URL}/clients/${id}`,
  },
  
  // Tasks endpoints
  TASKS: {
    BASE: `${API_BASE_URL}/tasks`,
    DETAIL: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  },
  
  // Billing endpoints
  BILLING: {
    TIME_ENTRIES: `${API_BASE_URL}/billing/time-entries`,
    TIME_ENTRY_DETAIL: (id: string) => `${API_BASE_URL}/billing/time-entries/${id}`,
    EXPENSES: `${API_BASE_URL}/billing/expenses`,
    UNBILLED_ITEMS: `${API_BASE_URL}/billing/unbilled-items`,
    EXPENSE_DETAIL: (id: string) => `${API_BASE_URL}/billing/expenses/${id}`,
    INVOICES: `${API_BASE_URL}/invoices`,
    INVOICE_DETAIL: (id: string) => `${API_BASE_URL}/billing/invoices/${id}`,
  },
  
  // Time entries endpoints (legacy - use BILLING.TIME_ENTRIES instead)
  TIME_ENTRIES: {
    BASE: `${API_BASE_URL}/billing/time-entries`,
    DETAIL: (id: string) => `${API_BASE_URL}/billing/time-entries/${id}`,
  },
  
  // Invoices endpoints (legacy - use BILLING.INVOICES instead)
  INVOICES: {
    BASE: `${API_BASE_URL}/billing/invoices`,
    DETAIL: (id: string) => `${API_BASE_URL}/billing/invoices/${id}`,
  },
  
  // Documents endpoints
  DOCUMENTS: {
    BASE: `${API_BASE_URL}/documents`,
    DETAIL: (id: string) => `${API_BASE_URL}/documents/${id}`,
  },
  
  // Settings endpoints
  SETTINGS: {
    BASE: `${API_BASE_URL}/settings`,
  },
};

// Export configuration
export { API_BASE_URL, API_ENDPOINTS };