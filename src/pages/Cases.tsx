import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import { fetchCases, setFilters, clearFilters } from '../store/slices/casesSlice';
import { CaseStatus, CaseType } from '../types';

const Cases: React.FC = () => {
  const dispatch = useDispatch();
  const { cases, isLoading, error, filters } = useSelector((state: RootState) => state.cases);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  useEffect(() => {
    dispatch(fetchCases() as any);
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

  const getStatusBadgeClass = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN:
        return 'status-badge status-open';
      case CaseStatus.CLOSED:
        return 'status-badge status-closed';
      case CaseStatus.PENDING:
        return 'status-badge status-pending';
      case CaseStatus.AWAITING_RESPONSE:
        return 'status-badge status-awaiting';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter cases based on current filters
  const filteredCases = cases.filter(caseItem => {
    // Search term filter
    if (filters.searchTerm && !(
      caseItem.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(filters.searchTerm.toLowerCase())
    )) {
      return false;
    }

    // Status filter
    if (filters.status && caseItem.status !== filters.status) {
      return false;
    }

    // Type filter
    if (filters.type && caseItem.caseType !== filters.type) {
      return false;
    }

    // Assigned to filter
    if (filters.assignedTo && !caseItem.assignedTo.includes(filters.assignedTo)) {
      return false;
    }

    // Client filter
    if (filters.clientId && caseItem.clientId !== filters.clientId) {
      return false;
    }

    return true;
  });

  return (
    <div className="cases-container">
      <div className="page-header">
        <h1>Cases</h1>
        <Link to="/cases/new" className="btn btn-primary">
          New Case
        </Link>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search cases..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
            >
              <option value="">All Statuses</option>
              {Object.values(CaseStatus).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || null)}
            >
              <option value="">All Types</option>
              {Object.values(CaseType).map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <button onClick={handleClearFilters} className="clear-filters-button">
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading cases...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredCases.length === 0 ? (
        <div className="empty-state">
          <p>No cases found. Try adjusting your filters or create a new case.</p>
        </div>
      ) : (
        <div className="cases-table-container">
          <table className="cases-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Open Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(caseItem => (
                <tr key={caseItem.id}>
                  <td>{caseItem.caseNumber}</td>
                  <td>{caseItem.title}</td>
                  <td>{caseItem.caseType.replace('_', ' ')}</td>
                  <td>
                    <span className={getStatusBadgeClass(caseItem.status)}>
                      {caseItem.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(caseItem.openDate)}</td>
                  <td>
                    <Link to={`/cases/${caseItem.id}`} className="view-link">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Cases;