/**
 * Communications Service
 * Handles all API interactions related to messages, notifications, and communication preferences
 */

import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * Message interface
 */
export interface Message {
  id: string;
  type: 'email' | 'sms' | 'internal_note';
  subject?: string;
  content: string;
  sender: string;
  recipients: string[];
  caseId?: string;
  clientId: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  readBy?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: 'case_update' | 'deadline' | 'document' | 'billing' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  recipientId: string;
  caseId?: string;
  clientId?: string;
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Communication Preference interface
 */
export interface CommunicationPreference {
  clientId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferredContactMethod: 'email' | 'phone' | 'both';
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  updatedAt: string;
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
 * Fetch all messages with optional filters
 */
export const fetchMessages = async (filters?: {
  messageType?: string;
  clientId?: string;
  caseId?: string;
  dateRange?: { start: string | null; end: string | null };
  searchTerm?: string;
}): Promise<Message[]> => {
  try {
    let url = API_ENDPOINTS.COMMUNICATIONS.MESSAGES;
    
    // Add query parameters for filters
    if (filters) {
      const queryParams = new URLSearchParams();
      
      if (filters.messageType) queryParams.append('type', filters.messageType);
      if (filters.clientId) queryParams.append('client', filters.clientId);
      if (filters.caseId) queryParams.append('case', filters.caseId);
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      if (filters.dateRange?.start) queryParams.append('sentAfter', filters.dateRange.start);
      if (filters.dateRange?.end) queryParams.append('sentBefore', filters.dateRange.end);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    return await fetchWithAuth<Message[]>(url);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Create a new message
 */
export const createMessage = async (messageData: Partial<Message>): Promise<Message> => {
  try {
    return await fetchWithAuth<Message>(API_ENDPOINTS.COMMUNICATIONS.MESSAGES, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (messageId: string): Promise<Message> => {
  try {
    return await fetchWithAuth<Message>(`${API_ENDPOINTS.COMMUNICATIONS.MESSAGES}/${messageId}/send`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get message by ID
 */
export const getMessageById = async (messageId: string): Promise<Message> => {
  try {
    return await fetchWithAuth<Message>(`${API_ENDPOINTS.COMMUNICATIONS.MESSAGES}/${messageId}`);
  } catch (error) {
    console.error(`Error fetching message ${messageId}:`, error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await fetchWithAuth<void>(`${API_ENDPOINTS.COMMUNICATIONS.MESSAGES}/${messageId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Error deleting message ${messageId}:`, error);
    throw error;
  }
};

/**
 * Create a notification
 */
export const createNotification = async (notificationData: Partial<Notification>): Promise<Notification> => {
  try {
    return await fetchWithAuth<Notification>(API_ENDPOINTS.COMMUNICATIONS.NOTIFICATIONS, {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    return await fetchWithAuth<Notification>(`${API_ENDPOINTS.COMMUNICATIONS.NOTIFICATIONS}/${notificationId}/read`, {
      method: 'PATCH'
    });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Get all notifications for the current user
 */
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    return await fetchWithAuth<Notification[]>(API_ENDPOINTS.COMMUNICATIONS.NOTIFICATIONS);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get communication preferences for a client
 */
export const getCommunicationPreferences = async (clientId: string): Promise<CommunicationPreference> => {
  try {
    return await fetchWithAuth<CommunicationPreference>(`${API_ENDPOINTS.COMMUNICATIONS.PREFERENCES}/${clientId}`);
  } catch (error) {
    console.error(`Error fetching communication preferences for client ${clientId}:`, error);
    throw error;
  }
};

/**
 * Update communication preferences for a client
 */
export const updateCommunicationPreferences = async (
  clientId: string,
  preferences: Partial<CommunicationPreference>
): Promise<CommunicationPreference> => {
  try {
    return await fetchWithAuth<CommunicationPreference>(`${API_ENDPOINTS.COMMUNICATIONS.PREFERENCES}/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  } catch (error) {
    console.error(`Error updating communication preferences for client ${clientId}:`, error);
    throw error;
  }
};

// Export all functions as a service object
const commsService = {
  fetchMessages,
  createMessage,
  sendMessage,
  getMessageById,
  deleteMessage,
  createNotification,
  markNotificationAsRead,
  fetchNotifications,
  getCommunicationPreferences,
  updateCommunicationPreferences
};

export default commsService;