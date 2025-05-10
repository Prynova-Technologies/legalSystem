import React from 'react';
import { Document, DocumentType } from '../../types/documentTypes';
import { StatusBadge, Button } from '../common';
import * as FaIcons from 'react-icons/fa';
import './DocumentCard.css';

// Extended document interface that includes populated fields from backend
export interface DocumentWithPopulatedFields extends Omit<Document, 'client' | 'createdBy'> {
  client: {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    id: string;
  };
  createdBy: {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    id: string;
  };
}

interface DocumentCardProps {
  document: DocumentWithPopulatedFields;
  onPreview?: (document: DocumentWithPopulatedFields) => void;
  onDownload?: (document: DocumentWithPopulatedFields) => void;
  onDelete?: (document: DocumentWithPopulatedFields) => void;
  onEdit?: (document: DocumentWithPopulatedFields) => void;
  className?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreview,
  onDownload,
  onDelete,
  onEdit,
  className = ''
}) => {
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get document type icon based on document type
  const getDocumentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case DocumentType.PLEADING.toLowerCase():
        return <FaIcons.FaGavel />;
      case DocumentType.MOTION.toLowerCase():
        return <FaIcons.FaFileSignature />;
      case DocumentType.BRIEF.toLowerCase():
        return <FaIcons.FaFileAlt />;
      case DocumentType.CORRESPONDENCE.toLowerCase():
        return <FaIcons.FaEnvelope />;
      case DocumentType.CONTRACT.toLowerCase():
        return <FaIcons.FaFileContract />;
      case DocumentType.EVIDENCE.toLowerCase():
        return <FaIcons.FaBalanceScale />;
      case DocumentType.FORM.toLowerCase():
        return <FaIcons.FaWpforms />;
      case DocumentType.INVOICE.toLowerCase():
        return <FaIcons.FaFileInvoiceDollar />;
      case DocumentType.NOTE.toLowerCase():
        return <FaIcons.FaStickyNote />;
      case DocumentType.KYC.toLowerCase():
        return <FaIcons.FaIdCard />;
      default:
        return <FaIcons.FaFile />;
    }
  };

  return (
    <div className={`document-card ${className}`}>
      <div className="document-card-header">
        <div className="document-icon">
          {getDocumentTypeIcon(document.documentType)}
        </div>
        <div className="document-title">
          <h4>{document.title}</h4>
          <span className="document-type">{document.documentType}</span>
        </div>
      </div>
      
      <div className="document-card-body">
        {document.description && (
          <p className="document-description">{document.description}</p>
        )}
        
        <div className="document-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">{document.createdAt ? formatDate(document.createdAt) : 'N/A'}</span>
          </div>
          
          <div className="metadata-item">
            <span className="metadata-label">By:</span>
            <span className="metadata-value">{document.createdBy?.fullName || 'Unknown'}</span>
          </div>

          <div className="metadata-item">
            <span className="metadata-label">{document.client ? 'Client:' : 'Case:'}</span>
            <span className="metadata-value">{document.client ? document.client.firstName + " " + document.client.lastName : document.case.title}</span>
          </div>
          
          <div className="metadata-item">
            <span className="metadata-label">Version:</span>
            <span className="metadata-value">{document.currentVersion}</span>
          </div>
        </div>
        
        {document.tags && document.tags.length > 0 && (
          <div className="document-tags">
            {document.tags.map((tag, index) => (
              <span key={index} className="document-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      <div className="document-card-footer">
        {onPreview && (
          <Button variant="secondary" size="small" onClick={() => onPreview(document)}>
            <FaIcons.FaEye /> Preview
          </Button>
        )}
        {onDownload && (
          <Button variant="secondary" size="small" onClick={() => onDownload(document)}>
            <FaIcons.FaDownload /> Download
          </Button>
        )}
        {onEdit && (
          <Button variant="secondary" size="small" onClick={() => onEdit(document)}>
            <FaIcons.FaEdit /> Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" size="small" onClick={() => onDelete(document)}>
            <FaIcons.FaTrash />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;