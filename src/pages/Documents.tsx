import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchDocuments, setFilters, clearFilters } from '../store/slices/documentsSlice';
import { DocumentCategory } from '../types';
import { Button, FilterSection, FilterConfig } from '../components/common';
import { DocumentUploadModal, DocumentCard } from '../components/documents';
import './Documents.css';

const Documents: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documents, isLoading, error, filters } = useSelector((state: RootState) => state.documents);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDocuments() as any);
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ searchTerm: searchInput }));
  };

  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput('');
  };
  
  const filterConfig: FilterConfig[] = [
    {
      type: 'select',
      name: 'category',
      label: 'Category',
      options: [
        { label: 'All Categories', value: '' },
        ...Object.values(DocumentCategory).map(category => ({
          label: category.replace('_', ' '),
          value: category
        }))
      ]
    }
  ];

  // Filter documents based on current filters
  const filteredDocuments = documents.data?.filter(document => {
    // Search term filter
    if (filters.searchTerm && !(
      document.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (document.description && document.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
    )) {
      return false;
    }

    // Category filter
    if (filters.category && document.documentType !== filters.category) {
      return false;
    }

    // Case filter
    if (filters.caseId && document.case !== filters.caseId) {
      return false;
    }

    // Client filter
    if (filters.clientId && document.client !== filters.clientId) {
      return false;
    }

    return true;
  });
  
  // Prepare documents for DocumentCard component
  const preparedDocuments = filteredDocuments?.map(doc => ({
    ...doc,
    // Ensure client and createdBy are in the expected format for DocumentCard
    client: doc.client ? {
      _id: typeof doc.client === 'string' ? doc.client : doc.client._id,
      id: typeof doc.client === 'string' ? doc.client : doc.client._id,
      firstName: typeof doc.client === 'object' ? doc.client.firstName : '',
      lastName: typeof doc.client === 'object' ? doc.client.lastName : ''
    } : undefined,
    createdBy: {
      _id: typeof doc.createdBy === 'string' ? doc.createdBy : doc.createdBy?._id || '',
      id: typeof doc.createdBy === 'string' ? doc.createdBy : doc.createdBy?._id || '',
      firstName: typeof doc.createdBy === 'object' ? doc.createdBy.firstName : '',
      lastName: typeof doc.createdBy === 'object' ? doc.createdBy.lastName : '',
      fullName: typeof doc.createdBy === 'object' ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : ''
    }
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const getDocumentIcon = (fileType: string) => {
    const type = fileType ?  fileType.toLowerCase() : '';
    if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('doc') || type.includes('word') || type.includes('csv') || type.includes('text')) {
      return '📝';
    } else if (type.includes('xls') || type.includes('sheet')) {
      return '📊';
    } else if (type.includes('ppt') || type.includes('presentation')) {
      return '📑';
    } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif') || type.includes('webp')) {
      return '🖼️';
    } else {
      return '📁';
    }
  };

  return (
    <div className="documents-container">
      <div className="page-header">
        <h1>Documents</h1>
        <Button 
          variant="primary" 
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Document
        </Button>
      </div>
      
      <DocumentUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadFinish={() => {
          dispatch(fetchDocuments() as any);
          setIsUploadModalOpen(false);
        }} 
      />

      <FilterSection
        filters={filterConfig}
        initialValues={{
          category: filters.category || ''
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        searchInputValue={searchInput}
        onSearchInputChange={(value) => setSearchInput(value)}
      />

      {isLoading ? (
        <div className="loading-indicator">Loading documents...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : preparedDocuments?.length === 0 ? (
        <div className="empty-state">
          <p>No documents found. Try adjusting your filters or upload a new document.</p>
        </div>
      ) : (
        <div className="documents-grid">
          {preparedDocuments?.map(document => (
            <DocumentCard
              key={document.id || document._id}
              document={document}
              className="clickable-card"
              onPreview={() => window.open(document.versions[0].filePath, '_blank')}
              onDownload={() => window.open(document.versions[0].filePath, '_blank')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;