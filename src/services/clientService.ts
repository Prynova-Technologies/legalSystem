/**
 * Client Service
 * Handles all API interactions related to clients
 */

import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * Client interface
 */
export interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contacts?: Contact[];
  notes?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Contact interface
 */
export interface Contact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

/**
 * Client statistics interface
 */
export interface ClientStatistics {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
}

/**
 * Helper function to get the authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Helper function to create headers with authentication token
 */
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Helper function to handle API requests with authentication
 */
const fetchWithAuth = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    // Ensure headers are set with auth token
    const headers = createAuthHeaders();
    
    // Merge provided options with auth headers
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    };
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        localStorage.removeItem('token');
        // Let the app handle redirection via React Router
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
};

/**
 * Fetches all clients with optional filtering
 */
export const getAllClients = async (filters?: Record<string, any>): Promise<Client[]> => {
  try {
    let url = API_ENDPOINTS.CLIENTS.BASE;
    
    // Add query parameters for filters if provided
    if (filters && Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    const clients = await fetchWithAuth<Client[]>(url);
    
    // Ensure we always return an array, even if the API returns null or undefined
    return Array.isArray(clients) ? clients : [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Creates a new client
 */
export const createClient = async (clientData: Partial<Client>): Promise<Client> => {
  try {
    return await fetchWithAuth<Client>(API_ENDPOINTS.CLIENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

/**
 * Gets a client by ID
 */
export const getClientById = async (clientId: string): Promise<Client> => {
  try {
    const client = await fetchWithAuth<Client>(API_ENDPOINTS.CLIENTS.DETAIL(clientId));
    
    // Ensure we have a valid client object before returning
    if (!client || typeof client !== 'object') {
      throw new Error(`Client with ID ${clientId} not found or invalid response format`);
    }
    
    return client;
  } catch (error) {
    console.error(`Error fetching client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing client
 */
export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client> => {
  try {
    return await fetchWithAuth<Client>(API_ENDPOINTS.CLIENTS.DETAIL(clientId), {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  } catch (error) {
    console.error(`Error updating client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Deletes a client
 */
export const deleteClient = async (clientId: string): Promise<Client> => {
  try {
    return await fetchWithAuth<Client>(API_ENDPOINTS.CLIENTS.DETAIL(clientId), {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Adds a contact to a client
 */
export const addClientContact = async (clientId: string, contactData: Contact): Promise<Client> => {
  try {
    return await fetchWithAuth<Client>(`${API_ENDPOINTS.CLIENTS.DETAIL(clientId)}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  } catch (error) {
    console.error(`Error adding contact to client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Interface for case data
 */
export interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  clientId: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Gets cases for a specific client
 */
export const getClientCases = async (clientId: string): Promise<Case[]> => {
  try {
    return await fetchWithAuth<Case[]>(`${API_ENDPOINTS.CLIENTS.DETAIL(clientId)}/cases`);
  } catch (error) {
    console.error(`Error fetching cases for client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Gets client statistics
 */
export const getClientStatistics = async (): Promise<ClientStatistics> => {
  try {
    return await fetchWithAuth<ClientStatistics>(`${API_ENDPOINTS.CLIENTS.BASE}/statistics`);
  } catch (error) {
    console.error('Error fetching client statistics:', error);
    throw error;
  }
};