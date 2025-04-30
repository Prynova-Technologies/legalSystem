import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BillingInfo, TimeEntry, Expense, Invoice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface BillingState {
  timeEntries: TimeEntry[];
  expenses: Expense[];
  invoices: Invoice[];
  currentTimeEntry: TimeEntry | null;
  currentExpense: Expense | null;
  currentInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    caseId: string | null;
    clientId: string | null;
    userId: string | null;
    dateRange: { start: string | null; end: string | null };
    status: 'draft' | 'sent' | 'paid' | 'overdue' | null;
    searchTerm: string;
  };
}

const initialState: BillingState = {
  timeEntries: [],
  expenses: [],
  invoices: [],
  currentTimeEntry: null,
  currentExpense: null,
  currentInvoice: null,
  isLoading: false,
  error: null,
  filters: {
    caseId: null,
    clientId: null,
    userId: null,
    dateRange: { start: null, end: null },
    status: null,
    searchTerm: '',
  },
};

// Time Entries
export const fetchTimeEntries = createAsyncThunk('billing/fetchTimeEntries', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const mockTimeEntries: TimeEntry[] = [
      {
        id: '1',
        caseId: '1',
        userId: '2',
        description: 'Initial case review and research',
        date: yesterday.toISOString(),
        duration: 120, // 2 hours in minutes
        billable: true,
        billed: false,
        rate: 250,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString(),
      },
      {
        id: '2',
        caseId: '1',
        userId: '2',
        description: 'Drafting complaint',
        date: today.toISOString(),
        duration: 180, // 3 hours in minutes
        billable: true,
        billed: false,
        rate: 250,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
    ];
    
    return mockTimeEntries;
  } catch (error) {
    return rejectWithValue('Failed to fetch time entries');
  }
});

export const createTimeEntry = createAsyncThunk(
  'billing/createTimeEntry',
  async (timeEntryData: Partial<TimeEntry>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newTimeEntry: TimeEntry = {
        id: uuidv4(),
        caseId: timeEntryData.caseId || '',
        userId: timeEntryData.userId || '',
        description: timeEntryData.description || '',
        date: timeEntryData.date || now,
        duration: timeEntryData.duration || 0,
        billable: timeEntryData.billable !== undefined ? timeEntryData.billable : true,
        billed: false,
        rate: timeEntryData.rate || 0,
        createdAt: now,
        updatedAt: now,
      };
      
      return newTimeEntry;
    } catch (error) {
      return rejectWithValue('Failed to create time entry');
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'billing/updateTimeEntry',
  async ({ timeEntryId, timeEntryData }: { timeEntryId: string; timeEntryData: Partial<TimeEntry> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { billing: BillingState };
      const existingTimeEntry = state.billing.timeEntries.find(t => t.id === timeEntryId);
      
      if (!existingTimeEntry) {
        return rejectWithValue('Time entry not found');
      }
      
      const now = new Date().toISOString();
      const updatedTimeEntry: TimeEntry = {
        ...existingTimeEntry,
        ...timeEntryData,
        updatedAt: now,
      };
      
      return updatedTimeEntry;
    } catch (error) {
      return rejectWithValue('Failed to update time entry');
    }
  }
);

export const deleteTimeEntry = createAsyncThunk(
  'billing/deleteTimeEntry',
  async (timeEntryId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return timeEntryId;
    } catch (error) {
      return rejectWithValue('Failed to delete time entry');
    }
  }
);

// Expenses
export const fetchExpenses = createAsyncThunk('billing/fetchExpenses', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const mockExpenses: Expense[] = [
      {
        id: '1',
        caseId: '1',
        userId: '2',
        description: 'Court filing fees',
        date: lastWeek.toISOString(),
        amount: 350,
        receiptUrl: 'https://example.com/receipts/filing-fee.pdf',
        billable: true,
        billed: false,
        reimbursable: false,
        category: 'filing_fee',
        createdBy: '2',
        createdAt: lastWeek.toISOString(),
        updatedAt: lastWeek.toISOString(),
      },
      {
        id: '2',
        caseId: '1',
        userId: '2',
        description: 'Travel expenses for client meeting',
        date: today.toISOString(),
        amount: 75.50,
        billable: true,
        billed: false,
        reimbursable: true,
        category: 'travel',
        createdBy: '2',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
    ];
    
    return mockExpenses;
  } catch (error) {
    return rejectWithValue('Failed to fetch expenses');
  }
});

