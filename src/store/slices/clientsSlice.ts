import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Client, Document, Note } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    searchTerm: string;
    type: 'individual' | 'organization' | null;
    kycStatus: boolean | null;
    conflictCheckStatus: 'pending' | 'cleared' | 'flagged' | null;
  };
}

const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null,
  filters: {
    searchTerm: '',
    type: null,
    kycStatus: null,
    conflictCheckStatus: null,
  },
};

// Mock API calls - would be replaced with actual API calls
export const fetchClients = createAsyncThunk('clients/fetchClients', async (filters?: Record<string, any>, { rejectWithValue }) => {
  try {
    // Import the client service to make the API call
    const { getAllClients } = await import('../../services/clientService');
    
    // Make the actual API call to get all clients with optional filters
    const clients = await getAllClients(filters);
    
    return clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    return rejectWithValue('Failed to fetch clients');
  }
});

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (clientId: string, { rejectWithValue }) => {
    try {
      // Import the client service to make the API call
      const { getClientById } = await import('../../services/clientService');
      
      // Make the actual API call to get the client
      const client = await getClientById(clientId);
      
      if (!client) {
        return rejectWithValue('Client not found');
      }
      
      return client;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      return rejectWithValue('Failed to fetch client details');
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData: Partial<Client>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newClient: Client = {
        id: uuidv4(),
        type: clientData.type || 'individual',
        firstName: clientData.firstName || '',
        lastName: clientData.lastName || '',
        organizationName: clientData.organizationName || '',
        contactInfo: clientData.contactInfo || {
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
        },
        cases: [],
        intakeDate: now,
        kycVerified: false,
        kycDocuments: [],
        conflictCheckStatus: 'pending',
        notes: [],
        createdAt: now,
        updatedAt: now,
      };
      
      return newClient;
    } catch (error) {
      return rejectWithValue('Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ clientId, clientData }: { clientId: string; clientData: Partial<Client> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { clients: ClientsState };
      const existingClient = state.clients.clients.find(c => c.id === clientId);
      
      if (!existingClient) {
        return rejectWithValue('Client not found');
      }
      
      const now = new Date().toISOString();
      const updatedClient: Client = {
        ...existingClient,
        ...clientData,
        updatedAt: now,
      };
      
      return updatedClient;
    } catch (error) {
      return rejectWithValue('Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return clientId;
    } catch (error) {
      return rejectWithValue('Failed to delete client');
    }
  }
);

export const addClientDocument = createAsyncThunk(
  'clients/addClientDocument',
  async ({ clientId, document }: { clientId: string; document: Document }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { clients: ClientsState };
      const existingClient = state.clients.clients.find(c => c.id === clientId);
      
      if (!existingClient) {
        return rejectWithValue('Client not found');
      }
      
      return { clientId, document };
    } catch (error) {
      return rejectWithValue('Failed to add document to client');
    }
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ClientsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addClientNote: (state, action: PayloadAction<{ clientId: string; note: Note }>) => {
      const { clientId, note } = action.payload;
      const clientIndex = state.clients.findIndex(c => c.id === clientId);
      
      if (clientIndex !== -1) {
        state.clients[clientIndex].notes.push(note);
        state.clients[clientIndex].updatedAt = new Date().toISOString();
        
        // Update current client if it's the one being modified
        if (state.currentClient && state.currentClient.id === clientId) {
          state.currentClient.notes.push(note);
          state.currentClient.updatedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch client by ID
      .addCase(fetchClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create client
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients.push(action.payload);
        state.currentClient = action.payload;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update client
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        state.currentClient = action.payload;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter(c => c.id !== action.payload);
        if (state.currentClient && state.currentClient.id === action.payload) {
          state.currentClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add client document
      .addCase(addClientDocument.fulfilled, (state, action) => {
        const { clientId, document } = action.payload;
        const clientIndex = state.clients.findIndex(c => c.id === clientId);
        
        if (clientIndex !== -1) {
          state.clients[clientIndex].kycDocuments.push(document);
          state.clients[clientIndex].updatedAt = new Date().toISOString();
          
          // Update current client if it's the one being modified
          if (state.currentClient && state.currentClient.id === clientId) {
            state.currentClient.kycDocuments.push(document);
            state.currentClient.updatedAt = new Date().toISOString();
          }
        }
      });
  },
});

export const { setCurrentClient, setFilters, clearFilters, addClientNote } = clientsSlice.actions;
export default clientsSlice.reducer;