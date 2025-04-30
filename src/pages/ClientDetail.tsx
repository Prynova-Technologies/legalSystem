import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchClientById, updateClient, deleteClient } from '../store/slices/clientsSlice';
import { fetchCases } from '../store/slices/casesSlice';
import { fetchDocuments } from '../store/slices/documentsSlice';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, DetailView, DetailItem, DetailSection, StatusBadge, DataTable, Button } from '../components/common';
import * as FaIcons from 'react-icons/fa';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentClient, isLoading, error } = useSelector((state: RootState) => state.clients);
  const { cases } = useSelector((state: RootState) => state.cases);
  const { documents } = useSelector((state: RootState) => state.documents);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    type: 'individual' as 'individual' | 'organization',
    contactInfo: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    kycVerified: false,
    conflictCheckStatus: 'pending' as 'pending' | 'cleared' | 'flagged'
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchClientById(id) as any);
      dispatch(fetchCases() as any);
      dispatch(fetchDocuments() as any);
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentClient) {
      setEditFormData({
        firstName: currentClient.firstName || '',
        lastName: currentClient.lastName || '',
        organizationName: currentClient.organizationName || '',
        type: currentClient.type,
        contactInfo: {
          email: currentClient.contactInfo.email,
          phone: currentClient.contactInfo.phone,
          address: {
            street: currentClient.contactInfo.address.street,
            city: currentClient.contactInfo.address.city,
            state: currentClient.contactInfo.address.state,
            zipCode: currentClient.contactInfo.address.zipCode,
            country: currentClient.contactInfo.address.country
          }
        },
        kycVerified: currentClient.kycVerified,
        conflictCheckStatus: currentClient.conflictCheckStatus
      });
    }
  }, [currentClient]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'contactInfo') {
        if (child.includes('.')) {
          const [addressParent, addressChild] = child.split('.');
          if (addressParent === 'address') {
            setEditFormData({
              ...editFormData,
              contactInfo: {
                ...editFormData.contactInfo,
                address: {
                  ...editFormData.contactInfo.address,
                  [addressChild]: value
                }
              }
            });
          }
        } else {
          setEditFormData({
            ...editFormData,
            contactInfo: {
              ...editFormData.contactInfo,
              [child]: value
            }
          });
        }
      }
    } else if (name === 'kycVerified') {
      setEditFormData({
        ...editFormData,
        kycVerified: (e.target as HTMLInputElement).checked
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && currentClient) {
      try {
        await dispatch(updateClient({
          clientId: id,
          clientData: {
            ...editFormData,
            type: editFormData.type as 'individual' | 'organization'
          }
        }) as any);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update client:', error);
      }
    }
  };

  const handleDeleteClient = async () => {
    if (id && window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await dispatch(deleteClient(id) as any);
        navigate('/clients');
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading client details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!currentClient) {
    return <div className="error-message">Client not found</div>;
  }

  // Filter client-related cases and documents
  const clientCases = cases.filter(c => c.clientId === id);
  const clientDocuments = documents.filter(doc => doc.clientId === id);

  const getClientName = () => {
    return currentClient.type === 'individual' ?
      `${currentClient.firstName} ${currentClient.lastName}` :
      currentClient.organizationName;
  };

  return (
    <div className="client-detail-container">
      <div className="client-header">
        <div className="client-header-left">
          <h1>{getClientName()}</h1>
          <div className="client-meta">
            <span className="client-type">{currentClient.type === 'individual' ? 'Individual' : 'Organization'}</span>
            <span className={`status-badge ${currentClient.kycVerified ? 'status-verified' : 'status-unverified'}`}>
              KYC: {currentClient.kycVerified ? 'Verified' : 'Unverified'}
            </span>
            <span className={`status-badge status-${currentClient.conflictCheckStatus}`}>
              Conflict Check: {currentClient.conflictCheckStatus}
            </span>
          </div>
        </div>
        <div className="client-header-actions">
          {!isEditing && (
            <>
              <Button variant="secondary" onClick={handleEditToggle}>
                <FaIcons.FaEdit /> Edit Client
              </Button>
              <Button variant="danger" onClick={handleDeleteClient}>
                <FaIcons.FaTrash /> Delete Client
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => navigate('/clients')}>
            <FaIcons.FaArrowLeft /> Back to Clients
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-client-form-container">
          <h2>Edit Client</h2>
          <form onSubmit={handleEditSubmit} className="edit-client-form">
            <div className="form-group">
              <label htmlFor="type">Client Type</label>
              <select
                id="type"
                name="type"
                value={editFormData.type}
                onChange={handleEditChange}
                required
              >
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
            </div>

            {editFormData.type === 'individual' ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={editFormData.organizationName}
                  onChange={handleEditChange}
                  required
                />
              </div>
            )}

            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactInfo.email">Email</label>
                <input
                  type="email"
                  id="contactInfo.email"
                  name="contactInfo.email"
                  value={editFormData.contactInfo.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo.phone">Phone</label>
                <input
                  type="tel"
                  id="contactInfo.phone"
                  name="contactInfo.phone"
                  value={editFormData.contactInfo.phone}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <h4>Address</h4>
            <div className="form-group">
              <label htmlFor="contactInfo.address.street">Street</label>
              <input
                type="text"
                id="contactInfo.address.street"
                name="contactInfo.address.street"
                value={editFormData.contactInfo.address.street}
                onChange={handleEditChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactInfo.address.city">City</label>
                <input
                  type="text"
                  id="contactInfo.address.city"
                  name="contactInfo.address.city"
                  value={editFormData.contactInfo.address.city}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo.address.state">State/Province</label>
                <input
                  type="text"
                  id="contactInfo.address.state"
                  name="contactInfo.address.state"
                  value={editFormData.contactInfo.address.state}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactInfo.address.zipCode">Zip/Postal Code</label>
                <input
                  type="text"
                  id="contactInfo.address.zipCode"
                  name="contactInfo.address.zipCode"
                  value={editFormData.contactInfo.address.zipCode}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo.address.country">Country</label>
                <input
                  type="text"
                  id="contactInfo.address.country"
                  name="contactInfo.address.country"
                  value={editFormData.contactInfo.address.country}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <h3>Verification</h3>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="kycVerified"
                  name="kycVerified"
                  checked={editFormData.kycVerified}
                  onChange={handleEditChange}
                />
                <label htmlFor="kycVerified">KYC Verified</label>
              </div>

              <div className="form-group">
                <label htmlFor="conflictCheckStatus">Conflict Check Status</label>
                <select
                  id="conflictCheckStatus"
                  name="conflictCheckStatus"
                  value={editFormData.conflictCheckStatus}
                  onChange={handleEditChange}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="cleared">Cleared</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button type="button" onClick={handleEditToggle} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="client-tabs">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'cases', label: `Cases (${clientCases.length})` },
              { id: 'documents', label: `Documents (${clientDocuments.length})` },
              { id: 'notes', label: `Notes (${currentClient.notes.length})` }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="default"
          />

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <DetailView title="Client Overview" actions={
                  <Button variant="secondary" size="small" onClick={handleEditToggle}>
                    <FaIcons.FaEdit /> Edit
                  </Button>
                }>
                  <DetailSection title="Client Information">
                    <DetailItem label="Client Type" value={currentClient.type === 'individual' ? 'Individual' : 'Organization'} />
                    
                    {currentClient.type === 'individual' ? (
                      <>
                        <DetailItem label="First Name" value={currentClient.firstName} />
                        <DetailItem label="Last Name" value={currentClient.lastName} />
                      </>
                    ) : (
                      <DetailItem label="Organization Name" value={currentClient.organizationName} />
                    )}
                    
                    <DetailItem label="Intake Date" value={formatDate(currentClient.intakeDate)} />
                  </DetailSection>

                  <DetailSection title="Contact Information">
                    <DetailItem label="Email" value={currentClient.contactInfo.email} />
                    <DetailItem label="Phone" value={currentClient.contactInfo.phone} />
                    <DetailItem 
                      label="Address" 
                      value={
                        <div className="address-value">
                          <div>{currentClient.contactInfo.address.street}</div>
                          <div>
                            {currentClient.contactInfo.address.city}, {currentClient.contactInfo.address.state} {currentClient.contactInfo.address.zipCode}
                          </div>
                          <div>{currentClient.contactInfo.address.country}</div>
                        </div>
                      } 
                    />
                  </DetailSection>

                  <DetailSection title="Verification Status">
                    <DetailItem 
                      label="KYC Status" 
                      value={
                        <StatusBadge 
                          status={currentClient.kycVerified ? 'Verified' : 'Unverified'} 
                        />
                      } 
                    />
                    <DetailItem 
                      label="Conflict Check" 
                      value={
                        <StatusBadge 
                          status={currentClient.conflictCheckStatus} 
                        />
                      } 
                    />
                    <DetailItem 
                      label="KYC Documents" 
                      value={
                        currentClient.kycDocuments.length > 0 ? (
                          <ul className="document-list">
                            {currentClient.kycDocuments.map(doc => (
                              <li key={doc.id}>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "No KYC documents uploaded"
                        )
                      } 
                    />
                  </DetailSection>
                </DetailView>
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="cases-tab">
                <DetailView 
                  title="Client Cases" 
                  actions={
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/cases/new?clientId=${id}`)}
                    >
                      <FaIcons.FaPlus /> Create New Case
                    </Button>
                  }
                >
                  <DataTable
                    columns={[
                      { header: 'Case Number', accessor: 'caseNumber' },
                      { header: 'Title', accessor: 'title' },
                      { header: 'Type', accessor: row => row.caseType.replace('_', ' ') },
                      { 
                        header: 'Status', 
                        accessor: row => (
                          <StatusBadge status={row.status.replace('_', ' ')} />
                        )
                      },
                      { header: 'Open Date', accessor: row => formatDate(row.openDate) },
                      { 
                        header: 'Actions', 
                        accessor: row => (
                          <Button 
                            variant="secondary" 
                            size="small"
                            onClick={() => navigate(`/cases/${row.id}`)}
                          >
                            View
                          </Button>
                        )
                      }
                    ]}
                    data={clientCases}
                    emptyMessage="No cases associated with this client"
                    onRowClick={row => navigate(`/cases/${row.id}`)}
                    pagination={true}
                    pageSize={5}
                  />
                </DetailView>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-tab">
                <DetailView 
                  title="Client Documents" 
                  actions={
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/documents/upload?clientId=${id}`)}
                    >
                      <FaIcons.FaUpload /> Upload Document
                    </Button>
                  }
                >
                  {clientDocuments.length > 0 ? (
                    <div className="documents-list">
                      {clientDocuments.map(doc => (
                        <div key={doc.id} className="document-item">
                          <div className="document-icon"><FaIcons.FaFile /></div>
                          <div className="document-info">
                            <h4 className="document-title">{doc.name}</h4>
                            <p className="document-description">{doc.description}</p>
                            <div className="document-meta">
                              <span>Type: {doc.fileType}</span>
                              <span>Size: {(doc.size / 1024).toFixed(2)} KB</span>
                              <span>Uploaded: {formatDate(doc.uploadedAt)}</span>
                            </div>
                          </div>
                          <div className="document-actions">
                            <Button 
                              variant="primary" 
                              size="small"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <FaIcons.FaEye /> View
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="small"
                              onClick={() => navigate(`/documents/${doc.id}`)}
                            >
                              <FaIcons.FaInfoCircle /> Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No documents associated with this client</p>
                  )}
                </DetailView>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="notes-tab">
                <DetailView title="Client Notes" actions={
                  <Button variant="primary" size="small">
                    <FaIcons.FaPlus /> Add Note
                  </Button>
                }>
                  <div className="add-note-section">
                    <h3>Add Note</h3>
                    <form className="add-note-form">
                      <div className="form-group">
                        <textarea
                          className="form-textarea"
                          placeholder="Enter your note here..."
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" variant="primary">
                        <FaIcons.FaSave /> Save Note
                      </Button>
                    </form>
                  </div>
                  
                  <DetailSection title="Previous Notes">
                    {currentClient.notes.length > 0 ? (
                      currentClient.notes.map(note => (
                        <div key={note.id} className="note-item">
                          <div className="note-content">{note.content}</div>
                          <div className="note-meta">
                            <span>Created: {formatDate(note.createdAt)}</span>
                            <span>By: User ID {note.createdBy}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">No notes for this client</p>
                    )}
                  </DetailSection>
                </DetailView>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;