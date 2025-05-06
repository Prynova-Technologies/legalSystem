import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

// User interface based on backend model
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper function to get the authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Helper function to create axios instance with authentication headers
 */
const createAuthAxios = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add auth token to requests if available
  const token = getAuthToken();
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return instance;
};

// User service for handling API calls
export const userService = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.get(`/users`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<User> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.get(`/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.post(`/users`, userData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update a user
   */
  updateUser: async (userId: string, updateData: Partial<User>): Promise<User> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.put(`/users/${userId}`, updateData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.delete(`/users/${userId}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (role: string): Promise<User[]> => {
    try {
      const axiosAuth = createAuthAxios();
      const response = await axiosAuth.get(`/users/role/${role}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  }
};