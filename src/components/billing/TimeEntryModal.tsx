import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createTimeEntry, updateTimeEntry } from '../../store/slices/billingSlice';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntry?: any;
  onSuccess?: () => void;
}

const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  timeEntry,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSections: FormSection[] = [
    {
      title: 'Time Entry Details',
      fields: [
        {
          id: 'date',
          label: 'Date',
          type: 'date',
          required: true
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          placeholder: 'Enter time entry description'
        },
        {
          id: 'duration',
          label: 'Duration (minutes)',
          type: 'number',
          required: true,
          placeholder: 'Enter duration in minutes'
        },
        {
          id: 'billable',
          label: 'Billable',
          type: 'checkbox'
        }
      ]
    }
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      if (timeEntry) {
        await dispatch(updateTimeEntry({ id: timeEntry.id, ...formData }) as any);
      } else {
        await dispatch(createTimeEntry(formData) as any);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting time entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={timeEntry ? 'Edit Time Entry' : 'Add Time Entry'}
      size="medium"
    >
      <DataForm
        sections={formSections}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={timeEntry}
        submitButtonText={timeEntry ? 'Update' : 'Create'}
        isLoading={isSubmitting}
      />
    </Modal>
  );
};

export default TimeEntryModal;