import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import authService from '../../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

// Real login function using authService
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Validate inputs
      if (!email || !password) {
        return rejectWithValue('Email and password are required');
      }
      
      const response = await authService.login(email, password);
      
      // Ensure we have both user data and token
      if (!response.user || !response.token) {
        return rejectWithValue('Invalid response from server');
      }
      
      return { user: response.user, token: response.token };
    } catch (error: any) {
      // Handle error message from authService
      return rejectWithValue(
        error.message || 'Login failed. Please try again.'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

// Thunk to get current user profile
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await authService.getCurrentUser();
      return { user: userData };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user profile.'
      );
    }
  }
);

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;