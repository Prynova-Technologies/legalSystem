import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Case, CaseStatus, CaseType } from '../../types';
import caseService from '../../services/caseService';
import { RootState } from '..';

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

// Async thunks for API calls
export const fetchCases = createAsyncThunk(
  'cases/fetchCases', 
  async (filters: Record<string, any> = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      const cases = await caseService.getAllCases(token, filters);
      return cases;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cases');
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  'cases/fetchCaseById',
  async (caseId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      const caseData = await caseService.getCaseById(token, caseId);
      return caseData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch case details');
    }
  }
);

export const createCase = createAsyncThunk(
  'cases/createCase',
  async (caseData: Partial<Case>, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      const newCase = await caseService.createCase(token, caseData);
      return newCase;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create case');
    }
  }
);

export const updateCase = createAsyncThunk(
  'cases/updateCase',
  async ({ caseId, caseData }: { caseId: string; caseData: Partial<Case> }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      let updatedCase = await caseService.updateCase(token, caseId, caseData);
      
      // const state = getState() as { cases: CasesState };
      const existingCase = state.cases.cases.find(c => c.id === caseId);
      
      if (!existingCase) {
        return rejectWithValue('Case not found');
      }
      
      const now = new Date().toISOString();
       updatedCase = {
        ...existingCase,
        ...caseData,
        updatedAt: now,
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

export const addCaseNoteAsync = createAsyncThunk(
  'cases/addCaseNote',
  async ({ caseId, note }: { caseId: string; note: any }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      const result = await caseService.addCaseNote(token, caseId, note);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add case note');
    }
  }
);

export const addCaseTaskAsync = createAsyncThunk(
  'cases/addCaseTaskAsync',
  async ({ caseId, taskData }: { caseId: string; taskData: any }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }
      
      const result = await caseService.addCaseTask(token, caseId, taskData);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add case task');
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
      })
      
      // Add case note
      .addCase(addCaseNoteAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCaseNoteAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { caseId, note } = action.payload;
        
        // Update in cases array
        const caseIndex = state.cases.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          if (!state.cases[caseIndex].notes) {
            state.cases[caseIndex].notes = [];
          }
          state.cases[caseIndex].notes.push(note);
          state.cases[caseIndex].updatedAt = new Date().toISOString();
        }
        
        // Update current case if it's the one being modified
        if (state.currentCase && state.currentCase.id === caseId) {
          if (!state.currentCase.notes) {
            state.currentCase.notes = [];
          }
          state.currentCase.notes.push(note);
          state.currentCase.updatedAt = new Date().toISOString();
        }
      })
      .addCase(addCaseNoteAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add task to case
      .addCase(addCaseTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCaseTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        // If we have the current case loaded and it matches the case we added a task to
        if (state.currentCase && state.currentCase.id === action.payload.caseId) {
          // Add the new task to the current case's tasks array
          state.currentCase.tasks = [...state.currentCase.tasks, action.payload];
        }
      })
      .addCase(addCaseTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCase, setFilters, clearFilters, addCaseNote } = casesSlice.actions;
export default casesSlice.reducer;