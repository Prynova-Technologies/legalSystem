import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CalendarEvent, EventType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface CalendarState {
  events: CalendarEvent[];
  currentEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    eventType: EventType | null;
    caseId: string | null;
    attendeeId: string | null;
    dateRange: { start: string | null; end: string | null };
    searchTerm: string;
  };
}

const initialState: CalendarState = {
  events: [],
  currentEvent: null,
  isLoading: false,
  error: null,
  filters: {
    eventType: null,
    caseId: null,
    attendeeId: null,
    dateRange: { start: null, end: null },
    searchTerm: '',
  },
};

// Mock API calls - would be replaced with actual API calls
export const fetchEvents = createAsyncThunk('calendar/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Set specific times
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(11, 30, 0, 0); // 11:30 AM
    
    nextWeek.setHours(14, 0, 0, 0); // 2:00 PM
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setHours(16, 0, 0, 0); // 4:00 PM
    
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Court Hearing - Smith vs. Johnson',
        description: 'Initial hearing for case Smith vs. Johnson',
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
        location: 'Superior Court of California, Courtroom 12B',
        eventType: EventType.COURT_HEARING,
        caseId: '1',
        attendees: ['1', '2', '3'],
        reminderTime: new Date(tomorrow.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour before
        createdBy: '1',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
      {
        id: '2',
        title: 'Client Meeting - Acme Corporation',
        description: 'Initial consultation with Acme Corporation',
        startTime: nextWeek.toISOString(),
        endTime: nextWeekEnd.toISOString(),
        location: 'Main Office, Conference Room A',
        eventType: EventType.CLIENT_MEETING,
        attendees: ['1', '4'],
        createdBy: '1',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
    ];
    
    return mockEvents;
  } catch (error) {
    return rejectWithValue('Failed to fetch calendar events');
  }
});

export const fetchEventById = createAsyncThunk(
  'calendar/fetchEventById',
  async (eventId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, we would make an API call here
      // For now, we'll just find the event in our state
      const state = getState() as { calendar: CalendarState };
      const foundEvent = state.calendar.events.find(e => e.id === eventId);
      
      if (!foundEvent) {
        return rejectWithValue('Event not found');
      }
      
      return foundEvent;
    } catch (error) {
      return rejectWithValue('Failed to fetch event details');
    }
  }
);

export const createEvent = createAsyncThunk(
  'calendar/createEvent',
  async (eventData: Partial<CalendarEvent>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newEvent: CalendarEvent = {
        id: uuidv4(),
        title: eventData.title || 'New Event',
        description: eventData.description || '',
        startTime: eventData.startTime || now,
        endTime: eventData.endTime || now,
        location: eventData.location,
        eventType: eventData.eventType || EventType.OTHER,
        caseId: eventData.caseId,
        attendees: eventData.attendees || [],
        reminderTime: eventData.reminderTime,
        createdBy: eventData.createdBy || '1', // Current user ID would be used here
        createdAt: now,
        updatedAt: now,
      };
      
      return newEvent;
    } catch (error) {
      return rejectWithValue('Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'calendar/updateEvent',
  async ({ eventId, eventData }: { eventId: string; eventData: Partial<CalendarEvent> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { calendar: CalendarState };
      const existingEvent = state.calendar.events.find(e => e.id === eventId);
      
      if (!existingEvent) {
        return rejectWithValue('Event not found');
      }
      
      const now = new Date().toISOString();
      const updatedEvent: CalendarEvent = {
        ...existingEvent,
        ...eventData,
        updatedAt: now,
      };
      
      return updatedEvent;
    } catch (error) {
      return rejectWithValue('Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'calendar/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return eventId;
    } catch (error) {
      return rejectWithValue('Failed to delete event');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<CalendarEvent | null>) => {
      state.currentEvent = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CalendarState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addAttendee: (state, action: PayloadAction<{ eventId: string; attendeeId: string }>) => {
      const { eventId, attendeeId } = action.payload;
      const eventIndex = state.events.findIndex(e => e.id === eventId);
      
      if (eventIndex !== -1 && !state.events[eventIndex].attendees.includes(attendeeId)) {
        state.events[eventIndex].attendees.push(attendeeId);
        state.events[eventIndex].updatedAt = new Date().toISOString();
        
        // Update current event if it's the one being modified
        if (state.currentEvent && state.currentEvent.id === eventId) {
          state.currentEvent.attendees.push(attendeeId);
          state.currentEvent.updatedAt = new Date().toISOString();
        }
      }
    },
    removeAttendee: (state, action: PayloadAction<{ eventId: string; attendeeId: string }>) => {
      const { eventId, attendeeId } = action.payload;
      const eventIndex = state.events.findIndex(e => e.id === eventId);
      
      if (eventIndex !== -1) {
        state.events[eventIndex].attendees = state.events[eventIndex].attendees.filter(a => a !== attendeeId);
        state.events[eventIndex].updatedAt = new Date().toISOString();
        
        // Update current event if it's the one being modified
        if (state.currentEvent && state.currentEvent.id === eventId) {
          state.currentEvent.attendees = state.currentEvent.attendees.filter(a => a !== attendeeId);
          state.currentEvent.updatedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.push(action.payload);
        state.currentEvent = action.payload;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        state.currentEvent = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = state.events.filter(e => e.id !== action.payload);
        if (state.currentEvent && state.currentEvent.id === action.payload) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentEvent, setFilters, clearFilters, addAttendee, removeAttendee } = calendarSlice.actions;
export default calendarSlice.reducer;