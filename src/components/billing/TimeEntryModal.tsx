import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createTimeEntry, updateTimeEntry } from '../../store/slices/billingSlice';
import { fetchCases } from '../../store/slices/casesSlice';
import { fetchTasks } from '../../store/slices/tasksSlice';

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
  const cases = useSelector((state: any) => state.cases.cases);
  const tasks = useSelector((state: any) => state.tasks.tasks);
  
  useEffect(() => {
    dispatch(fetchCases() as any);
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  const formSections: FormSection[] = [
    {
      title: 'Time Entry Details',
      fields: [
        {
          id: 'task',
          label: 'Task',
          type: 'select',
          required: true,
          options: tasks?.map((t: any) => ({
            value: t._id,
            label: t.title
          })) || []
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          placeholder: 'Enter time entry description'
        },
        {
          id: 'startTime',
          label: 'Start Date & Time',
          type: 'datetime-local',
          required: true
        },
        {
          id: 'endTime',
          label: 'End Date & Time',
          type: 'datetime-local',
          required: true
        },
        {
          id: 'duration',
          label: 'Duration (minutes)',
          type: 'number',
          placeholder: 'Auto-calculated from start/end times',
          disabled: true
        },
        {
          id: 'billable',
          label: 'Billable',
          type: 'checkbox',
          defaultValue: true
        },
        {
          id: 'billingRate',
          label: 'Billing Rate',
          type: 'number',
          placeholder: 'Enter hourly rate',
          conditional: { field: 'billable', value: true }
        },
        {
          id: 'invoiced',
          label: 'Invoiced',
          type: 'checkbox',
          defaultValue: false
        },
        {
          id: 'invoice',
          label: 'Invoice Reference',
          type: 'text',
          placeholder: 'Enter invoice reference',
          conditional: { field: 'invoiced', value: true }
        },
      ]
    }
  ];

  // Calculate duration when start and end times change
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / (1000 * 60)); // Convert to minutes
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Validate required fields
      const requiredFields = ['task', 'description', 'startTime', 'endTime'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      // Calculate duration from start and end times
      const duration = calculateDuration(formData.startTime, formData.endTime);
      if (duration <= 0) {
        alert('End time must be after start time');
        return;
      }
      
      // Add duration to form data
      const updatedFormData = {
        ...formData,
        duration,
        invoiced: formData.invoiced === '' || formData.invoiced === undefined ? false : true
      };
      
      // Format tags if they're provided as an array
      if (updatedFormData.tags && Array.isArray(updatedFormData.tags)) {
        updatedFormData.tags = updatedFormData.tags.join(',');
      }
      
      if (timeEntry) {
        await dispatch(updateTimeEntry({ id: timeEntry._id, ...updatedFormData }) as any);
      } else {
        await dispatch(createTimeEntry(updatedFormData) as any);
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