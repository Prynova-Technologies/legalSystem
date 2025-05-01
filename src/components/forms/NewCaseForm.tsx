import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataForm, FormSection } from '../common';
import { CaseStatus, CaseType } from '../../types';
import { createCase } from '../../store/slices/casesSlice';
import { AppDispatch } from '../../store';

interface NewCaseFormProps {
  onCancel?: () => void;
}

const NewCaseForm: React.FC<NewCaseFormProps> = ({ onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Format the data as needed for the API
      const caseData = {
        ...formData,
        openDate: new Date().toISOString(),
        caseNumber: `CASE-${Date.now().toString().slice(-6)}`, // Generate a simple case number
      };
      
      // Dispatch action to add the case
      await dispatch(createCase(caseData));
      
      // Navigate to the cases list
      navigate('/cases');
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const formSections: FormSection[] = [
    {
      title: 'Case Information',
      fields: [
        {
          id: 'title',
          label: 'Case Title',
          type: 'text',
          placeholder: 'Enter case title',
          required: true,
        },
        {
          id: 'caseType',
          label: 'Case Type',
          type: 'select',
          required: true,
          options: [
            { value: CaseType.CIVIL, label: 'Civil' },
            { value: CaseType.CRIMINAL, label: 'Criminal' },
            { value: CaseType.FAMILY, label: 'Family' },
            { value: CaseType.CORPORATE, label: 'Corporate' },
            { value: CaseType.REAL_ESTATE, label: 'Real Estate' },
            { value: CaseType.INTELLECTUAL_PROPERTY, label: 'Intellectual Property' },
            { value: CaseType.OTHER, label: 'Other' },
          ],
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: CaseStatus.OPEN, label: 'Open' },
            { value: CaseStatus.PENDING, label: 'Pending' },
            { value: CaseStatus.AWAITING_RESPONSE, label: 'Awaiting Response' },
            { value: CaseStatus.CLOSED, label: 'Closed' },
          ],
        },
      ],
    },
    {
      title: 'Client Information',
      fields: [
        {
          id: 'clientId',
          label: 'Client',
          type: 'select',
          required: true,
          options: [], // This would be populated from the clients in the store
        },
      ],
    },
    {
      title: 'Case Details',
      fields: [
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Enter case description',
          required: true,
        },
        {
          id: 'assignedTo',
          label: 'Assigned To',
          type: 'select',
          options: [], // This would be populated from the users in the store
        },
      ],
    },
    {
      title: 'Court Information',
      fields: [
        {
          id: 'courtName',
          label: 'Court Name',
          type: 'text',
          placeholder: 'Enter court name',
        },
        {
          id: 'courtLocation',
          label: 'Court Location',
          type: 'text',
          placeholder: 'Enter court location',
        },
        {
          id: 'judgeAssigned',
          label: 'Judge Assigned',
          type: 'text',
          placeholder: 'Enter judge name',
        },
      ],
    },
  ];

  return (
    <DataForm
      title="Add New Case"
      sections={formSections}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitButtonText="Create Case"
    />
  );
};

export default NewCaseForm;