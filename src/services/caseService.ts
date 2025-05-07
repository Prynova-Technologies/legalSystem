import { Case, CaseStatus, CaseType } from '../types';
import { API_ENDPOINTS } from '../utils/apiConfig';

/**
 * Service for handling case-related API requests
 * All requests include the user's authentication token
 */
export const caseService = {
  /**
   * Get all cases with optional filters
   * @param token User authentication token
   * @param filters Optional filters for cases
   */
  getAllCases: async (token: string, filters?: Record<string, any>) => {
    try {
      let url = API_ENDPOINTS.CASES.BASE;
      
      // Add query parameters if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
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
        throw new Error(`Failed to fetch cases: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  },
  
  /**
   * Get a case by ID
   * @param token User authentication token
   * @param caseId Case ID
   */
  getCaseById: async (token: string, caseId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.DETAIL(caseId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch case: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching case ${caseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new case
   * @param token User authentication token
   * @param caseData Case data to create
   */
  createCase: async (token: string, caseData: Partial<Case>) => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(caseData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create case: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing case
   * @param token User authentication token
   * @param caseId Case ID
   * @param caseData Updated case data
   */
  updateCase: async (token: string, caseId: string, caseData: Partial<Case>) => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.DETAIL(caseId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(caseData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update case: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating case ${caseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a case
   * @param token User authentication token
   * @param caseId Case ID
   */
  deleteCase: async (token: string, caseId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.CASES.DETAIL(caseId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete case: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting case ${caseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a party to a case
   * @param token User authentication token
   * @param caseId Case ID
   * @param partyData Party data
   */
  addCaseParty: async (token: string, caseId: string, partyData: any) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CASES.DETAIL(caseId)}/parties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(partyData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add case party: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error adding party to case ${caseId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get case statistics
   * @param token User authentication token
   */
  getCaseStatistics: async (token: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CASES.BASE}/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch case statistics: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching case statistics:', error);
      throw error;
    }
  }
};

export default caseService;