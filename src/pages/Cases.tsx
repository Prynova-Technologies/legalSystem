import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchCases, setFilters, clearFilters } from '../store/slices/casesSlice';
import { CaseStatus, CaseType } from '../types';
import { Button, DataTable, FilterSection, FilterConfig } from '../components/common';

const Cases: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        <Button to="/cases/new-case" variant='primary'>
          New Case
        </Button>
      </div>

      <FilterSection
        filters={[
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: [
              { label: 'All Statuses', value: '' },
              ...Object.values(CaseStatus).map(status => ({
                label: status.replace('_', ' '),
                value: status
              }))
            ],
            valueTransform: (value) => value || null
          },
          {
            type: 'select',
            name: 'type',
            label: 'Type',
            options: [
              { label: 'All Types', value: '' },
              ...Object.values(CaseType).map(type => ({
                label: type.replace('_', ' '),
                value: type
              }))
            ],
            valueTransform: (value) => value || null
          }
        ]}
        initialValues={{
          status: filters.status || '',
          type: filters.type || ''
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        searchInputValue={searchInput}
        onSearchInputChange={setSearchInput}
      />

      {isLoading ? (
        <div className="loading-indicator">Loading cases...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        // <div className="cases-table-container">
          <DataTable
            columns={[
              {
                header: 'Case Number',
                accessor: 'caseNumber',
                sortable: true
              },
              {
                header: 'Title',
                accessor: 'title',
                sortable: true
              },
              {
                header: 'Type',
                accessor: (row) => row.type.replace('_', ' '),
                sortable: true
              },
              {
                header: 'Status',
                accessor: (row) => (
                  <span className={getStatusBadgeClass(row.status)}>
                    {row.status.replace('_', ' ')}
                  </span>
                )
              },
              {
                header: 'Open Date',
                accessor: (row) => formatDate(row.openDate),
                sortable: true
              },
            ]}
            data={filteredCases}
            onRowClick={(row) => navigate(`/cases/${row.id}`)}
            emptyMessage="No cases found. Try adjusting your filters or create a new case."
            striped={true}
            // bordered={true}
            pagination={true}
            pageSize={10}
          />
        // </div>
      )}
    </div>
  );
};

export default Cases;