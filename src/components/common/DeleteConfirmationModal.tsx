import React from 'react';
import Modal from './Modal';
import Button from './Button';
import './CommonStyles.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item?',
  itemName,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {confirmButtonText}
          </Button>
        </div>
      }
    >
      <div className="delete-confirmation-content">
        <p>{message}</p>
        {itemName && (
          <p className="delete-item-name">"{itemName}"</p>
        )}
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;