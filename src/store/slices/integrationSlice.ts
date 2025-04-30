import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'accounting' | 'document' | 'custom';
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSynced: string | null;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CalendarIntegration extends Integration {
  type: 'calendar';
  provider: 'google' | 'outlook' | 'other';
  config: {
    syncEvents: boolean;
    syncDirection: 'import' | 'export' | 'bidirectional';
    defaultCalendarId?: string;
  };
}

interface EmailIntegration extends Integration {
  type: 'email';
  provider: 'gmail' | 'outlook' | 'other';
  config: {
    syncEmails: boolean;
    tagIncomingEmails: boolean;
    autoAssignToCase: boolean;
    signature?: string;
  };
}

interface AccountingIntegration extends Integration {
  type: 'accounting';
  provider: 'quickbooks' | 'xero' | 'other';
  config: {
    syncInvoices: boolean;
    syncExpenses: boolean;
    syncClients: boolean;
    defaultAccountId?: string;
  };
}

interface DocumentIntegration extends Integration {
  type: 'document';
  provider: 'onedrive' | 'google_drive' | 'dropbox' | 'other';
  config: {
    syncDocuments: boolean;
    defaultFolderId?: string;
    preserveFolderStructure: boolean;
  };
}

interface CustomIntegration extends Integration {
  type: 'custom';
  provider: string;
  config: Record<string, any>;
  webhookUrl?: string;
  apiKey?: string;
}

interface SyncJob {
  id: string;
  integrationType: Integration['type'];
  integrationId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: string | null;
  endTime: string | null;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  error?: string;
  createdAt: string;
}

interface IntegrationState {
  integrations: Integration[];
  syncJobs: SyncJob[];
  currentIntegration: Integration | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: IntegrationState = {
  integrations: [],
  syncJobs: [],
  currentIntegration: null,
  isLoading: false,
  error: null,
};

// Fetch integrations
export const fetchIntegrations = createAsyncThunk(
  'integration/fetchIntegrations',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const now = new Date().toISOString();
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Google Calendar',
          type: 'calendar',
          provider: 'google',
          status: 'connected',
          lastSynced: now,
          config: {
            syncEvents: true,
            syncDirection: 'bidirectional',
            defaultCalendarId: 'primary',
          },
          createdAt: now,
          updatedAt: now,
        } as CalendarIntegration,
        {
          id: '2',
          name: 'Office 365 Email',
          type: 'email',
          provider: 'outlook',
          status: 'connected',
          lastSynced: now,
          config: {
            syncEmails: true,
            tagIncomingEmails: true,
            autoAssignToCase: false,
            signature: '<p>Best regards,</p><p>Legal Team</p>',
          },
          createdAt: now,
          updatedAt: now,
        } as EmailIntegration,
        {
          id: '3',
          name: 'QuickBooks',
          type: 'accounting',
          provider: 'quickbooks',
          status: 'disconnected',
          lastSynced: null,
          config: {
            syncInvoices: true,
            syncExpenses: true,
            syncClients: false,
          },
          createdAt: now,
          updatedAt: now,
        } as AccountingIntegration,
      ];
      
      return mockIntegrations;
    } catch (error) {
      return rejectWithValue('Failed to fetch integrations');
    }
  }
);

// Connect integration
export const connectIntegration = createAsyncThunk(
  'integration/connectIntegration',
  async (integrationData: Partial<Integration>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date().toISOString();
      const newIntegration: Integration = {
        id: uuidv4(),
        name: integrationData.name || '',
        type: integrationData.type || 'custom',
        provider: integrationData.provider || '',
        status: 'connected',
        lastSynced: now,
        config: integrationData.config || {},
        createdAt: now,
        updatedAt: now,
      };
      
      return newIntegration;
    } catch (error) {
      return rejectWithValue('Failed to connect integration');
    }
  }
);

// Disconnect integration
export const disconnectIntegration = createAsyncThunk(
  'integration/disconnectIntegration',
  async (integrationId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return integrationId;
    } catch (error) {
      return rejectWithValue('Failed to disconnect integration');
    }
  }
);

