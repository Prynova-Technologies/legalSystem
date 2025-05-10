import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchClientById, updateClient, deleteClient, setCurrentClient } from '../store/slices/clientsSlice';
import { fetchCases } from '../store/slices/casesSlice';
import { fetchDocuments } from '../store/slices/documentsSlice';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, DetailView, DetailItem, DetailSection, StatusBadge, DataTable, Button } from '../components/common';
import { DocumentCard, DocumentUploadModal } from '../components/documents';
import * as FaIcons from 'react-icons/fa';
import './ClientDetail.css';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentClient, isLoading, error } = useSelector((state: RootState) => state.clients);
  const { cases } = useSelector((state: RootState) => state.cases);
  const { documents } = useSelector((state: RootState) => state.documents);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: '',
    clientType: 'individual' as 'individual' | 'organization',
    contacts: [] as Array<{
      _id?: string;
      type: 'email' | 'phone' | 'address' | 'other';
      value: string;
      isPrimary?: boolean;
    }>,
    kycVerified: false,
    conflictCheckStatus: 'flagged' | 'cleared',
    note: ''
  });

  useEffect(() => {
    // Reset state when ID changes
    if (id) {
// Always fetch the client directly from the API to ensure we have the latest data
dispatch(fetchClientById(id) as any);
    } else {
      // Clear current client if no ID is provided
      dispatch(setCurrentClient(null));
    }
    
    // Reset active tab and editing state when changing clients
    setActiveTab('overview');
    setIsEditing(false);
  }, [dispatch, id]);
  
  // Show error message if client couldn't be loaded
  useEffect(() => {
    if (error) {
      // You could show a toast notification or error message here
      console.error('Error loading client:', error);
    }
  }, [error]);

  useEffect(() => {
    if (currentClient) {
      // Find contact values or use empty objects
      const emailContact = currentClient.contactInfo?.find(c => c.type === 'email') || { _id: '', value: '', type: 'email' };
      const phoneContact = currentClient.contactInfo?.find(c => c.type === 'phone') || { _id: '', value: '', type: 'phone' };
      const addressContact = currentClient.contactInfo?.find(c => c.type === 'address') || { _id: '', value: JSON.stringify({ street: '', city: '', country: '', postalCode: '' }), type: 'address' };
      
      // Ensure address contact value is valid JSON
      let addressValue = addressContact.value;
      try {
        // Test if it's already valid JSON
        JSON.parse(addressValue);
      } catch (e) {
        // If not valid JSON, convert the string to a structured format
        addressValue = JSON.stringify({ 
          street: addressValue || '',
          city: '', 
          country: '', 
          postalCode: '' 
        });
      }
      
      setEditFormData({
        firstName: currentClient.firstName || '',
        lastName: currentClient.lastName || '',
        organizationName: currentClient.organizationName || '',
        clientType: currentClient.type || 'individual',
        contacts: [
          { _id: emailContact._id, type: 'email', value: emailContact.value, isPrimary: emailContact.isPrimary },
          { _id: phoneContact._id, type: 'phone', value: phoneContact.value, isPrimary: phoneContact.isPrimary },
          { _id: addressContact._id, type: 'address', value: addressValue, isPrimary: addressContact.isPrimary }
        ],
        kycVerified: currentClient.kycVerified,
        conflictCheckStatus: currentClient.conflictCheckStatus,
        note: currentClient.notes || ''
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
    
    // Handle nested properties for contacts
    if (name.startsWith('contacts.')) {
      const [_, contactType, field] = name.split('.');
      const updatedContacts = [...editFormData.contacts];
      const contactIndex = updatedContacts.findIndex(c => c.type === contactType);
      
      if (contactIndex !== -1) {
        updatedContacts[contactIndex] = {
          ...updatedContacts[contactIndex],
          value: value
        };
      } else {
        // If contact doesn't exist, create a new one
        updatedContacts.push({
          type: contactType as 'email' | 'phone' | 'address' | 'other',
          value: value,
          isPrimary: false
        });
      }
      
      setEditFormData({
        ...editFormData,
        contacts: updatedContacts
      });
    } else if (name === 'kycVerified') {
      setEditFormData({
        ...editFormData,
        kycVerified: !currentClient.kycVerified
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [_, contactType, field] = name.split('.');
    
    const updatedContacts = [...editFormData.contacts];
    const contactIndex = updatedContacts.findIndex(c => c.type === contactType);
    
    let addressData = {};
    try {
      // Parse existing address data or create empty object if it doesn't exist
      addressData = contactIndex !== -1 ? 
        JSON.parse(updatedContacts[contactIndex].value || '{}') : 
        { street: '', city: '', country: '', postalCode: '' };
    } catch (error) {
      // If parsing fails, create a new object
      addressData = { street: '', city: '', country: '', postalCode: '' };
    }
    
    // Update the specific field
    addressData = {
      ...addressData,
      [field]: value
    };
    
    if (contactIndex !== -1) {
      // Update existing contact
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        value: JSON.stringify(addressData)
      };
    } else {
      // Create new contact
      updatedContacts.push({
        type: contactType as 'address',
        value: JSON.stringify(addressData),
        isPrimary: false
      });
    }
    
    setEditFormData({
      ...editFormData,
      contacts: updatedContacts
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && currentClient) {
      try {
        // Format the client data to match the API expectations
        const clientData = {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          organizationName: editFormData.organizationName,
          clientType: editFormData.clientType,
          contacts: editFormData.contacts.filter(c => c.value.trim() !== ''),
          kycVerified: editFormData.kycVerified,
          conflictCheckCompleted: editFormData.conflictCheckStatus === 'cleared' ? true : false,
          notes: editFormData.note
        };
        
        await dispatch(updateClient({
          clientId: id,
          clientData: clientData
        }) as any);
        
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update client:', error);
      }
    }
  };

  const handleDeleteClient = async () => {
    if (id) {
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
  const clientCases = currentClient?.cases
  const clientDocuments = currentClient?.kycDocuments

  const getClientName = () => {
    return currentClient.type === 'individual' ?
      currentClient.firstName + " " + currentClient.lastName :
      currentClient.organizationName;
  };

  return (
    <div className="client-detail-container">
      <div className="client-header">
        <div className="client-header-left">
          <h3>{getClientName()}</h3>
        </div>
        <div style={{display: "flex", justifyContent: "space-between"}}>
          <Button variant="secondary" onClick={() => isEditing ? setIsEditing(false) : navigate('/clients')}>
            <FaIcons.FaArrowLeft />{" "}Back
          </Button>
          <div>
          {!isEditing && (
            <>
              <Button variant="secondary" onClick={handleEditToggle}>
                <FaIcons.FaEdit /> Edit Client
              </Button>
              <span>  </span>
              <Button variant="danger" onClick={handleDeleteClient}>
                <FaIcons.FaTrash /> Delete Client
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-client-form-container">
          <h2>Edit Client</h2>
          <form onSubmit={handleEditSubmit} className="edit-client-form">
            <div className="form-group">
              <label htmlFor="clientType">Client Type</label>
              <select
                id="clientType"
                name="clientType"
                value={editFormData.clientType}
                onChange={handleEditChange}
                required
              >
                <option value="personal">Individual</option>
                <option value="organization">Organization</option>
              </select>
            </div>

            {editFormData.clientType === 'individual' ? (
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
                  required={editFormData.clientType === 'individual' ? false : true}
                />
              </div>
            )}

            <h3>Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contacts.email.value">Email</label>
                <input
                  type="email"
                  id="contacts.email.value"
                  name="contacts.email.value"
                  value={editFormData.contacts.find(c => c.type === 'email')?.value || ''}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contacts.phone.value">Phone</label>
                <input
                  type="tel"
                  id="contacts.phone.value"
                  name="contacts.phone.value"
                  value={editFormData.contacts.find(c => c.type === 'phone')?.value || ''}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <h4>Address</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contacts.address.street">Street Address</label>
                <input
                  type="text"
                  id="contacts.address.street"
                  name="contacts.address.street"
                  value={JSON.parse(editFormData.contacts.find(c => c.type === 'address')?.value || '{"street":""}').street}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contacts.address.city">City</label>
                <input
                  type="text"
                  id="contacts.address.city"
                  name="contacts.address.city"
                  value={JSON.parse(editFormData.contacts.find(c => c.type === 'address')?.value || '{"city":""}').city}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contacts.address.country">Country</label>
                <input
                  type="text"
                  id="contacts.address.country"
                  name="contacts.address.country"
                  value={JSON.parse(editFormData.contacts.find(c => c.type === 'address')?.value || '{"country":""}').country}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contacts.address.postalCode">Postal Code</label>
                <input
                  type="text"
                  id="contacts.address.postalCode"
                  name="contacts.address.postalCode"
                  value={JSON.parse(editFormData.contacts.find(c => c.type === 'address')?.value || '{"postalCode":""}').postalCode}
                  onChange={handleAddressChange}
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
                  <option value="cleared">Cleared</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
            
            <h3>Client Notes</h3>
            <div className="form-group">
              <label htmlFor="note">Notes</label>
              <textarea
                id="note"
                name="note"
                value={editFormData.note}
                onChange={handleEditChange}
                rows={4}
                className="form-textarea"
              />
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
              { id: 'cases', label: `Cases (${clientCases?.length})` },
              { id: 'documents', label: `Documents (${clientDocuments?.length})` },
              { id: 'notes', label: 'Client Note' }
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
                    {
                     currentClient && currentClient.contactInfo.map(c => {
                        if (c.type === 'address') {
                          return (
                            <DetailItem key={c._id} label={c.type}>
                              {(() => {
                                try {
                                  const addressData = JSON.parse(c.value);
                                  return (
                                    <div style={{display: 'flex'}}>
                                      {addressData.street && <div>{addressData.street}, </div>}
                                      {addressData.city && addressData.postalCode && (
                                        <div>{addressData.city}, {addressData.postalCode}, </div>
                                      )}
                                      {addressData.country && <div>{addressData.country}</div>}
                                      {!addressData.street && !addressData.city && !addressData.country && !addressData.postalCode && 'No address provided'}
                                    </div>
                                  );
                                } catch (e) {
                                  // Fallback for legacy address format
                                  return c.value || 'No address provided';
                                }
                              })()}
                            </DetailItem>
                          );
                        } else {
                          return <DetailItem key={c._id} label={c.type} value={c.value} />;
                        }
                      })
                    }
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
                          status={currentClient.conflictCheckStatus === undefined ? 'pending' : currentClient.conflictCheckStatus} 
                        />
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
                      onClick={() => navigate(`/cases/new-case`)}
                    >
                      <FaIcons.FaPlus /> Create New Case
                    </Button>
                  }
                >
                  <DataTable
                    columns={[
                      { header: 'Case Number', accessor: 'caseNumber' },
                      { header: 'Title', accessor: 'title' },
                      { header: 'Type', accessor: row => row.type.replace('_', ' ') },
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
                    onRowClick={row => navigate(`/cases/${row._id}`)}
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
                      onClick={() => setIsDocumentUploadModalOpen(true)}
                    >
                      <FaIcons.FaUpload /> Upload Document
                    </Button>
                  }
                >
                  {/* Document Upload Modal */}
                  <DocumentUploadModal 
                    isOpen={isDocumentUploadModalOpen}
                    onClose={() => setIsDocumentUploadModalOpen(false)}
                    clientId={id}
                  />
                  {clientDocuments.length > 0 ? (
                    <div className="documents-grid">
                      {clientDocuments.map(doc => (
                        <DocumentCard
                          key={doc._id}
                          document={doc}
                          onPreview={() => window.open(doc.versions[0].filePath, '_blank')}
                          // onEdit={() => navigate(`/documents/${doc._id}`)}
                          onDownload={() => window.open(doc.versions[0].filePath, '_blank')}
                          // onDelete={() => {
                          //   if (window.confirm('Are you sure you want to delete this document?')) {
                          //     // Handle document deletion logic here
                          //     console.log('Delete document:', doc._id);
                          //   }
                          // }}
                        />
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
                <DetailView title="Client Note">
                  <DetailSection title="Clien Note">
                    <div className="note-item">
                      <div className="note-content">{currentClient.notes}</div>
                    </div>
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