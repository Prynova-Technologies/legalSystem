import { TimeEntry, Expense, Invoice } from '../types';
import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * Helper function to get the authentication token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * Service for handling billing-related API requests
 * Includes functions for time entries, expenses, and invoices
 */
export const billingService = {
  // Time Entries
  /**
   * Get all time entries with optional filters
   * @param filters Optional filters for time entries
   */
  getAllTimeEntries: async (filters?: Record<string, any>) => {
    try {
      let url = API_ENDPOINTS.BILLING.TIME_ENTRIES;
      
      // Add query parameters if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time entries: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      throw error;
    }
  },
  
  /**
   * Create a new time entry
   * @param timeEntryData Time entry data to create
   */
  createTimeEntry: async (timeEntryData: Partial<TimeEntry>) => {
    try {
      const response = await fetch(API_ENDPOINTS.BILLING.TIME_ENTRIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(timeEntryData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create time entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing time entry
   * @param timeEntryId ID of the time entry to update
   * @param timeEntryData Updated time entry data
   */
  updateTimeEntry: async (timeEntryId: string, timeEntryData: Partial<TimeEntry>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.TIME_ENTRIES}/${timeEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(timeEntryData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update time entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  },
  
  /**
   * Delete a time entry
   * @param timeEntryId ID of the time entry to delete
   */
  deleteTimeEntry: async (timeEntryId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.TIME_ENTRIES}/${timeEntryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete time entry: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      throw error;
    }
  },
  
  // Expenses
  /**
   * Get all expenses with optional filters
   * @param filters Optional filters for expenses
   */
  getAllExpenses: async (filters?: Record<string, any>) => {
    try {
      let url = API_ENDPOINTS.BILLING.EXPENSES;
      
      // Add query parameters if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },
  
  /**
   * Create a new expense
   * @param expenseData Expense data to create
   */
  createExpense: async (expenseData: Partial<Expense>) => {
    try {
      const response = await fetch(API_ENDPOINTS.BILLING.EXPENSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create expense: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing expense
   * @param expenseId ID of the expense to update
   * @param expenseData Updated expense data
   */
  updateExpense: async (expenseId: string, expenseData: Partial<Expense>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.EXPENSES}/${expenseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update expense: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },
  
  /**
   * Delete an expense
   * @param expenseId ID of the expense to delete
   */
  deleteExpense: async (expenseId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.EXPENSES}/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete expense: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },
  
  // Invoices
  /**
   * Get all invoices with optional filters
   * @param filters Optional filters for invoices
   */
  getAllInvoices: async (filters?: Record<string, any>) => {
    try {
      let url = API_ENDPOINTS.BILLING.INVOICES;
      
      // Add query parameters if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  /**
   * Create a new invoice
   * @param invoiceData Invoice data to create
   */
  createInvoice: async (invoiceData: Partial<Invoice>) => {
    try {
      const response = await fetch(API_ENDPOINTS.BILLING.INVOICES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create invoice: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing invoice
   * @param invoiceId ID of the invoice to update
   * @param invoiceData Updated invoice data
   */
  updateInvoice: async (invoiceId: string, invoiceData: Partial<Invoice>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.INVOICES}/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update invoice: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Delete an invoice
   * @param invoiceId ID of the invoice to delete
   */
  deleteInvoice: async (invoiceId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.INVOICES}/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete invoice: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },
  
  /**
   * Mark an invoice as paid
   * @param invoiceId ID of the invoice to mark as paid
   * @param paymentData Payment data including date
   */
  markInvoiceAsPaid: async (invoiceId: string, paymentData: { paymentDate?: string }) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BILLING.INVOICES}/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark invoice as paid: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  },
};