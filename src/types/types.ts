// Type definitions for the application

// User type definition
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Add other type definitions as needed