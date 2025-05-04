import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchClients, setFilters, clearFilters } from '../store/slices/clientsSlice';
import { getAllClients } from '../services/clientService';
import { DataTable, Button, StatusBadge, FilterSection, FilterConfig } from '../components/common';
import * as FaIcons from 'react-icons/fa';
import '../components/common/CommonStyles.css';

const Clients: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { filters } = useSelector((state: RootState) => state.clients);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  // Fetch clients from API
  const fetchClientsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert Redux filters to API query parameters
      const apiFilters: Record<string, any> = {};
      
      if (filters.searchTerm) {
        apiFilters.search = filters.searchTerm;
      }
      
      if (filters.type) {
        apiFilters.clientType = filters.type;
      }
      
      if (filters.kycStatus !== null) {
        apiFilters.kycVerified = filters.kycStatus;
      }
      
      if (filters.conflictCheckStatus) {
        apiFilters.conflictCheckStatus = filters.conflictCheckStatus;
      }
      
      const data = await getAllClients(apiFilters);
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ searchTerm: searchInput }));
    // API fetch will be triggered by the useEffect that depends on filters
  };

  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setFilters({ [filterType]: value }));
    // API fetch will be triggered by the useEffect that depends on filters
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput('');
    // API fetch will be triggered by the useEffect that depends on filters
  };

  const filterConfigs: FilterConfig[] = [
    {
      type: 'select',
      name: 'type',
      label: 'Type',
      options: [
        { label: 'All Types', value: '' },
        { label: 'Individual', value: 'individual' },
        { label: 'Organization', value: 'organization' }
      ],
      valueTransform: (value) => value || null
    },
    {
      type: 'select',
      name: 'kycStatus',
      label: 'KYC Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Verified', value: 'verified' },
        { label: 'Unverified', value: 'unverified' }
      ],
      valueTransform: (value) => value === '' ? null : value === 'verified'
    },
    {
      type: 'select',
      name: 'conflictCheckStatus',
      label: 'Conflict Check',
      options: [
        { label: 'All', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'Cleared', value: 'cleared' },
        { label: 'Flagged', value: 'flagged' }
      ],
      valueTransform: (value) => value || null
    }
  ];

  // No need for client-side filtering as the API handles it
  // We're using the clients state directly from the API response

  const getClientName = (client: typeof clients[0]) => {
    return client.clientType === 'personal' ?
      client.fullName:
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
        <Button
          variant="primary"
          to="/clients/new-client"
          size="small"
        >
          New Client
        </Button>
      </div>

      <FilterSection
        filters={filterConfigs}
        initialValues={{
          type: filters.type || '',
          kycStatus: filters.kycStatus === null ? '' : filters.kycStatus ? 'verified' : 'unverified',
          conflictCheckStatus: filters.conflictCheckStatus || ''
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        searchInputValue={searchInput}
        onSearchInputChange={setSearchInput}
      />

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
              accessor: row => row.clientType === 'personal' ? 'Individual' : 'Organization',
              sortable: true 
            },
            { header: 'Email', accessor: row => {
              const emailContact = row.contacts?.find(c => c.type === 'email');
              return emailContact ? emailContact.value : '';
            }, sortable: true },
            { header: 'Phone', accessor: row => {
              const phoneContact = row.contacts?.find(c => c.type === 'phone' && c.isPrimary);
              return phoneContact ? phoneContact.value : '';
            }},
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
                  status={row.conflictCheckCompleted ? 'Completed' : 'Pending'} 
                />
              )
            },
          ]}
          data={clients}
          emptyMessage="No clients found. Try adjusting your filters or create a new client."
          onRowClick={client => navigate(`/clients/${client._id}`)}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      )}
    </div>
  );
};

export default Clients;