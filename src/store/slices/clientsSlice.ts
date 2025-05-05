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

// Fetch clients from the API
export const fetchClients = createAsyncThunk('clients/fetchClients', async (filters?: Record<string, any>, { rejectWithValue }) => {
  try {
    // Import the client service to make the API call
    const { getAllClients } = await import('../../services/clientService');
    
    // Make the actual API call to get all clients with optional filters
    const clients = await getAllClients(filters);
    
    // Map API response to our Client type if needed
    const mappedClients = Array.isArray(clients) ? clients.map(client => ({
      id: client._id,
      type: client.clientType || 'individual',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      organizationName: client.company || '',
      contactInfo: client.contacts || {
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
      cases: client.cases || [],
      intakeDate: client.intakeDate || client.createdAt,
      kycVerified: client.kycVerified,
      kycDocuments: client.documents || [],
      conflictCheckStatus: client.conflictCheckCompleted ? 'cleared' : 'flagged',
      notes: client.notes || [],
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    })) : [];
    
    return mappedClients;
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
      
      // Map API response to our Client type
      const mappedClient: Client = {
        id: client._id,
        type: client.type || 'individual',
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        organizationName: client.company || '',
        contactInfo: client.contactInfo || {
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
        cases: client.cases || [],
        intakeDate: client.intakeDate || client.createdAt || new Date().toISOString(),
        kycVerified: client.kycVerified || false,
        kycDocuments: client.kycDocuments || [],
        conflictCheckStatus: client.conflictCheckCompleted ? 'cleared' : 'flagged',
        notes: client.notes || [],
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: client.updatedAt || new Date().toISOString(),
      };
      
      return mappedClient;
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
      // Import the client service to make the API call
      const { createClient: createClientService } = await import('../../services/clientService');
      
      // Make the actual API call to create the client
      const newClient = await createClientService(clientData);
      
      // Map the API response to our Client type if needed
      const mappedClient: Client = {
        id: newClient.id,
        type: newClient.clientType,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        organizationName: newClient.company,
        contactInfo: newClient.contacts || {
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
        intakeDate: newClient.createdAt,
        kycVerified: false,
        kycDocuments: [],
        conflictCheckStatus: newClient.conflictCheckCompleted ? 'cleared' : 'flagged',
        notes: [],
        createdAt: newClient.createdAt,
        updatedAt: newClient.updatedAt,
      };
      
      return mappedClient;
    } catch (error) {
      console.error('Error creating client:', error);
      return rejectWithValue('Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ clientId, clientData }: { clientId: string; clientData: Partial<Client> }, { rejectWithValue, getState }) => {
    try {
      // Import the client service to make the API call
      const { updateClient: updateClientService } = await import('../../services/clientService');
      
      // Make the actual API call to update the client
      const updatedClientResponse = await updateClientService(clientId, clientData);
      
      // Get the existing client from state to merge with the response
      const state = getState() as { clients: ClientsState };
      const existingClient = state.clients.clients.find(c => c.id === clientId);
      
      if (!existingClient) {
        return rejectWithValue('Client not found');
      }
      
      // Map the API response to our Client type
      const updatedClient: Client = {
        ...existingClient,
        ...clientData,
        updatedAt: updatedClientResponse.updatedAt || new Date().toISOString(),
        conflictCheckStatus: updatedClientResponse.conflictCheckCompleted ? 'cleared' : 'flagged',
      };
      
      return updatedClient;
    } catch (error) {
      console.error(`Error updating client ${clientId}:`, error);
      return rejectWithValue('Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      // Import the client service to make the API call
      const { deleteClient: deleteClientService } = await import('../../services/clientService');
      
      // Make the actual API call to delete the client
      await deleteClientService(clientId);
      
      return clientId;
    } catch (error) {
      console.error(`Error deleting client ${clientId}:`, error);
      return rejectWithValue('Failed to delete client');
    }
  }
);

export const addClientDocument = createAsyncThunk(
  'clients/addClientDocument',
  async ({ clientId, document }: { clientId: string; document: Document }, { rejectWithValue, getState }) => {
    try {
      // Import the client service to make the API call
      const { updateClient: updateClientService } = await import('../../services/clientService');
      
      const state = getState() as { clients: ClientsState };
      const existingClient = state.clients.clients.find(c => c.id === clientId);
      
      if (!existingClient) {
        return rejectWithValue('Client not found');
      }
      
      // Add the document to the client's kycDocuments array
      const updatedClient = await updateClientService(clientId, {
        kycDocuments: [...(existingClient.kycDocuments || []), document]
      });
      
      // Return the clientId and document for the reducer to use
      return { clientId, document };
    } catch (error) {
      console.error(`Error adding document to client ${clientId}:`, error);
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
        // Ensure we're setting the clients array with the payload
        // If payload is empty or undefined, set to empty array
        state.clients = action.payload || [];
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