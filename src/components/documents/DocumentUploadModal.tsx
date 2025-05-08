import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { DocumentType } from '../../types/documentTypes';
import { uploadFile } from '../../services/firebaseService';
import { createDocument } from '../../services/documentService';
import { fetchDocuments } from '../../store/slices/documentsSlice';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onUploadFinish: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, clientId, onUploadFinish }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDocumentType(DocumentType.OTHER);
    setFile(null);
    setUploadProgress(0);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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

      // Create document in the backend
      const documentData = {
        title,
        description,
        documentType,
        client: clientId,
        fileName: filePath.name,
        filePath: filePath.url,
        uploadedBy: user.data._id,
        // versions: [
        //   {
        //     version: 1,
        //     fileName: file.name,
        //     filePath,
        //     uploadedBy: user.data._id,
        //     uploadedAt: new Date(),
        //   },
        // ],
        currentVersion: 1,
        createdBy: user.data._id,
        isTemplate: false,
        isDeleted: false,
      };

      await createDocument(documentData);
      
      // Refresh documents list
      dispatch(fetchDocuments() as any);

      //signal parent file
      onUploadFinish()
      
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
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isUploading || !file}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;