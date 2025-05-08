import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchCaseById, updateCase, addCaseNote } from '../store/slices/casesSlice';
import { fetchTasks } from '../store/slices/tasksSlice';
import { fetchDocuments } from '../store/slices/documentsSlice';
import { CaseStatus, CaseType, Note } from '../types';
import { v4 as uuidv4 } from 'uuid';
import '../styles/caseDetail.css';
import { DocumentUploadModal, DocumentCard } from '../components/documents';
import { FaIcons } from 'react-icons/fa';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentCase, isLoading, error } = useSelector((state: RootState) => state.cases);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { documents } = useSelector((state: RootState) => state.documents);

  console.log(currentCase)
  
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '' as CaseStatus,
    caseType: '' as CaseType
  });
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchCaseById(id) as any);
      dispatch(fetchTasks() as any);
      dispatch(fetchDocuments() as any);
    }
  }, [dispatch, id]);

  const _handleRefreshData = async () => {
    dispatch(fetchCaseById(id) as any);
  }

  useEffect(() => {
    if (currentCase) {
      setEditFormData({
        title: currentCase.title,
        description: currentCase.description,
        status: currentCase.status,
        caseType: currentCase.caseType
      });
    }
  }, [currentCase]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && currentCase) {
      try {
        await dispatch(updateCase({
          caseId: id,
          caseData: {
            ...editFormData,
            caseType: editFormData.caseType as CaseType
          }
        }) as any);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update case:', error);
      }
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && noteContent.trim()) {
      const now = new Date().toISOString();
      const newNote: Note = {
        id: uuidv4(),
        content: noteContent,
        caseId: id,
        createdBy: '1', // Current user ID would be used here
        createdAt: now,
        updatedAt: now
      };

      try {
        // await dispatch(addCaseNote({ caseId: id, note: newNote }) as any);
        setNoteContent('');
      } catch (error) {
        console.error('Failed to add note:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading case details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!currentCase) {
    return <div className="error-message">Case not found</div>;
  }

  // Filter case-related tasks and documents
  const caseTasks = currentCase.tasks;
  const caseDocuments = currentCase.documents;

  return (
    <div className="case-detail-container">
      <div className="case-header">
        <div className="case-header-left">
          <h1>{currentCase.title}</h1>
          <div className="case-meta">
            <span className="case-number">Case #{currentCase.caseNumber}</span>
            <span className={`status-badge status-${currentCase.status.toLowerCase()}`}>
              {currentCase.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="case-header-actions">
          {!isEditing && (
            <button onClick={handleEditToggle} className="btn btn-secondary">
              Edit Case
            </button>
          )}
          <button onClick={() => navigate('/cases')} className="btn btn-outline">
            Back to Cases
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-case-form-container">
          <h2>Edit Case</h2>
          <form onSubmit={handleEditSubmit} className="edit-case-form">
            <div className="form-group">
              <label htmlFor="title">Case Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditChange}
                  required
                >
                  {Object.values(CaseStatus).map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="caseType">Case Type</label>
                <select
                  id="caseType"
                  name="caseType"
                  value={editFormData.caseType}
                  onChange={handleEditChange}
                  required
                >
                  {Object.values(CaseType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
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
        <div className="case-tabs">
          <div className="tabs-header">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => handleTabChange('tasks')}
            >
              Tasks ({caseTasks.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => handleTabChange('documents')}
            >
              Documents ({caseDocuments?.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => handleTabChange('notes')}
            >
              Notes ({currentCase.notes?.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => handleTabChange('activities')}
            >
              Activities ({currentCase.activities?.length || 0})
            </button>
            <button
              className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`}
              onClick={() => handleTabChange('billing')}
            >
              Billing
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="case-details-grid">
                  <div className="detail-card">
                    <h3>Case Information</h3>
                    <div className="detail-item">
                      <span className="detail-label">Case Type:</span>
                      <span className="detail-value">{currentCase.type.replace('_', ' ')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Open Date:</span>
                      <span className="detail-value">{formatDate(currentCase.openDate)}</span>
                    </div>
                    {currentCase.closeDate && (
                      <div className="detail-item">
                        <span className="detail-label">Close Date:</span>
                        <span className="detail-value">{formatDate(currentCase.closeDate)}</span>
                      </div>
                    )}
                    {currentCase.assignedAttorneys && currentCase.assignedAttorneys.length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Primary Attorney:</span>
                        <span className="detail-value">
                          {currentCase.assignedAttorneys.find(attorney => attorney.isPrimary)?.attorney?.firstName + ' ' + 
                           currentCase.assignedAttorneys.find(attorney => attorney.isPrimary)?.attorney?.lastName || 'Not assigned'}
                        </span>
                      </div>
                    )}
                    {currentCase.assignedAttorneys && currentCase.assignedAttorneys.filter(attorney => !attorney.isPrimary).length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Assigned Attorneys:</span>
                        <span className="detail-value">
                          {currentCase.assignedAttorneys
                            .filter(attorney => !attorney.isPrimary)
                            .map(attorney => attorney.attorney?.firstName + ' ' + attorney.attorney?.lastName)
                            .join(', ') || 'None'}
                        </span>
                      </div>
                    )}
                    {currentCase.assignedParalegals && currentCase.assignedParalegals.length > 0 && (
                      <div className="detail-item">
                        <span className="detail-label">Assigned Paralegals:</span>
                        <span className="detail-value">
                          {currentCase.assignedParalegals.map(paralegal => 
                            typeof paralegal === 'string' ? paralegal : 
                            paralegal.firstName + ' ' + paralegal.lastName).join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Description:</span>
                      <p className="detail-value description">{currentCase.description}</p>
                    </div>
                  </div>

                  <div className="detail-card">
                    <h3>Court Information</h3>
                    {currentCase.courtDetails ? (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Court:</span>
                          <span className="detail-value">{currentCase.courtDetails.court}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Jurisdiction:</span>
                          <span className="detail-value">{currentCase.courtDetails.jurisdiction}</span>
                        </div>
                        {currentCase.courtDetails.judge && (
                          <div className="detail-item">
                            <span className="detail-label">Judge:</span>
                            <span className="detail-value">{currentCase.courtDetails.judge}</span>
                          </div>
                        )}
                        {currentCase.courtDetails.caseNumber && (
                          <div className="detail-item">
                            <span className="detail-label">Filing Number:</span>
                            <span className="detail-value">{currentCase.courtDetails.caseNumber}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="empty-state">No court information available</p>
                    )}
                  </div>

                  <div className="detail-card">
                    <h3>Related Parties</h3>
                    {currentCase.parties.length > 0 ? (
                      <div className="related-parties-list">
                        {currentCase.parties.map(party => (
                          <div key={party.id} className="related-party-item">
                            <div className="party-header">
                              <span className="party-name">{party.name}</span>
                              <span className="party-type">{party.type}</span>
                            </div>
                            {party.contactInfo && (
                              <div className="party-contact">
                                <div>{party.contactInfo.email}</div>
                                <div>{party.contactInfo.phone}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">No related parties</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="tasks-tab">
                <div className="tab-header-actions">
                  <button className="btn btn-primary" onClick={() => navigate(`/tasks/new?caseId=${id}`)}>Add Task</button>
                </div>
                
                {caseTasks.length > 0 ? (
                  <div className="tasks-list">
                    {caseTasks.map(task => (
                      <div key={task.id} className={`task-item priority-${task.priority}`}>
                        <div className="task-header">
                          <h4 className="task-title">{task.title}</h4>
                          <span className={`task-status status-${task.status.replace('_', '-')}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="task-description">{task.description}</p>
                        <div className="task-meta">
                          <span className="task-due-date">Due: {formatDate(task.dueDate)}</span>
                          <span className="task-priority">Priority: {task.priority}</span>
                        </div>
                        <button className="btn btn-sm" onClick={() => navigate(`/tasks/${task.id}`)}>View Details</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No tasks associated with this case</p>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-tab">
                <div className="tab-header-actions">
                  <button className="btn btn-primary" onClick={() => setIsDocumentUploadModalOpen(true)}>
                  📄 Upload Document
                  </button>
                </div>
                
                {/* Document Upload Modal */}
                <DocumentUploadModal 
                  isOpen={isDocumentUploadModalOpen}
                  onClose={() => setIsDocumentUploadModalOpen(false)}
                  clientId={id}
                  onUploadFinish={_handleRefreshData}
                />
                
                {caseDocuments.length > 0 ? (
                  <div className="documents-grid">
                    {caseDocuments.map(doc => (
                      <DocumentCard
                        key={doc._id}
                        document={doc}
                        onPreview={() => window.open(doc.versions[0].filePath, '_blank')}
                        onDownload={() => window.open(doc.versions[0].filePath, '_blank')}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No documents associated with this case</p>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="notes-tab">
                <div className="add-note-section">
                  <h3>Add Note</h3>
                  <form onSubmit={handleAddNote} className="add-note-form">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Enter your note here..."
                      rows={4}
                      required
                    />
                    <button type="submit" className="btn btn-primary">Add Note</button>
                  </form>
                </div>
                
                <div className="notes-list">
                  <h3>Case Notes</h3>
                  {currentCase.notes.length > 0 ? (
                    currentCase.notes.map(note => (
                      <div key={note._id} className="note-item">
                        <div className="note-content">{note.content}</div>
                        <div className="note-meta">
                          <span>Created: {formatDate(note.createdAt)}</span>
                          <span>Created By: {note.createdBy.fullName}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No notes for this case</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="activities-tab">
                <h3>Case Activity Timeline</h3>
                {currentCase.activities && currentCase.activities.length > 0 ? (
                  <div className="timeline">
                    {currentCase.activities.map(activity => (
                      <div key={activity._id} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-date">{formatDate(activity.timestamp)}</div>
                          <div className="timeline-title">
                            <span className={`activity-badge activity-${activity.action}`}>
                              {activity.action.replace('_', ' ')}
                            </span>
                            {activity.action === 'create' && 'Case Created'}
                            {activity.action === 'update' && 'Case Updated'}
                            {activity.action === 'delete' && 'Case Deleted'}
                            {activity.action === 'add_party' && 'Party Added'}
                            {activity.action === 'remove_party' && 'Party Removed'}
                            {!['create', 'update', 'delete', 'add_party', 'remove_party'].includes(activity.action) && 
                              activity.action.replace('_', ' ')}
                          </div>
                          <div className="timeline-description">{activity.description}</div>
                          {activity.performedBy && (
                            <div className="timeline-user">
                              By: {typeof activity.performedBy === 'string' 
                                ? activity.performedBy 
                                : `${activity.performedBy.firstName} ${activity.performedBy.lastName}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No activities recorded for this case</p>
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="billing-tab">
                <div className="billing-info-section">
                  <h3>Billing Information</h3>
                  <div className="billing-details">
                    <div className="detail-item">
                      <span className="detail-label">Billing Type:</span>
                      <span className="detail-value">{currentCase.billingInfo?.billingType?.replace('_', ' ')}</span>
                    </div>
                    
                    {currentCase.billingInfo?.hourlyRate && (
                      <div className="detail-item">
                        <span className="detail-label">Hourly Rate:</span>
                        <span className="detail-value">${currentCase.billingInfo?.hourlyRate}/hr</span>
                      </div>
                    )}
                    
                    {currentCase.billingInfo?.flatRate && (
                      <div className="detail-item">
                        <span className="detail-label">Flat Rate:</span>
                        <span className="detail-value">${currentCase.billingInfo?.flatRate}</span>
                      </div>
                    )}
                    
                    {currentCase.billingInfo?.contingencyPercentage && (
                      <div className="detail-item">
                        <span className="detail-label">Contingency:</span>
                        <span className="detail-value">{currentCase.billingInfo?.contingencyPercentage}%</span>
                      </div>
                    )}
                    
                    {currentCase.billingInfo?.retainerAmount && (
                      <div className="detail-item">
                        <span className="detail-label">Retainer Amount:</span>
                        <span className="detail-value">${currentCase.billingInfo?.retainerAmount}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="time-entries-section">
                  <div className="section-header">
                    <h3>Time Entries</h3>
                    <button className="btn btn-primary" onClick={() => navigate(`/billing/time-entry/new?caseId=${id}`)}>Add Time Entry</button>
                  </div>
                  
                  {currentCase.billingInfo?.timeEntries.length > 0 ? (
                    <table className="time-entries-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Duration</th>
                          <th>Billable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCase.billingInfo.timeEntries.map(entry => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.description}</td>
                            <td>{(entry.duration / 60).toFixed(2)} hrs</td>
                            <td>{entry.billable ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-state">No time entries recorded</p>
                  )}
                </div>
                
                <div className="expenses-section">
                  <div className="section-header">
                    <h3>Expenses</h3>
                    <button className="btn btn-primary" onClick={() => navigate(`/billing/expense/new?caseId=${id}`)}>Add Expense</button>
                  </div>
                  
                  {currentCase.billingInfo?.expenses.length > 0 ? (
                    <table className="expenses-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Category</th>
                          <th>Billable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCase.billingInfo?.expenses?.map(expense => (
                          <tr key={expense.id}>
                            <td>{formatDate(expense.date)}</td>
                            <td>{expense.description}</td>
                            <td>${expense.amount.toFixed(2)}</td>
                            <td>{expense.category}</td>
                            <td>{expense.billable ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-state">No expenses recorded</p>
                  )}
                </div>
                
                <div className="invoices-section">
                  <div className="section-header">
                    <h3>Invoices</h3>
                    <button className="btn btn-primary" onClick={() => navigate(`/billing/invoice/new?caseId=${id}`)}>Create Invoice</button>
                  </div>
                  
                  {currentCase.billingInfo?.invoices?.length > 0 ? (
                    <table className="invoices-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCase.billingInfo?.invoices?.map(invoice => (
                          <tr key={invoice.id}>
                            <td>{invoice.invoiceNumber}</td>
                            <td>{formatDate(invoice.issueDate)}</td>
                            <td>{formatDate(invoice.dueDate)}</td>
                            <td>${invoice.total.toFixed(2)}</td>
                            <td>
                              <span className={`invoice-status status-${invoice.status}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm" onClick={() => navigate(`/billing/invoice/${invoice.id}`)}>View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-state">No invoices generated</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;