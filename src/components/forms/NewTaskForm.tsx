import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataForm, FormSection } from '../common';
import { createTask } from '../../store/slices/tasksSlice';
import { Task } from '../../types';
import { AppDispatch } from '../../store';

interface NewTaskFormProps {
  onCancel?: () => void;
  caseId?: string; // Optional case ID if creating a task from a case detail page
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ onCancel, caseId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Format the data as needed for the API
      const taskData: Partial<Task> = {
        ...formData,
        caseId: caseId || formData.caseId,
        createdAt: new Date().toISOString(),
        status: 'not_started',
        updatedAt: new Date().toISOString(),
      };
      
      // Dispatch action to add the task
      await dispatch(createTask(taskData));
      
      // Navigate to the tasks list or back to the case detail
      if (caseId) {
        navigate(`/cases/${caseId}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const formSections: FormSection[] = [
    {
      title: 'Task Information',
      fields: [
        {
          id: 'title',
          label: 'Task Title',
          type: 'text',
          placeholder: 'Enter task title',
          required: true,
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Enter task description',
          required: true,
        },
      ],
    },
    {
      title: 'Task Details',
      fields: [
        {
          id: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: [
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ],
        },
        {
          id: 'dueDate',
          label: 'Due Date',
          type: 'date',
          required: true,
        },
        {
          id: 'estimatedTime',
          label: 'Estimated Time (hours)',
          type: 'number',
          placeholder: 'Enter estimated hours',
        },
        ...(!caseId ? [
          {
            id: 'caseId',
            label: 'Related Case',
            type: 'select' as const,
            options: [], // This would be populated from the cases in the store
          },
        ] : []),
      ],
    },
    {
      title: 'Assignment',
      fields: [
        {
          id: 'assignedTo',
          label: 'Assigned To',
          type: 'select',
          required: true,
          options: [], // This would be populated from the users in the store
        },
      ],
    },
  ];

  return (
    <DataForm
      title="Add New Task"
      sections={formSections}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitButtonText="Create Task"
    />
  );
};

export default NewTaskForm;