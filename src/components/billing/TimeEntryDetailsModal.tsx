import React from 'react';
import { Modal, Button } from '../common';
import * as FaIcons from 'react-icons/fa';
import './TimeEntryDetailsModal.css';

interface TimeEntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntry: any;
  onEdit?: () => void;
}

const TimeEntryDetailsModal: React.FC<TimeEntryDetailsModalProps> = ({
  isOpen,
  onClose,
  timeEntry,
  onEdit
}) => {
  if (!timeEntry) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Time Entry Details"
      size="medium"
    >
      <div className="time-entry-details">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(timeEntry.createdAt || timeEntry.date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Start Time</span>
              <span className="detail-value">{formatDateTime(timeEntry.startTime)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End Time</span>
              <span className="detail-value">{formatDateTime(timeEntry.endTime)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{formatDuration(timeEntry.duration)}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Description</h3>
          <p className="detail-description">{timeEntry.description}</p>
        </div>

        <div className="detail-section">
          <h3>Billing Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Billable</span>
              <span className="detail-value">{timeEntry.billable ? 'Yes' : 'No'}</span>
            </div>
            {timeEntry.billable && (
              <>
                <div className="detail-item">
                  <span className="detail-label">Billing Rate</span>
                  <span className="detail-value">{formatCurrency(timeEntry.billingRate || 0)}/hr</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Billable Amount</span>
                  <span className="detail-value">
                    {formatCurrency((timeEntry.billingRate || 0) * (timeEntry.duration / 60))}
                  </span>
                </div>
              </>
            )}
            <div className="detail-item">
              <span className="detail-label">Invoiced</span>
              <span className="detail-value">{timeEntry.invoiced ? 'Yes' : 'No'}</span>
            </div>
            {timeEntry.invoiced && timeEntry.invoice && (
              <div className="detail-item">
                <span className="detail-label">Invoice Reference</span>
                <span className="detail-value">{timeEntry.invoice}</span>
              </div>
            )}
          </div>
        </div>

        {timeEntry.task && (
          <div className="detail-section">
            <h3>Related Task</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Task</span>
                <span className="detail-value">{timeEntry.task.title || 'N/A'}</span>
              </div>
              {timeEntry.task.case && (
                <div className="detail-item">
                  <span className="detail-label">Case</span>
                  <span className="detail-value">{timeEntry.task.case.title || 'N/A'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TimeEntryDetailsModal;