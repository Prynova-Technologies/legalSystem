import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TimeEntry, Expense, Invoice } from '../../types';
import { billingService } from '../../services/billingService';

interface BillingState {
  timeEntries: TimeEntry[];
  expenses: Expense[];
  invoices: Invoice[];
  cases: any[];
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
  cases: [],
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
export const fetchTimeEntries = createAsyncThunk('billing/fetchTimeEntries', async (filters: Record<string, any> = {}, { rejectWithValue }) => {
  try {
    const timeEntries = await billingService.getAllTimeEntries(filters);
    return timeEntries;
  } catch (error) {
    return rejectWithValue('Failed to fetch time entries');
  }
});

export const createTimeEntry = createAsyncThunk(
  'billing/createTimeEntry',
  async (timeEntryData: Partial<TimeEntry>, { rejectWithValue }) => {
    try {
      const newTimeEntry = await billingService.createTimeEntry(timeEntryData);
      return newTimeEntry;
    } catch (error) {
      return rejectWithValue('Failed to create time entry');
    }
  }
);

export const updateTimeEntry = createAsyncThunk(
  'billing/updateTimeEntry',
  async ({ timeEntryId, timeEntryData }: { timeEntryId: string; timeEntryData: Partial<TimeEntry> }, { rejectWithValue }) => {
    try {
      const updatedTimeEntry = await billingService.updateTimeEntry(timeEntryId, timeEntryData);
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
      await billingService.deleteTimeEntry(timeEntryId);
      return timeEntryId;
    } catch (error) {
      return rejectWithValue('Failed to delete time entry');
    }
  }
);

// Expenses
export const fetchExpenses = createAsyncThunk('billing/fetchExpenses', async (filters: Record<string, any> = {}, { rejectWithValue }) => {
  try {
    const expenses = await billingService.getAllExpenses(filters);
    return expenses;
  } catch (error) {
    return rejectWithValue('Failed to fetch expenses');
  }
});

export const createExpense = createAsyncThunk(
  'billing/createExpense',
  async (expenseData: Partial<Expense>, { rejectWithValue }) => {
    try {
      const newExpense = await billingService.createExpense(expenseData);
      return newExpense;
    } catch (error) {
      return rejectWithValue('Failed to create expense');
    }
  }
);

export const updateExpense = createAsyncThunk(
  'billing/updateExpense',
  async ({ expenseId, expenseData }: { expenseId: string; expenseData: Partial<Expense> }, { rejectWithValue }) => {
    try {
      const updatedExpense = await billingService.updateExpense(expenseId, expenseData);
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
      await billingService.deleteExpense(expenseId);
      return expenseId;
    } catch (error) {
      return rejectWithValue('Failed to delete expense');
    }
  }
);

// Invoices
export const fetchInvoices = createAsyncThunk('billing/fetchInvoices', async (filters: Record<string, any> = {}, { rejectWithValue }) => {
  try {
    const invoices = await billingService.getAllInvoices(filters);
    return invoices;
  } catch (error) {
    return rejectWithValue('Failed to fetch invoices');
  }
});

export const createInvoice = createAsyncThunk(
  'billing/createInvoice',
  async (invoiceData: Partial<Invoice>, { rejectWithValue }) => {
    try {
      const newInvoice = await billingService.createInvoice(invoiceData);
      return newInvoice;
    } catch (error) {
      return rejectWithValue('Failed to create invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'billing/updateInvoice',
  async ({ invoiceId, invoiceData }: { invoiceId: string; invoiceData: Partial<Invoice> }, { rejectWithValue }) => {
    try {
      const updatedInvoice = await billingService.updateInvoice(invoiceId, invoiceData);
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
      await billingService.deleteInvoice(invoiceId);
      return invoiceId;
    } catch (error) {
      return rejectWithValue('Failed to delete invoice');
    }
  }
);

export const markInvoiceAsPaid = createAsyncThunk(
  'billing/markInvoiceAsPaid',
  async ({ invoiceId, paymentDate }: { invoiceId: string; paymentDate?: string }, { rejectWithValue }) => {
    try {
      const updatedInvoice = await billingService.markInvoiceAsPaid(invoiceId, { paymentDate });
      return updatedInvoice;
    } catch (error) {
      return rejectWithValue('Failed to mark invoice as paid');
    }
  }
);

// Fetch all cases
export const fetchCases = createAsyncThunk(
  'billing/fetchCases',
  async (_, { rejectWithValue }) => {
    try {
      const cases = await billingService.fetchCases();
      return cases;
    } catch (error) {
      return rejectWithValue('Failed to fetch cases');
    }
  }
);

// Fetch unbilled items for a specific case
export const fetchUnbilledItems = createAsyncThunk(
  'billing/fetchUnbilledItems',
  async (caseId: string, { rejectWithValue }) => {
    try {
      const unbilledItems = await billingService.fetchUnbilledItems(caseId);
      return unbilledItems;
    } catch (error) {
      return rejectWithValue('Failed to fetch unbilled items');
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
      })
      
      // Cases
      .addCase(fetchCases.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cases = action.payload;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Unbilled Items
      .addCase(fetchUnbilledItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUnbilledItems.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchUnbilledItems.rejected, (state, action) => {
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