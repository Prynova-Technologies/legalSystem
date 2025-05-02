import axios from 'axios';
import { User } from '../types';

// Update API URL to match the backend server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config: axios.InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: axios.AxiosError) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response: axios.AxiosResponse) => response,
  async (error: axios.AxiosError) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Here you would typically refresh the token
      // For now, just clear the token and let the app handle redirection
      // using React Router instead of direct page reload
      localStorage.removeItem('token');
      
      // Don't use window.location.href as it causes a full page reload
      // The auth state change will trigger redirection via React Router in the components
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  // Login user
  login: async (email: string, password: string) => {
    try {
      // Make API call to backend authentication endpoint
      const response = await api.post('/auth/login', { email, password });
      
      // Validate response - ensure we have a token
      if (!response.data || !response.data.token) {
        console.log(response)
        throw new Error('Invalid response from server. Authentication failed.');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const message = error.response.data?.message || 'Invalid credentials';
        throw new Error(message);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token even if API call fails
      localStorage.removeItem('token');
    }
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // You could add JWT token validation here
    // For example, check if token is expired by decoding it
    // This is a simple implementation for now
    return true;
  },
};

export default authService;
export { api }; // Export the configured axios instance for other API calls