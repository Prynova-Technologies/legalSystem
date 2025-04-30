import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import casesReducer from './slices/casesSlice';
import clientsReducer from './slices/clientsSlice';
import documentsReducer from './slices/documentsSlice';
import tasksReducer from './slices/tasksSlice';
import calendarReducer from './slices/calendarSlice';
import billingReducer from './slices/billingSlice';
import reportingReducer from './slices/reportingSlice';
import communicationsReducer from './slices/communicationsSlice';
import securityReducer from './slices/securitySlice';
import integrationReducer from './slices/integrationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cases: casesReducer,
    clients: clientsReducer,
    documents: documentsReducer,
    tasks: tasksReducer,
    calendar: calendarReducer,
    billing: billingReducer,
    reporting: reportingReducer,
    communications: communicationsReducer,
    security: securityReducer,
    integration: integrationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;