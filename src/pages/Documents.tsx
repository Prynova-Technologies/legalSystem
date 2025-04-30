import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchDocuments, setFilters, clearFilters } from '../store/slices/documentsSlice';
import { DocumentCategory } from '../types';

const Documents: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documents, isLoading, error, filters } = useSelector((state: RootState) => state.documents);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

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

  // Filter documents based on current filters
  const filteredDocuments = documents.filter(document => {
    // Search term filter
    if (filters.searchTerm && !(
      document.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (document.description && document.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
    )) {
      return false;
    }

    // Category filter
    if (filters.category && document.category !== filters.category) {
      return false;
    }

    // Case filter
    if (filters.caseId && document.caseId !== filters.caseId) {
      return false;
    }

    // Client filter
    if (filters.clientId && document.clientId !== filters.clientId) {
      return false;
    }

    return true;
  });

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
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('doc') || type.includes('word')) {
      return '📝';
    } else if (type.includes('xls') || type.includes('sheet')) {
      return '📊';
    } else if (type.includes('ppt') || type.includes('presentation')) {
      return '📑';
    } else if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) {
      return '🖼️';
    } else {
      return '📁';
    }
  };

  return (
    <div className="documents-container">
      <div className="page-header">
        <h1>Documents</h1>
        <Link to="/documents/upload" className="btn btn-primary">
          Upload Document
        </Link>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || null)}
            >
              <option value="">All Categories</option>
              {Object.values(DocumentCategory).map(category => (
                <option key={category} value={category}>{category.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <button onClick={handleClearFilters} className="clear-filters-button">
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading documents...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <p>No documents found. Try adjusting your filters or upload a new document.</p>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map(document => (
            <div key={document.id} className="document-card" onClick={() => navigate(`/documents/${document.id}`)}>
              <div className="document-icon">{getDocumentIcon(document.fileType)}</div>
              <div className="document-info">
                <h3 className="document-name">{document.name}</h3>
                {document.description && (
                  <p className="document-description">{document.description}</p>
                )}
                <div className="document-meta">
                  <span className="document-type">{document.fileType.toUpperCase()}</span>
                  <span className="document-size">{formatFileSize(document.size)}</span>
                </div>
                <div className="document-meta">
                  <span className="document-category">{document.category.replace('_', ' ')}</span>
                  <span className="document-date">Uploaded: {formatDate(document.uploadedAt)}</span>
                </div>
              </div>
              <div className="document-actions">
                <a href={document.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" onClick={(e) => e.stopPropagation()}>
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;