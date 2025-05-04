/**
 * Document Service
 * Handles all API interactions related to documents
 */

import { API_ENDPOINTS } from '../utils/apiConfig';
import { DocumentType } from '../types';

/**
 * Document interface
 */
export interface Document {
  _id?: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  client?: string;
  case?: string;
  tags?: string[];
  versions: {
    version: number;
    fileName: string;
    filePath: string;
    uploadedBy: string;
    uploadedAt: Date;
    notes?: string;
  }[];
  currentVersion: number;
  createdBy: string;
  isTemplate: boolean;
  isDeleted: boolean;
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
 * Fetch all documents
 */
export const fetchAllDocuments = async (): Promise<Document[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.DOCUMENTS.BASE, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

/**
 * Fetch documents by client ID
 */
export const fetchDocumentsByClientId = async (clientId: string): Promise<Document[]> => {
  try {
    const response = await fetch(`${API_ENDPOINTS.DOCUMENTS.BASE}?client=${clientId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch client documents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching client documents:', error);
    throw error;
  }
};

/**
 * Fetch document by ID
 */
export const fetchDocumentById = async (documentId: string): Promise<Document> => {
  try {
    const response = await fetch(API_ENDPOINTS.DOCUMENTS.DETAIL(documentId), {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

/**
 * Create a new document
 */
export const createDocument = async (documentData: Partial<Document>): Promise<Document> => {
  try {
    const response = await fetch(API_ENDPOINTS.DOCUMENTS.BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create document');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async (documentId: string, documentData: Partial<Document>): Promise<Document> => {
  try {
    const response = await fetch(API_ENDPOINTS.DOCUMENTS.DETAIL(documentId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      throw new Error('Failed to update document');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const response = await fetch(API_ENDPOINTS.DOCUMENTS.DETAIL(documentId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};