// Update integration
export const updateIntegration = createAsyncThunk(
  'integration/updateIntegration',
  async ({ integrationId, updates }: { integrationId: string; updates: Partial<Integration> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { integration: IntegrationState };
      const existingIntegration = state.integration.integrations.find(i => i.id === integrationId);
      
      if (!existingIntegration) {
        return rejectWithValue('Integration not found');
      }
      
      const now = new Date().toISOString();
      const updatedIntegration: Integration = {
        ...existingIntegration,
        ...updates,
        updatedAt: now,
      };
      
      return updatedIntegration;
    } catch (error) {
      return rejectWithValue('Failed to update integration');
    }
  }
);

// Sync integration
export const syncIntegration = createAsyncThunk(
  'integration/syncIntegration',
  async (integrationId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const state = getState() as { integration: IntegrationState };
      const integration = state.integration.integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return rejectWithValue('Integration not found');
      }
      
      const now = new Date().toISOString();
      const syncJob: SyncJob = {
        id: uuidv4(),
        integrationType: integration.type,
        integrationId,
        status: 'completed',
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: now,
        itemsProcessed: 25,
        itemsSucceeded: 23,
        itemsFailed: 2,
        createdAt: now,
      };
      
      const updatedIntegration: Integration = {
        ...integration,
        lastSynced: now,
        updatedAt: now,
      };
      
      return { integration: updatedIntegration, syncJob };
    } catch (error) {
      return rejectWithValue('Failed to sync integration');
    }
  }
);

// Fetch sync jobs
export const fetchSyncJobs = createAsyncThunk(
  'integration/fetchSyncJobs',
  async (integrationId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const now = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      
      const mockSyncJobs: SyncJob[] = [
        {
          id: '1',
          integrationType: 'calendar',
          integrationId,
          status: 'completed',
          startTime: yesterday,
          endTime: yesterday,
          itemsProcessed: 15,
          itemsSucceeded: 15,
          itemsFailed: 0,
          createdAt: yesterday,
        },
        {
          id: '2',
          integrationType: 'calendar',
          integrationId,
          status: 'completed',
          startTime: now,
          endTime: now,
          itemsProcessed: 5,
          itemsSucceeded: 4,
          itemsFailed: 1,
          error: 'One event could not be synced due to permission issues',
          createdAt: now,
        },
      ];
      
      return mockSyncJobs;
    } catch (error) {
      return rejectWithValue('Failed to fetch sync jobs');
    }
  }
);

const integrationSlice = createSlice({
  name: 'integration',
  initialState,
  reducers: {
    setCurrentIntegration: (state, action: PayloadAction<Integration | null>) => {
      state.currentIntegration = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch integrations
      .addCase(fetchIntegrations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.integrations = action.payload;
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Connect integration
      .addCase(connectIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(connectIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.integrations.push(action.payload);
        state.currentIntegration = action.payload;
      })
      .addCase(connectIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Disconnect integration
      .addCase(disconnectIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disconnectIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        const integrationId = action.payload;
        const index = state.integrations.findIndex(i => i.id === integrationId);
        
        if (index !== -1) {
          state.integrations[index].status = 'disconnected';
          state.integrations[index].updatedAt = new Date().toISOString();
          
          // Update current integration if it matches
          if (state.currentIntegration && state.currentIntegration.id === integrationId) {
            state.currentIntegration = state.integrations[index];
          }
        }
      })
      .addCase(disconnectIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update integration
      .addCase(updateIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.integrations.findIndex(i => i.id === action.payload.id);
        
        if (index !== -1) {
          state.integrations[index] = action.payload;
          
          // Update current integration if it matches
          if (state.currentIntegration && state.currentIntegration.id === action.payload.id) {
            state.currentIntegration = action.payload;
          }
        }
      })
      .addCase(updateIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Sync integration
      .addCase(syncIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update integration
        const integrationIndex = state.integrations.findIndex(i => i.id === action.payload.integration.id);
        if (integrationIndex !== -1) {
          state.integrations[integrationIndex] = action.payload.integration;
          
          // Update current integration if it matches
          if (state.currentIntegration && state.currentIntegration.id === action.payload.integration.id) {
            state.currentIntegration = action.payload.integration;
          }
        }
        
        // Add sync job
        state.syncJobs.push(action.payload.syncJob);
      })
      .addCase(syncIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch sync jobs
      .addCase(fetchSyncJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSyncJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.syncJobs = action.payload;
      })
      .addCase(fetchSyncJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentIntegration,
  clearError,
} = integrationSlice.actions;

export default integrationSlice.reducer;