import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Case, CaseStatus, CaseType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface CasesState {
  cases: Case[];
  currentCase: Case | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: CaseStatus | null;
    type: CaseType | null;
    assignedTo: string | null;
    clientId: string | null;
    searchTerm: string;
  };
}

const initialState: CasesState = {
  cases: [],
  currentCase: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    type: null,
    assignedTo: null,
    clientId: null,
    searchTerm: '',
  },
};

// Mock API calls - would be replaced with actual API calls
export const fetchCases = createAsyncThunk('cases/fetchCases', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const mockCases: Case[] = [
      {
        id: '1',
        caseNumber: 'CASE-2023-001',
        title: 'Smith vs. Johnson',
        description: 'Personal injury case involving a car accident',
        caseType: CaseType.CIVIL,
        status: CaseStatus.OPEN,
        clientId: '1',
        assignedTo: ['2', '3'],
        openDate: new Date().toISOString(),
        courtDetails: {
          courtName: 'Superior Court of California',
          jurisdiction: 'Los Angeles County',
          judge: 'Hon. Robert Williams',
          courtroom: '12B',
          filingNumber: 'LA-CIV-2023-12345',
        },
        relatedParties: [
          {
            id: '1',
            name: 'John Smith',
            type: 'plaintiff',
            contactInfo: {
              email: 'john.smith@example.com',
              phone: '555-123-4567',
              address: {
                street: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zipCode: '90001',
                country: 'USA',
              },
            },
          },
          {
            id: '2',
            name: 'Robert Johnson',
            type: 'defendant',
            contactInfo: {
              email: 'robert.johnson@example.com',
              phone: '555-987-6543',
              address: {
                street: '456 Oak Ave',
                city: 'Los Angeles',
                state: 'CA',
                zipCode: '90002',
                country: 'USA',
              },
            },
          },
        ],
        notes: [],
        documents: [],
        tasks: [],
        billingInfo: {
          id: '1',
          caseId: '1',
          billingType: 'hourly',
          hourlyRate: 250,
          timeEntries: [],
          expenses: [],
          invoices: [],
        },
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    return mockCases;
  } catch (error) {
    return rejectWithValue('Failed to fetch cases');
  }
});

export const fetchCaseById = createAsyncThunk(
  'cases/fetchCaseById',
  async (caseId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, we would make an API call here
      // For now, we'll just find the case in our state
      const state = getState() as { cases: CasesState };
      const foundCase = state.cases.cases.find(c => c.id === caseId);
      
      if (!foundCase) {
        return rejectWithValue('Case not found');
      }
      
      return foundCase;
    } catch (error) {
      return rejectWithValue('Failed to fetch case details');
    }
  }
);

export const createCase = createAsyncThunk(
  'cases/createCase',
  async (caseData: Partial<Case>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newCase: Case = {
        id: uuidv4(),
        caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: caseData.title || 'New Case',
        description: caseData.description || '',
        caseType: caseData.caseType || CaseType.OTHER,
        status: CaseStatus.OPEN,
        clientId: caseData.clientId || '',
        assignedTo: caseData.assignedTo || [],
        openDate: now,
        courtDetails: caseData.courtDetails || undefined,
        relatedParties: caseData.relatedParties || [],
        notes: [],
        documents: [],
        tasks: [],
        billingInfo: {
          id: uuidv4(),
          caseId: '',  // Will be updated after case creation
          billingType: 'hourly',
          hourlyRate: 250,
          timeEntries: [],
          expenses: [],
          invoices: [],
        },
        history: [
          {
            id: uuidv4(),
            timestamp: now,
            userId: '1', // Current user ID would be used here
            action: 'Case Created',
            details: 'Case was created',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      
      // Update the caseId in billingInfo
      newCase.billingInfo.caseId = newCase.id;
      
      return newCase;
    } catch (error) {
      return rejectWithValue('Failed to create case');
    }
  }
);

export const updateCase = createAsyncThunk(
  'cases/updateCase',
  async ({ caseId, caseData }: { caseId: string; caseData: Partial<Case> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { cases: CasesState };
      const existingCase = state.cases.cases.find(c => c.id === caseId);
      
      if (!existingCase) {
        return rejectWithValue('Case not found');
      }
      
      const now = new Date().toISOString();
      const updatedCase: Case = {
        ...existingCase,
        ...caseData,
        updatedAt: now,
        history: [
          ...existingCase.history,
          {
            id: uuidv4(),
            timestamp: now,
            userId: '1', // Current user ID would be used here
            action: 'Case Updated',
            details: 'Case details were updated',
          },
        ],
      };
      
      return updatedCase;
    } catch (error) {
      return rejectWithValue('Failed to update case');
    }
  }
);

export const deleteCase = createAsyncThunk(
  'cases/deleteCase',
  async (caseId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return caseId;
    } catch (error) {
      return rejectWithValue('Failed to delete case');
    }
  }
);

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setCurrentCase: (state, action: PayloadAction<Case | null>) => {
      state.currentCase = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CasesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addCaseNote: (state, action: PayloadAction<{ caseId: string; note: { id: string; content: string; createdBy: string; createdAt: string; updatedAt: string } }>) => {
      const { caseId, note } = action.payload;
      const caseIndex = state.cases.findIndex(c => c.id === caseId);
      
      if (caseIndex !== -1) {
        state.cases[caseIndex].notes.push(note);
        state.cases[caseIndex].updatedAt = new Date().toISOString();
        
        // Update current case if it's the one being modified
        if (state.currentCase && state.currentCase.id === caseId) {
          state.currentCase.notes.push(note);
          state.currentCase.updatedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
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
      
      // Fetch case by ID
      .addCase(fetchCaseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCase = action.payload;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create case
      .addCase(createCase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cases.push(action.payload);
        state.currentCase = action.payload;
      })
      .addCase(createCase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update case
      .addCase(updateCase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCase.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.cases.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
        state.currentCase = action.payload;
      })
      .addCase(updateCase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete case
      .addCase(deleteCase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cases = state.cases.filter(c => c.id !== action.payload);
        if (state.currentCase && state.currentCase.id === action.payload) {
          state.currentCase = null;
        }
      })
      .addCase(deleteCase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCase, setFilters, clearFilters, addCaseNote } = casesSlice.actions;
export default casesSlice.reducer;