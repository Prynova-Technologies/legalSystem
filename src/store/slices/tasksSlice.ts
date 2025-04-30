import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: 'not_started' | 'in_progress' | 'completed' | 'deferred' | null;
    priority: 'low' | 'medium' | 'high' | 'urgent' | null;
    assignedTo: string | null;
    caseId: string | null;
    searchTerm: string;
    dueDate: 'today' | 'this_week' | 'overdue' | 'upcoming' | null;
  };
}

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {
    status: null,
    priority: null,
    assignedTo: null,
    caseId: null,
    searchTerm: '',
    dueDate: null,
  },
};

// Mock API calls - would be replaced with actual API calls
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Prepare initial complaint',
        description: 'Draft the initial complaint for Smith vs. Johnson case',
        caseId: '1',
        assignedTo: '2',
        dueDate: tomorrow.toISOString(),
        priority: 'high',
        status: 'in_progress',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
      {
        id: '2',
        title: 'Client intake meeting',
        description: 'Conduct initial client intake meeting with Acme Corporation',
        assignedTo: '1',
        dueDate: nextWeek.toISOString(),
        priority: 'medium',
        status: 'not_started',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      },
    ];
    
    return mockTasks;
  } catch (error) {
    return rejectWithValue('Failed to fetch tasks');
  }
});

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (taskId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, we would make an API call here
      // For now, we'll just find the task in our state
      const state = getState() as { tasks: TasksState };
      const foundTask = state.tasks.tasks.find(t => t.id === taskId);
      
      if (!foundTask) {
        return rejectWithValue('Task not found');
      }
      
      return foundTask;
    } catch (error) {
      return rejectWithValue('Failed to fetch task details');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      const newTask: Task = {
        id: uuidv4(),
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        caseId: taskData.caseId,
        assignedTo: taskData.assignedTo || '',
        dueDate: taskData.dueDate || now,
        priority: taskData.priority || 'medium',
        status: 'not_started',
        createdAt: now,
        updatedAt: now,
      };
      
      return newTask;
    } catch (error) {
      return rejectWithValue('Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, taskData }: { taskId: string; taskData: Partial<Task> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { tasks: TasksState };
      const existingTask = state.tasks.tasks.find(t => t.id === taskId);
      
      if (!existingTask) {
        return rejectWithValue('Task not found');
      }
      
      const now = new Date().toISOString();
      const updatedTask: Task = {
        ...existingTask,
        ...taskData,
        updatedAt: now,
        // If status is being changed to completed, set completedAt
        completedAt: taskData.status === 'completed' ? now : existingTask.completedAt,
      };
      
      return updatedTask;
    } catch (error) {
      return rejectWithValue('Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return taskId;
    } catch (error) {
      return rejectWithValue('Failed to delete task');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    markTaskComplete: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const taskIndex = state.tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex !== -1) {
        const now = new Date().toISOString();
        state.tasks[taskIndex].status = 'completed';
        state.tasks[taskIndex].completedAt = now;
        state.tasks[taskIndex].updatedAt = now;
        
        // Update current task if it's the one being modified
        if (state.currentTask && state.currentTask.id === taskId) {
          state.currentTask.status = 'completed';
          state.currentTask.completedAt = now;
          state.currentTask.updatedAt = now;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch task by ID
      .addCase(fetchTaskById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
        state.currentTask = action.payload;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.currentTask = action.payload;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        if (state.currentTask && state.currentTask.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTask, setFilters, clearFilters, markTaskComplete } = tasksSlice.actions;
export default tasksSlice.reducer;