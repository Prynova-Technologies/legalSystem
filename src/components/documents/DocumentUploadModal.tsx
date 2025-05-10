import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { DocumentType } from '../../types/documentTypes';
import { uploadFile } from '../../services/firebaseService';
import { createDocument } from '../../services/documentService';
import { fetchDocuments, uploadDocument } from '../../store/slices/documentsSlice';
import { getAllClients } from '../../services/clientService';
import { caseService } from '../../services/caseService';
import { fetchCases } from '../../store/slices/casesSlice';
import { fetchClients } from '../../store/slices/clientsSlice';
import { Button } from '../common';
import './DocumentUploadModal.css';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  onUploadFinish: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, clientId, onUploadFinish }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { cases } = useSelector((state: RootState) => state.cases);
  const { clients } = useSelector((state: RootState) => state.clients);
  const token = localStorage.getItem('token') || '';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // For document association
  const [documentFor, setDocumentFor] = useState<'client' | 'case'>(clientId ? 'client' : 'client');
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [caseSearchTerm, setCaseSearchTerm] = useState('');

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
      setDocumentFor('client');
      return;
    }

    dispatch(fetchCases() as any);
    // Load clients and cases when modal opens
    dispatch(fetchClients() as any);
  }, [dispatch, clientId]);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      // If clientId is provided, set it as the selected client
      if (clientId) {
        setSelectedClientId(clientId);
        setDocumentFor('client');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDocumentType(DocumentType.OTHER);
    setFile(null);
    setUploadProgress(0);
    setError(null);
    if (!clientId) {
      setDocumentFor('client');
      setSelectedClientId('');
      setSelectedCaseId('');
      setClientSearchTerm('');
      setCaseSearchTerm('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!title) {
      setError('Please enter a title for the document');
      return;
    }

    if (!user.data || !user.data._id) {
      setError('User information is missing');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);


      // Upload file to Firebase
      const filePath = await uploadFile(
        file,
        "lawfirm",
        (progress) => setUploadProgress(progress)
      );

      // Validate document association
      if (!clientId && documentFor === 'client' && !selectedClientId) {
        setError('Please select a client');
        setIsUploading(false);
        return;
      }
      
      if (!clientId && documentFor === 'case' && !selectedCaseId) {
        setError('Please select a case');
        setIsUploading(false);
        return;
      }
      
      // Create document in the backend
      const documentData = {
        title,
        description,
        documentType,
        client: documentFor === 'client' ? (clientId || selectedClientId) : undefined,
        case: documentFor === 'case' ? selectedCaseId : undefined,
        fileName: filePath.name,
        filePath: filePath.url,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: user.data._id,
        currentVersion: 1,
        createdBy: user.data._id,
        isTemplate: false,
        isDeleted: false,
      };

      await dispatch(uploadDocument(documentData));

      //signal parent file
      // onUploadFinish()
      
      // Close modal and reset form
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Upload Document</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          {!clientId && (
            <div className="form-group">
              <label htmlFor="documentFor">Document For *</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="documentFor"
                    value="client"
                    checked={documentFor === 'client'}
                    onChange={() => setDocumentFor('client')}
                  />
                  Client Document
                </label>
                <label>
                  <input
                    type="radio"
                    name="documentFor"
                    value="case"
                    checked={documentFor === 'case'}
                    onChange={() => setDocumentFor('case')}
                  />
                  Case Document
                </label>
              </div>
            </div>
          )}
          
          {!clientId && documentFor === 'client' && (
            <div className="form-group">
            <label htmlFor="caseSearch">Select Client *</label>
            <div className="case-search-container">
              <input
                type="text"
                id="caseSearch"
                placeholder="Search for a client..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="case-search-input"
              />
              {clientSearchTerm && (
                <div className="case-search-results">
                  {clients
                    .filter(c => 
                      c.firstName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                      c.lastName.toLowerCase().includes(clientSearchTerm.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="case-search-item"
                        onClick={() => {
                          setSelectedClientId(c.id)
                          setClientSearchTerm('')
                        }}
                      >
                        {c.firstName}: {c.lastName}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            {selectedClientId && (
              <div className="selected-case">
                Selected: {clients.find(c => c.id === selectedClientId)?.firstName || 'Unknown Case'}
              </div>
            )}
          </div>
          )}
          
          {!clientId && documentFor === 'case' && (
            <div className="form-group">
            <label htmlFor="caseSearch">Select Case *</label>
            <div className="case-search-container">
              <input
                type="text"
                id="caseSearch"
                placeholder="Search for a case..."
                value={caseSearchTerm}
                onChange={(e) => setCaseSearchTerm(e.target.value)}
                className="case-search-input"
              />
              {caseSearchTerm && (
                <div className="case-search-results">
                  {cases
                    .filter(c => 
                      c.title.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                      c.caseNumber.toLowerCase().includes(caseSearchTerm.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="case-search-item"
                        onClick={() => {
                          setSelectedCaseId(c.id)
                          setCaseSearchTerm('')
                        }}
                      >
                        {c.caseNumber}: {c.title}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            {selectedCaseId && (
              <div className="selected-case">
                Selected: {cases.find(c => c.id === selectedCaseId)?.title || 'Unknown Case'}
              </div>
            )}
          </div>
          )}
          
          <div className="form-group">
            <label htmlFor="documentType">Document Type *</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              required
            >
              {Object.values(DocumentType).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="file">File *</label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              required
            />
            {file && <p className="file-name">{file.name}</p>}
          </div>
          
          {isUploading && (
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              />
              <span className="progress-text">{Math.round(uploadProgress)}%</span>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-footer">
            <Button 
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              disabled={isUploading || !file}
              loading={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;