export const createExpense = createAsyncThunk(
  'billing/createExpense',
  async (expenseData: Partial<Expense>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newExpense: Expense = {
        id: uuidv4(),
        caseId: expenseData.caseId || '',
        userId: expenseData.userId || '',
        description: expenseData.description || '',
        date: expenseData.date || now,
        amount: expenseData.amount || 0,
        receiptUrl: expenseData.receiptUrl,
        billable: expenseData.billable !== undefined ? expenseData.billable : true,
        billed: false,
        reimbursable: expenseData.reimbursable !== undefined ? expenseData.reimbursable : false,
        category: expenseData.category || 'other',
        createdBy: expenseData.userId || '',
        createdAt: now,
        updatedAt: now,
      };
      
      return newExpense;
    } catch (error) {
      return rejectWithValue('Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'billing/updateExpense',
  async ({ expenseId, expenseData }: { expenseId: string; expenseData: Partial<Expense> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { billing: BillingState };
      const existingExpense = state.billing.expenses.find(e => e.id === expenseId);
      
      if (!existingExpense) {
        return rejectWithValue('Expense not found');
      }
      
      const now = new Date().toISOString();
      const updatedExpense: Expense = {
        ...existingExpense,
        ...expenseData,
        updatedAt: now,
      };
      
      return updatedExpense;
    } catch (error) {
      return rejectWithValue('Failed to update expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'billing/deleteExpense',
  async (expenseId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return expenseId;
    } catch (error) {
      return rejectWithValue('Failed to delete expense');
    }
  }
);

// Invoices
export const fetchInvoices = createAsyncThunk('billing/fetchInvoices', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2023-001',
        clientId: '1',
        caseId: '1',
        issueDate: lastMonth.toISOString(),
        dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days after issue
        status: 'paid',
        items: [
          {
            id: 'item1',
            description: 'Legal services',
            quantity: 10,
            rate: 250,
            amount: 2500,
            type: 'time',
            timeEntryId: '1'
          }
        ],
        subtotal: 2500,
        tax: 200,
        total: 2700,
        timeEntries: ['1'],
        expenses: ['1'],
        notes: 'Initial retainer and filing fees',
        paymentDate: new Date(lastMonth.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days after issue
        createdAt: lastMonth.toISOString(),
        updatedAt: lastMonth.toISOString(),
      },
    ];
    
    return mockInvoices;
  } catch (error) {
    return rejectWithValue('Failed to fetch invoices');
  }
});

export const createInvoice = createAsyncThunk(
  'billing/createInvoice',
  async (invoiceData: Partial<Invoice>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Default due date: 30 days from now
      
      const newInvoice: Invoice = {
        id: uuidv4(),
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: invoiceData.clientId || '',
        caseId: invoiceData.caseId || '',
        issueDate: invoiceData.issueDate || now,
        dueDate: invoiceData.dueDate || dueDate.toISOString(),
        status: 'draft',
        items: invoiceData.items || [],
        subtotal: invoiceData.subtotal || 0,
        tax: invoiceData.tax || 0,
        total: invoiceData.total || 0,
        timeEntries: invoiceData.timeEntries || [],
        expenses: invoiceData.expenses || [],
        notes: invoiceData.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      
      return newInvoice;
    } catch (error) {
      return rejectWithValue('Failed to create invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'billing/updateInvoice',
  async ({ invoiceId, invoiceData }: { invoiceId: string; invoiceData: Partial<Invoice> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { billing: BillingState };
      const existingInvoice = state.billing.invoices.find(i => i.id === invoiceId);
      
      if (!existingInvoice) {
        return rejectWithValue('Invoice not found');
      }
      
      const now = new Date().toISOString();
      const updatedInvoice: Invoice = {
        ...existingInvoice,
        ...invoiceData,
        updatedAt: now,
      };
      
      return updatedInvoice;
    } catch (error) {
      return rejectWithValue('Failed to update invoice');
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  'billing/deleteInvoice',
  async (invoiceId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return invoiceId;
    } catch (error) {
      return rejectWithValue('Failed to delete invoice');
    }
  }
);

export const markInvoiceAsPaid = createAsyncThunk(
  'billing/markInvoiceAsPaid',
  async ({ invoiceId, paymentDate }: { invoiceId: string; paymentDate?: string }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { billing: BillingState };
      const existingInvoice = state.billing.invoices.find(i => i.id === invoiceId);
      
      if (!existingInvoice) {
        return rejectWithValue('Invoice not found');
      }
      
      const now = new Date().toISOString();
      const updatedInvoice: Invoice = {
        ...existingInvoice,
        status: 'paid',
        paymentDate: paymentDate || now,
        updatedAt: now,
      };
      
      return updatedInvoice;
    } catch (error) {
      return rejectWithValue('Failed to mark invoice as paid');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setCurrentTimeEntry: (state, action: PayloadAction<TimeEntry | null>) => {
      state.currentTimeEntry = action.payload;
    },
    setCurrentExpense: (state, action: PayloadAction<Expense | null>) => {
      state.currentExpense = action.payload;
    },
    setCurrentInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.currentInvoice = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<BillingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Time Entries
      .addCase(fetchTimeEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimeEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeEntries = action.payload;
      })
      .addCase(fetchTimeEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createTimeEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTimeEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeEntries.push(action.payload);
        state.currentTimeEntry = action.payload;
      })
      .addCase(createTimeEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateTimeEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTimeEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.timeEntries.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.timeEntries[index] = action.payload;
        }
        state.currentTimeEntry = action.payload;
      })
      .addCase(updateTimeEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteTimeEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTimeEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeEntries = state.timeEntries.filter(t => t.id !== action.payload);
        if (state.currentTimeEntry && state.currentTimeEntry.id === action.payload) {
          state.currentTimeEntry = null;
        }
      })
      .addCase(deleteTimeEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses.push(action.payload);
        state.currentExpense = action.payload;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        state.currentExpense = action.payload;
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = state.expenses.filter(e => e.id !== action.payload);
        if (state.currentExpense && state.currentExpense.id === action.payload) {
          state.currentExpense = null;
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices.push(action.payload);
        state.currentInvoice = action.payload;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.invoices.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
        state.currentInvoice = action.payload;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = state.invoices.filter(i => i.id !== action.payload);
        if (state.currentInvoice && state.currentInvoice.id === action.payload) {
          state.currentInvoice = null;
        }
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(markInvoiceAsPaid.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markInvoiceAsPaid.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.invoices.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
        state.currentInvoice = action.payload;
      })
      .addCase(markInvoiceAsPaid.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentTimeEntry, 
  setCurrentExpense, 
  setCurrentInvoice, 
  setFilters, 
  clearFilters 
} = billingSlice.actions;

export default billingSlice.reducer;