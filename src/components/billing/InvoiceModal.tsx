import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createInvoice, updateInvoice } from '../../store/slices/billingSlice';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  onSuccess?: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSections: FormSection[] = [
    {
      title: 'Invoice Details',
      fields: [
        {
          id: 'invoiceNumber',
          label: 'Invoice Number',
          type: 'text',
          required: true,
          placeholder: 'Enter invoice number'
        },
        {
          id: 'clientId',
          label: 'Client',
          type: 'select',
          required: true,
          options: [] // This should be populated with actual client data
        },
        {
          id: 'issueDate',
          label: 'Issue Date',
          type: 'date',
          required: true
        },
        {
          id: 'dueDate',
          label: 'Due Date',
          type: 'date',
          required: true
        },
        {
          id: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter any additional notes'
        }
      ]
    },
    {
      title: 'Payment Details',
      fields: [
        {
          id: 'subtotal',
          label: 'Subtotal',
          type: 'number',
          required: true,
          placeholder: 'Enter subtotal amount'
        },
        {
          id: 'tax',
          label: 'Tax',
          type: 'number',
          placeholder: 'Enter tax amount'
        },
        {
          id: 'total',
          label: 'Total',
          type: 'number',
          required: true,
          placeholder: 'Enter total amount'
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' }
          ]
        }
      ]
    }
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      // Ensure dates are not null before submitting
      const processedFormData = {
        ...formData,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0]
      };
      
      if (invoice) {
        await dispatch(updateInvoice({ id: invoice.id, ...processedFormData }) as any);
      } else {
        await dispatch(createInvoice(processedFormData) as any);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? 'Edit Invoice' : 'Create Invoice'}
      size="large"
    >
      <DataForm
        sections={formSections}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={invoice}
        submitButtonText={invoice ? 'Update' : 'Create'}
        isLoading={isSubmitting}
      />
    </Modal>
  );
};

export default InvoiceModal;