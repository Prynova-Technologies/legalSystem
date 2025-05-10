import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Document, DocumentCategory } from '../../types';
import { fetchAllDocuments, createDocument, updateDocument as updateDocumentApi, deleteDocument as deleteDocumentApi } from '../../services/documentService';

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

// Fetch documents from API
export const fetchDocuments = createAsyncThunk('documents/fetchDocuments', async (_, { rejectWithValue }) => {
  try {
    const response = await fetchAllDocuments();
    return response;
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
  async (documentData: Partial<Document>, { dispatch, rejectWithValue }) => {
    try {
      const response = await createDocument(documentData);
      // Refresh the documents list after successful upload
      await dispatch(fetchDocuments());
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to upload document');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async ({ documentId, documentData }: { documentId: string; documentData: Partial<Document> }, { dispatch, rejectWithValue }) => {
    try {
      const response = await updateDocumentApi(documentId, documentData);
      // Refresh the documents list after successful update
      await dispatch(fetchDocuments());
      return response;
    } catch (error) {
      return rejectWithValue('Failed to update document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { dispatch, rejectWithValue }) => {
    try {
      await deleteDocumentApi(documentId);
      // Refresh the documents list after successful deletion
      await dispatch(fetchDocuments());
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
        // Ensure documents is an array before pushing
        if (!Array.isArray(state.documents)) {
          state.documents = [];
        }
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