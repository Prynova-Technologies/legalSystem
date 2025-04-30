import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchMessages, setFilters, clearFilters } from '../store/slices/communicationsSlice';
import { Tabs, DataTable, Button, StatusBadge } from '../components/common';
import * as FaIcons from 'react-icons/fa';
import '../components/common/CommonStyles.css';

const Communications: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { messages, isLoading, error, filters } = useSelector(
    (state: RootState) => state.communications
  );
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    dispatch(fetchMessages() as any);
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Filter communications based on current filters and active tab
  const filteredCommunications = messages.filter(comm => {
    // Search term filter
    if (filters.searchTerm && !(
      comm.subject?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      comm.content?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      comm.recipients.some(recipient => recipient.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
      comm.sender?.toLowerCase().includes(filters.searchTerm.toLowerCase())
    )) {
      return false;
    }

    // Type filter
    if (filters.messageType && comm.type !== filters.messageType) {
      return false;
    }

    // Case filter
    if (filters.caseId && comm.caseId !== filters.caseId) {
      return false;
    }

    // Client filter
    if (filters.clientId && comm.clientId !== filters.clientId) {
      return false;
    }

    // Tab filter
    if (activeTab !== 'all' && comm.type !== activeTab) {
      return false;
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'status-sent';
      case 'received':
        return 'status-received';
      case 'draft':
        return 'status-draft';
      case 'scheduled':
        return 'status-scheduled';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '✉️';
      case 'call':
        return '📞';
      case 'message':
        return '💬';
      case 'meeting':
        return '📅';
      default:
        return '📄';
    }
  };

  const renderEmailTab = () => (
    <div className="communications-section detail-container">
      <div className="detail-header">
        <h2 className="detail-title">Emails</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/communications/email/new')}
        >
          <FaIcons.FaEnvelope /> Compose Email
        </Button>
      </div>

      <DataTable
        columns={[
          { 
            header: '', 
            accessor: row => (
              <span className="type-icon">{getTypeIcon(row.type)}</span>
            )
          },
          { header: 'Subject', accessor: 'subject' },
          { header: 'Recipient', accessor: row => row.recipients.join(', ') },
          { header: 'Date', accessor: row => formatDate(row.createdAt) },
          { 
            header: 'Status', 
            accessor: row => (
              <StatusBadge status={row.status} />
            )
          },
          { 
            header: 'Case', 
            accessor: row => (
              row.caseId ? (
                <Link to={`/cases/${row.caseId}`}>View Case</Link>
              ) : 'N/A'
            )
          },
          { 
            header: 'Actions', 
            accessor: row => (
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => navigate(`/communications/${row.id}`)}
              >
                <FaIcons.FaEye /> View
              </Button>
            )
          }
        ]}
        data={filteredCommunications}
        emptyMessage="No emails found. Compose a new email to get started."
        onRowClick={comm => navigate(`/communications/${comm.id}`)}
        pagination={true}
        pageSize={10}
        striped={true}
      />
    </div>
  );

  const renderCallsTab = () => (
    <div className="communications-section">
      <div className="section-header">
        <h2>Call Logs</h2>
        <button className="btn btn-primary" onClick={() => navigate('/communications/call/new')}>
          Log Call
        </button>
      </div>

      {filteredCommunications.length > 0 ? (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Contact</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Case</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunications.map(comm => (
                <tr key={comm.id}>
                  <td>{getTypeIcon(comm.type)}</td>
                  <td>{comm.recipients.join(', ')}</td>
                  <td>{formatDate(comm.createdAt)}</td>
                  <td>N/A</td>
                  <td>
                    {comm.caseId ? (
                      <Link to={`/cases/${comm.caseId}`}>View Case</Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm" 
                      onClick={() => navigate(`/communications/${comm.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">No call logs found. Log a new call to get started.</p>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="communications-section">
      <div className="section-header">
        <h2>Messages</h2>
        <button className="btn btn-primary" onClick={() => navigate('/communications/message/new')}>
          New Message
        </button>
      </div>

      {filteredCommunications.length > 0 ? (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Contact</th>
                <th>Content</th>
                <th>Date</th>
                <th>Status</th>
                <th>Case</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunications.map(comm => (
                <tr key={comm.id}>
                  <td>{getTypeIcon(comm.type)}</td>
                  <td>{comm.recipients.join(', ')}</td>
                  <td className="message-preview">{comm.content}</td>
                  <td>{formatDate(comm.createdAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(comm.status)}`}>
                      {comm.status}
                    </span>
                  </td>
                  <td>
                    {comm.caseId ? (
                      <Link to={`/cases/${comm.caseId}`}>View Case</Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm" 
                      onClick={() => navigate(`/communications/${comm.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">No messages found. Send a new message to get started.</p>
      )}
    </div>
  );

  const renderMeetingsTab = () => (
    <div className="communications-section">
      <div className="section-header">
        <h2>Meeting Notes</h2>
        <button className="btn btn-primary" onClick={() => navigate('/communications/meeting/new')}>
          Add Meeting Note
        </button>
      </div>

      {filteredCommunications.length > 0 ? (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Subject</th>
                <th>Participants</th>
                <th>Date</th>
                <th>Case</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunications.map(comm => (
                <tr key={comm.id}>
                  <td>{getTypeIcon(comm.type)}</td>
                  <td>{comm.subject}</td>
                  <td>{comm.recipients.join(', ')}</td>
                  <td>{formatDate(comm.createdAt)}</td>
                  <td>
                    {comm.caseId ? (
                      <Link to={`/cases/${comm.caseId}`}>View Case</Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm" 
                      onClick={() => navigate(`/communications/${comm.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">No meeting notes found. Add a new meeting note to get started.</p>
      )}
    </div>
  );

  return (
    <div className="communications-container">
      <div className="page-header">
        <h1>Communications</h1>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search communications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <Button variant="primary" type="submit">Search</Button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.messageType || ''}
              onChange={(e) => handleFilterChange('messageType', e.target.value || null)}
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="internal_note">Internal Note</option>
            </select>
          </div>

          <Button variant="secondary" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading communications...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <Tabs
            tabs={[
              { id: 'all', label: 'All', icon: <FaIcons.FaInbox /> },
              { id: 'email', label: 'Emails', icon: <FaIcons.FaEnvelope /> },
              { id: 'sms', label: 'SMS', icon: <FaIcons.FaSms /> },
              { id: 'internal_note', label: 'Internal Notes', icon: <FaIcons.FaStickyNote /> }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="default"
          />
          
          <div className="tab-content">
            {/* Keep existing tab content rendering logic */}
            {activeTab === 'all' && (
              <div className="communications-all detail-container">
                <div className="detail-header">
                  <h2 className="detail-title">All Communications</h2>
                </div>
                <DataTable
                  columns={[
                    { 
                      header: 'Type', 
                      accessor: row => (
                        <span className="type-icon">{getTypeIcon(row.type)}</span>
                      )
                    },
                    { 
                      header: 'Type', 
                      accessor: row => row.type.charAt(0).toUpperCase() + row.type.slice(1).replace('_', ' ')
                    },
                    { 
                      header: 'Subject/Content', 
                      accessor: row => row.subject || row.content.substring(0, 50) + (row.content.length > 50 ? '...' : '')
                    },
                    { header: 'Date', accessor: row => formatDate(row.createdAt) },
                    { 
                      header: 'Status', 
                      accessor: row => (
                        row.status && <StatusBadge status={row.status} />
                      )
                    },
                    { 
                      header: 'Case', 
                      accessor: row => (
                        row.caseId ? (
                          <Link to={`/cases/${row.caseId}`}>View Case</Link>
                        ) : 'N/A'
                      )
                    },
                    { 
                      header: 'Actions', 
                      accessor: row => (
                        <Button 
                          variant="secondary" 
                          size="small"
                          onClick={() => navigate(`/communications/${row.id}`)}
                        >
                          <FaIcons.FaEye /> View
                        </Button>
                      )
                    }
                  ]}
                  data={filteredCommunications}
                  emptyMessage="No communications found. Create a new communication to get started."
                  onRowClick={comm => navigate(`/communications/${comm.id}`)}
                  pagination={true}
                  pageSize={10}
                  striped={true}
                />
              </div>
            )}
            {activeTab === 'email' && renderEmailTab()}
            {activeTab === 'sms' && renderMessagesTab()}
            {activeTab === 'internal_note' && renderMeetingsTab()}
          </div>
        </>
      )}
    </div>
  );
};

export default Communications;