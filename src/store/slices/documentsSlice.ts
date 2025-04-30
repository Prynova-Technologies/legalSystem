import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Document, DocumentCategory } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface DocumentsState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    category: DocumentCategory | null;
    caseId: string | null;
    clientId: string | null;
    searchTerm: string;
    tags: string[];
  };
}

const initialState: DocumentsState = {
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,
  filters: {
    category: null,
    caseId: null,
    clientId: null,
    searchTerm: '',
    tags: [],
  },
};

// Mock API calls - would be replaced with actual API calls
export const fetchDocuments = createAsyncThunk('documents/fetchDocuments', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Complaint.pdf',
        description: 'Initial complaint filing',
        fileType: 'application/pdf',
        size: 1024 * 1024 * 2, // 2MB
        url: 'https://example.com/documents/complaint.pdf',
        caseId: '1',
        tags: ['complaint', 'filing'],
        category: DocumentCategory.PLEADING,
        version: 1,
        uploadedBy: '1',
        uploadedAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Client ID.pdf',
        description: 'Client identification document',
        fileType: 'application/pdf',
        size: 1024 * 1024, // 1MB
        url: 'https://example.com/documents/client-id.pdf',
        clientId: '1',
        tags: ['identification', 'kyc'],
        category: DocumentCategory.KYC,
        version: 1,
        uploadedBy: '1',
        uploadedAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
      },
    ];
    
    return mockDocuments;
  } catch (error) {
    return rejectWithValue('Failed to fetch documents');
  }
});

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchDocumentById',
  async (documentId: string, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, we would make an API call here
      // For now, we'll just find the document in our state
      const state = getState() as { documents: DocumentsState };
      const foundDocument = state.documents.documents.find(d => d.id === documentId);
      
      if (!foundDocument) {
        return rejectWithValue('Document not found');
      }
      
      return foundDocument;
    } catch (error) {
      return rejectWithValue('Failed to fetch document details');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async (documentData: Partial<Document>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const now = new Date().toISOString();
      const newDocument: Document = {
        id: uuidv4(),
        name: documentData.name || 'Untitled Document',
        description: documentData.description || '',
        fileType: documentData.fileType || 'application/pdf',
        size: documentData.size || 0,
        url: documentData.url || `https://example.com/documents/${uuidv4()}`,
        caseId: documentData.caseId,
        clientId: documentData.clientId,
        tags: documentData.tags || [],
        category: documentData.category || DocumentCategory.OTHER,
        version: 1,
        uploadedBy: documentData.uploadedBy || '1', // Current user ID would be used here
        uploadedAt: now,
        lastModifiedAt: now,
      };
      
      return newDocument;
    } catch (error) {
      return rejectWithValue('Failed to upload document');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ documentId, documentData }: { documentId: string; documentData: Partial<Document> }, { rejectWithValue, getState }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = getState() as { documents: DocumentsState };
      const existingDocument = state.documents.documents.find(d => d.id === documentId);
      
      if (!existingDocument) {
        return rejectWithValue('Document not found');
      }
      
      const now = new Date().toISOString();
      const updatedDocument: Document = {
        ...existingDocument,
        ...documentData,
        version: existingDocument.version + 1,
        previousVersions: existingDocument.previousVersions 
          ? [...existingDocument.previousVersions, existingDocument.url]
          : [existingDocument.url],
        lastModifiedAt: now,
      };
      
      return updatedDocument;
    } catch (error) {
      return rejectWithValue('Failed to update document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return documentId;
    } catch (error) {
      return rejectWithValue('Failed to delete document');
    }
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
      state.currentDocument = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<DocumentsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addTag: (state, action: PayloadAction<{ documentId: string; tag: string }>) => {
      const { documentId, tag } = action.payload;
      const documentIndex = state.documents.findIndex(d => d.id === documentId);
      
      if (documentIndex !== -1 && !state.documents[documentIndex].tags.includes(tag)) {
        state.documents[documentIndex].tags.push(tag);
        state.documents[documentIndex].lastModifiedAt = new Date().toISOString();
        
        // Update current document if it's the one being modified
        if (state.currentDocument && state.currentDocument.id === documentId) {
          state.currentDocument.tags.push(tag);
          state.currentDocument.lastModifiedAt = new Date().toISOString();
        }
      }
    },
    removeTag: (state, action: PayloadAction<{ documentId: string; tag: string }>) => {
      const { documentId, tag } = action.payload;
      const documentIndex = state.documents.findIndex(d => d.id === documentId);
      
      if (documentIndex !== -1) {
        state.documents[documentIndex].tags = state.documents[documentIndex].tags.filter(t => t !== tag);
        state.documents[documentIndex].lastModifiedAt = new Date().toISOString();
        
        // Update current document if it's the one being modified
        if (state.currentDocument && state.currentDocument.id === documentId) {
          state.currentDocument.tags = state.currentDocument.tags.filter(t => t !== tag);
          state.currentDocument.lastModifiedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch document by ID
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDocument = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents.push(action.payload);
        state.currentDocument = action.payload;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update document
      .addCase(updateDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.documents.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        state.currentDocument = action.payload;
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = state.documents.filter(d => d.id !== action.payload);
        if (state.currentDocument && state.currentDocument.id === action.payload) {
          state.currentDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentDocument, setFilters, clearFilters, addTag, removeTag } = documentsSlice.actions;
export default documentsSlice.reducer;