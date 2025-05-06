import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService, User } from '../../services/userService';

// State interface
interface UserState {
  users: User[];
  currentUser: User | null;
  usersByRole: Record<string, User[]>;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  users: [],
  currentUser: null,
  usersByRole: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getAllUsers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await userService.getUserById(userId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const fetchUsersByRole = createAsyncThunk(
  'users/fetchByRole',
  async (role: string, { rejectWithValue }) => {
    try {
      const users = await userService.getUsersByRole(role);
      return { role, users };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      return await userService.createUser(userData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ userId, updateData }: { userId: string; updateData: Partial<User> }, { rejectWithValue }) => {
    try {
      return await userService.updateUser(userId, updateData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (userId: string, { rejectWithValue }) => {
    try {
      const success = await userService.deleteUser(userId);
      if (success) {
        return userId;
      }
      return rejectWithValue('Failed to delete user');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Create the slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearUserErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch users by role
      .addCase(fetchUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.loading = false;
        const { role, users } = action.payload;
        state.usersByRole[role] = users;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        
        // Update in users array
        const index = state.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
        
        // Update current user if it's the same
        if (state.currentUser && state.currentUser.id === updatedUser.id) {
          state.currentUser = updatedUser;
        }
        
        // Update in usersByRole
        Object.keys(state.usersByRole).forEach(role => {
          const roleIndex = state.usersByRole[role].findIndex(user => user.id === updatedUser.id);
          if (roleIndex !== -1) {
            state.usersByRole[role][roleIndex] = updatedUser;
          }
        });
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.payload;
        
        // Remove from users array
        state.users = state.users.filter(user => user.id !== userId);
        
        // Clear current user if it's the same
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser = null;
        }
        
        // Remove from usersByRole
        Object.keys(state.usersByRole).forEach(role => {
          state.usersByRole[role] = state.usersByRole[role].filter(user => user.id !== userId);
        });
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentUser, clearUserErrors } = userSlice.actions;
export default userSlice.reducer;