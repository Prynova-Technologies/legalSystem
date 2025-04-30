import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

interface Message {
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

interface Notification {
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

interface CommunicationPreference {
  clientId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  preferredContactMethod: 'email' | 'phone' | 'both';
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  updatedAt: string;
}

interface CommunicationsState {
  messages: Message[];
  notifications: Notification[];
  communicationPreferences: CommunicationPreference[];
  currentMessage: Message | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    messageType: 'email' | 'sms' | 'internal_note' | null;
    clientId: string | null;
    caseId: string | null;
    dateRange: { start: string | null; end: string | null };
    searchTerm: string;
  };
}

const initialState: CommunicationsState = {
  messages: [],
  notifications: [],
  communicationPreferences: [],
  currentMessage: null,
  isLoading: false,
  error: null,
  filters: {
    messageType: null,
    clientId: null,
    caseId: null,
    dateRange: { start: null, end: null },
    searchTerm: '',
  },
};

// Messages
export const fetchMessages = createAsyncThunk('communications/fetchMessages', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const mockMessages: Message[] = [
      {
        id: '1',
        type: 'email',
        subject: 'Case Update - Smith vs. Johnson',
        content: 'Dear Mr. Smith, We have filed the initial complaint...',
        sender: '1',
        recipients: ['client@example.com'],
        caseId: '1',
        clientId: '1',
        status: 'sent',
        sentAt: new Date().toISOString(),
        readBy: ['1'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    return mockMessages;
  } catch (error) {
    return rejectWithValue('Failed to fetch messages');
  }
});

export const createMessage = createAsyncThunk(
  'communications/createMessage',
  async (messageData: Partial<Message>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newMessage: Message = {
        id: uuidv4(),
        type: messageData.type || 'email',
        subject: messageData.subject,
        content: messageData.content || '',
        sender: messageData.sender || '',
        recipients: messageData.recipients || [],
        caseId: messageData.caseId,
        clientId: messageData.clientId || '',
        attachments: messageData.attachments,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      
      return newMessage;
    } catch (error) {
      return rejectWithValue('Failed to create message');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'communications/sendMessage',
  async (messageId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { communications: CommunicationsState };
      const message = state.communications.messages.find(m => m.id === messageId);
      
      if (!message) {
        return rejectWithValue('Message not found');
      }
      
      const now = new Date().toISOString();
      const sentMessage: Message = {
        ...message,
        status: 'sent',
        sentAt: now,
        updatedAt: now,
      };
      
      return sentMessage;
    } catch (error) {
      return rejectWithValue('Failed to send message');
    }
  }
);

// Notifications
export const createNotification = createAsyncThunk(
  'communications/createNotification',
  async (notificationData: Partial<Notification>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newNotification: Notification = {
        id: uuidv4(),
        type: notificationData.type || 'system',
        title: notificationData.title || '',
        message: notificationData.message || '',
        priority: notificationData.priority || 'medium',
        recipientId: notificationData.recipientId || '',
        caseId: notificationData.caseId,
        clientId: notificationData.clientId,
        read: false,
        actionRequired: notificationData.actionRequired || false,
        actionUrl: notificationData.actionUrl,
        createdAt: now,
      };
      
      return newNotification;
    } catch (error) {
      return rejectWithValue('Failed to create notification');
    }
  }
);

// Communication Preferences
export const updateCommunicationPreferences = createAsyncThunk(
  'communications/updateCommunicationPreferences',
  async ({ clientId, preferences }: { clientId: string; preferences: Partial<CommunicationPreference> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { communications: CommunicationsState };
      const existingPreferences = state.communications.communicationPreferences.find(p => p.clientId === clientId);
      
      const now = new Date().toISOString();
      const updatedPreferences: CommunicationPreference = {
        clientId,
        emailEnabled: preferences.emailEnabled ?? existingPreferences?.emailEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? existingPreferences?.smsEnabled ?? false,
        preferredContactMethod: preferences.preferredContactMethod ?? existingPreferences?.preferredContactMethod ?? 'email',
        emailFrequency: preferences.emailFrequency ?? existingPreferences?.emailFrequency ?? 'immediate',
        doNotDisturbStart: preferences.doNotDisturbStart ?? existingPreferences?.doNotDisturbStart,
        doNotDisturbEnd: preferences.doNotDisturbEnd ?? existingPreferences?.doNotDisturbEnd,
        updatedAt: now,
      };
      
      return updatedPreferences;
    } catch (error) {
      return rejectWithValue('Failed to update communication preferences');
    }
  }
);

const communicationsSlice = createSlice({
  name: 'communications',
  initialState,
  reducers: {
    setCurrentMessage: (state, action: PayloadAction<Message | null>) => {
      state.currentMessage = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CommunicationsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create message
      .addCase(createMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push(action.payload);
        state.currentMessage = action.payload;
      })
      .addCase(createMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.messages.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
        state.currentMessage = action.payload;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create notification
      .addCase(createNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications.push(action.payload);
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update communication preferences
      .addCase(updateCommunicationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCommunicationPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.communicationPreferences.findIndex(p => p.clientId === action.payload.clientId);
        if (index !== -1) {
          state.communicationPreferences[index] = action.payload;
        } else {
          state.communicationPreferences.push(action.payload);
        }
      })
      .addCase(updateCommunicationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentMessage, 
  setFilters, 
  clearFilters,
  markNotificationAsRead 
} = communicationsSlice.actions;

export default communicationsSlice.reducer;