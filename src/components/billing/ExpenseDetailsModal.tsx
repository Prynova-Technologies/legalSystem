import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Button, StatusBadge, Toggle } from '../common';
import * as FaIcons from 'react-icons/fa';
import { updateExpense } from '../../store/slices/billingSlice';
import { RootState } from '../../store';
import './TimeEntryDetailsModal.css'; // Reuse the same styling

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any;
  onEdit?: () => void;
}

const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Check if user is admin or accountant
  const canApprove = user?.role === 'admin' || user?.role === 'accountant';

  if (!expense) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleApprovalToggle = async (approved: boolean) => {
    try {
      await dispatch(updateExpense({
        expenseId: expense._id,
        expenseData: { 
          isApproved: approved,
          approvedBy: user?._id // Include the current user's ID when updating approval status
        }
      }) as any);
    } catch (error) {
      console.error('Error updating expense approval status:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Details"
      size="medium"
    >
      <div className="time-entry-details">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(expense.date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{expense.category}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount</span>
              <span className="detail-value">{formatCurrency(expense.amount)}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Description</h3>
          <p className="detail-description">{expense.description}</p>
        </div>

        <div className="detail-section">
          <h3>Billing Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Billable</span>
              <span className="detail-value">
                <StatusBadge status={expense.billable ? 'Yes' : 'No'} />
              </span>
            </div>
            {expense.billable && (
              <div className="detail-item">
                <span className="detail-label">Billable Amount</span>
                <span className="detail-value">{formatCurrency(expense.billableAmount || expense.amount)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Invoiced</span>
              <span className="detail-value">{expense.invoiced ? 'Yes' : 'No'}</span>
            </div>
            {expense.invoiced && expense.invoice && (
              <div className="detail-item">
                <span className="detail-label">Invoice Reference</span>
                <span className="detail-value">{expense.invoice}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Approval Status</span>
              {canApprove ? (
                <Toggle
                  checked={expense.isApproved}
                  onChange={(e) => handleApprovalToggle(e.target.checked)}
                  label={expense.isApproved ? 'Approved' : 'Not Approved'}
                />
              ) : (
                <span className="detail-value">
                  <StatusBadge status={expense.isApproved ? 'Approved' : 'Not Approved'} />
                </span>
              )}
            </div>
            <div className="detail-item">
              <span className="detail-label">Created By</span>
              <span className="detail-value">
                {expense.submittedBy && typeof expense.submittedBy === 'object' 
                  ? `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}` 
                  : 'Unknown'}
              </span>
            </div>
            {expense.isApproved && (
              <div className="detail-item">
                <span className="detail-label">Approved By</span>
                <span className="detail-value">
                  {expense.approvedBy && typeof expense.approvedBy === 'object' 
                    ? `${expense.approvedBy.firstName} ${expense.approvedBy.lastName}` 
                    : 'Not specified'}
                </span>
              </div>
            )}
          </div>
        </div>

        {expense.case && (
          <div className="detail-section">
            <h3>Related Case</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Case</span>
                <span className="detail-value">{expense.case.title || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {onEdit && (
            <Button variant="primary" onClick={onEdit}>
              <FaIcons.FaEdit /> Edit
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseDetailsModal;