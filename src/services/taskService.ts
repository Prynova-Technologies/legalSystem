import { Task } from '../types';
import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * Service for handling task-related API requests
 * All requests include the user's authentication token
 */
export const taskService = {
  /**
   * Get all tasks with optional filters
   * @param token User authentication token
   * @param filters Optional filters for tasks
   */
  getAllTasks: async (token: string, filters: Record<string, any> = {}) => {
    try {
      let url = API_ENDPOINTS.TASKS.BASE;
      
      // Add query parameters if filters are provided
      if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            queryParams.append(key, String(value));
          }
        });
        url = `${url}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },
  
  /**
   * Get a single task by ID
   * @param token User authentication token
   * @param taskId ID of the task to fetch
   */
  getTaskById: async (token: string, taskId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASKS.DETAIL(taskId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task details: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching task details:', error);
      throw error;
    }
  },
  
  /**
   * Create a new task
   * @param token User authentication token
   * @param taskData Task data to create
   */
  createTask: async (token: string, taskData: Partial<Task>) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASKS.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing task
   * @param token User authentication token
   * @param taskId ID of the task to update
   * @param taskData Updated task data
   */
  updateTask: async (token: string, taskId: string, taskData: Partial<Task>) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASKS.DETAIL(taskId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  /**
   * Delete a task
   * @param token User authentication token
   * @param taskId ID of the task to delete
   */
  deleteTask: async (token: string, taskId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.TASKS.DETAIL(taskId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
  
  /**
   * Get overdue tasks
   * @param token User authentication token
   */
  getOverdueTasks: async (token: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TASKS.BASE}/overdue`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch overdue tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      throw error;
    }
  },
  
  /**
   * Get tasks for a specific user
   * @param token User authentication token
   * @param userId ID of the user to fetch tasks for
   */
  getTasksByUser: async (token: string, userId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TASKS.BASE}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  },
  
  /**
   * Get tasks for a specific case
   * @param token User authentication token
   * @param caseId ID of the case to fetch tasks for
   */
  getTasksByCase: async (token: string, caseId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TASKS.BASE}/case/${caseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch case tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching case tasks:', error);
      throw error;
    }
  }
};

// Legacy functions for backward compatibility
export const fetchAllTasks = async (filters = {}) => {
  const token = localStorage.getItem('token') || '';
  return taskService.getAllTasks(token, filters);
};

export const fetchTaskById = async (taskId: string) => {
  const token = localStorage.getItem('token') || '';
  return taskService.getTaskById(token, taskId);
};

export const createTask = async (taskData: Partial<Task>) => {
  const token = localStorage.getItem('token') || '';
  return taskService.createTask(token, taskData);
};

export const updateTask = async (taskId: string, taskData: Partial<Task>) => {
  const token = localStorage.getItem('token') || '';
  return taskService.updateTask(token, taskId, taskData);
};

export const deleteTask = async (taskId: string) => {
  const token = localStorage.getItem('token') || '';
  return taskService.deleteTask(token, taskId);
};

export const fetchOverdueTasks = async () => {
  const token = localStorage.getItem('token') || '';
  return taskService.getOverdueTasks(token);
};

export const fetchTasksByUser = async (userId: string) => {
  const token = localStorage.getItem('token') || '';
  return taskService.getTasksByUser(token, userId);
};

export const fetchTasksByCase = async (caseId: string) => {
  const token = localStorage.getItem('token') || '';
  return taskService.getTasksByCase(token, caseId);
};