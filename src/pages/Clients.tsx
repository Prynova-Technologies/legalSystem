import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchClients, setFilters, clearFilters } from '../store/slices/clientsSlice';
import { DataTable, Button, StatusBadge } from '../components/common';
import * as FaIcons from 'react-icons/fa';
import '../components/common/CommonStyles.css';

const Clients: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clients, isLoading, error, filters } = useSelector((state: RootState) => state.clients);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  useEffect(() => {
    dispatch(fetchClients() as any);
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

  // Filter clients based on current filters
  const filteredClients = clients.filter(client => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const nameMatch = client.type === 'individual' ?
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchLower) :
        client.organizationName?.toLowerCase().includes(searchLower);
      const emailMatch = client.contactInfo.email.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !emailMatch) {
        return false;
      }
    }

    // Type filter
    if (filters.type && client.type !== filters.type) {
      return false;
    }

    // KYC status filter
    if (filters.kycStatus !== null && client.kycVerified !== filters.kycStatus) {
      return false;
    }

    // Conflict check status filter
    if (filters.conflictCheckStatus && client.conflictCheckStatus !== filters.conflictCheckStatus) {
      return false;
    }

    return true;
  });

  const getClientName = (client: typeof clients[0]) => {
    return client.type === 'individual' ?
      `${client.firstName} ${client.lastName}` :
      client.organizationName;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="clients-container">
      <div className="page-header">
        <h1>Clients</h1>
        <Link to="/clients/new" className="btn btn-primary">
          New Client
        </Link>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || null)}
            >
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
            </select>
          </div>

          <div className="filter-group">
            <label>KYC Status:</label>
            <select
              value={filters.kycStatus === null ? '' : filters.kycStatus ? 'verified' : 'unverified'}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('kycStatus', value === '' ? null : value === 'verified');
              }}
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Conflict Check:</label>
            <select
              value={filters.conflictCheckStatus || ''}
              onChange={(e) => handleFilterChange('conflictCheckStatus', e.target.value || null)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

          <button onClick={handleClearFilters} className="clear-filters-button">
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading clients...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <DataTable
          columns={[
            { header: 'Name', accessor: row => getClientName(row), sortable: true },
            { 
              header: 'Type', 
              accessor: row => row.type === 'individual' ? 'Individual' : 'Organization',
              sortable: true 
            },
            { header: 'Email', accessor: row => row.contactInfo.email, sortable: true },
            { header: 'Phone', accessor: row => row.contactInfo.phone },
            { header: 'Intake Date', accessor: row => formatDate(row.intakeDate), sortable: true },
            { 
              header: 'KYC Status', 
              accessor: row => (
                <StatusBadge 
                  status={row.kycVerified ? 'Verified' : 'Unverified'} 
                />
              )
            },
            { 
              header: 'Conflict Check', 
              accessor: row => (
                <StatusBadge 
                  status={row.conflictCheckStatus} 
                />
              )
            },
            { 
              header: 'Actions', 
              accessor: row => (
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={() => navigate(`/clients/${row.id}`)}
                >
                  <FaIcons.FaEye /> View
                </Button>
              )
            }
          ]}
          data={filteredClients}
          emptyMessage="No clients found. Try adjusting your filters or create a new client."
          onRowClick={client => navigate(`/clients/${client.id}`)}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      )}
    </div>
  );
};

export default Clients;