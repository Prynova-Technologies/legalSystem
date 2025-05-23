import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import DataForm, { FormSection } from '../common/Form';
import { toast } from 'react-toastify';
import { CaseStatus, CaseType } from '../../types';
import './FormStyles.css';
import { createCase } from '../../store/slices/casesSlice';

interface NewCaseFormProps {
  onCancel: () => void;
}

const NewCaseForm: React.FC<NewCaseFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get clients for dropdown
  const clients = useSelector((state: RootState) => state.clients.clients);
  
  // Get attorneys for dropdown
  const users = useSelector((state: RootState) => state.users.users);
  const attorneys = users?.filter(user => user.role === 'lawyer');
  const paralegals = users?.filter(user => user.role === 'paralegal');

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsLoading(true);
      
      // Format assigned attorneys array with primary attorney flag
      const assignedAttorneys = [];
      if (formData.primaryAttorney) {
        assignedAttorneys.push({
          attorney: formData.primaryAttorney,
          isPrimary: true
        });
      }
      
      if (formData.additionalAttorneys && Array.isArray(formData.additionalAttorneys)) {
        // Add additional attorneys with isPrimary set to false
        const additionalAttorneysWithFlag = formData.additionalAttorneys.map(attorney => ({
          attorney,
          isPrimary: false
        }));
        assignedAttorneys.push(...additionalAttorneysWithFlag);
      }
      
      // Format assigned paralegals array
      const assignedParalegals = [];
      if (formData.assignedParalegals && Array.isArray(formData.assignedParalegals)) {
        assignedParalegals.push(...formData.assignedParalegals);
      }
      
      // Format court details
      const courtDetails = {};
      if (formData.court) courtDetails.court = formData.court;
      if (formData.judge) courtDetails.judge = formData.judge;
      if (formData.jurisdiction) courtDetails.jurisdiction = formData.jurisdiction;
      if (formData.courtCaseNumber) courtDetails.caseNumber = formData.courtCaseNumber;
      if (formData.filingDate) courtDetails.filingDate = formData.filingDate;
      
      // Prepare case data
      const caseData = {
        title: formData.title,
        description: formData.description,
        type: formData.caseType,
        status: CaseStatus.OPEN,
        client: formData.client,
        clientRole: formData.clientRole,
        assignedAttorneys: assignedAttorneys,
        assignedParalegals: assignedParalegals.length > 0 ? assignedParalegals : undefined,
        courtDetails: Object.keys(courtDetails).length > 0 ? courtDetails : undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : [],
      };
      
      // Use Redux thunk to create case
      const resultAction = await dispatch(createCase(caseData));
      
      if (createCase.fulfilled.match(resultAction)) {
        toast.success('Case created successfully');
        navigate(`/cases/${resultAction.payload.id}`);
      } else if (resultAction.error) {
        throw new Error(resultAction.error.message || 'Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create case');
    } finally {
      setIsLoading(false);
    }
  };

  // Get form sections
  const getFormSections = (): FormSection[] => {
    const caseTypeOptions = Object.entries(CaseType).map(([key, value]) => ({
      value,
      label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }));

    const basicInfoSection: FormSection = {
      title: 'Basic Information',
      fields: [
        {
          id: 'title',
          label: 'Case Title',
          type: 'text',
          placeholder: 'Enter case title',
          required: true
        },
        {
            id: 'caseType',
            label: 'Case Type',
            type: 'select',
            options: caseTypeOptions,
            required: true
          },
          {
            id: 'client',
            label: 'Client',
            type: 'select',
            options: clients.map(client => ({
              value: client.id,
              label: client.type === 'individual' 
                ? `${client.firstName} ${client.lastName}` 
                : client.organizationName
            })),
            required: true
          },
        {
          id: 'clientRole',
          label: 'Client Role',
          type: 'select',
          options: [
            { value: 'plaintiff', label: 'Plaintiff' },
            { value: 'defendant', label: 'Defendant' }
          ],
          required: true
        },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Enter case description',
          required: true
        },
      ]
    };

    const assignmentSection: FormSection = {
      title: 'Case Assignment',
      fields: [
        {
          id: 'primaryAttorney',
          label: 'Primary Attorney',
          type: 'select',
          options: attorneys?.map(attorney => ({
            value: attorney.id,
            label: `${attorney.firstName} ${attorney.lastName}`
          })),
          required: true
        },
        {
          id: 'additionalAttorneys',
          label: 'Additional Attorneys',
          type: 'select',
          multiple: true,
          options: attorneys?.map(attorney => ({
            value: attorney.id,
            label: `${attorney.firstName} ${attorney.lastName}`
          }))
        },
        {
          id: 'assignedParalegals',
          label: 'Assigned Paralegals',
          type: 'select',
          multiple: true,
          options: paralegals?.map(paralegal => ({
            value: paralegal.id,
            label: `${paralegal.firstName} ${paralegal.lastName}`
          }))
        }
      ]
    };

    const courtDetailsSection: FormSection = {
      title: 'Court Details',
      fields: [
        {
          id: 'court',
          label: 'Court',
          type: 'text',
          placeholder: 'Enter court name'
        },
        {
          id: 'judge',
          label: 'Judge',
          type: 'text',
          placeholder: 'Enter judge name'
        },
        {
          id: 'jurisdiction',
          label: 'Jurisdiction',
          type: 'text',
          placeholder: 'Enter jurisdiction'
        },
        {
          id: 'courtCaseNumber',
          label: 'Court Case Number',
          type: 'text',
          placeholder: 'Enter court case number'
        },
        {
          id: 'filingDate',
          label: 'Filing Date',
          type: 'date',
          placeholder: 'Select filing date'
        }
      ]
    };

    const additionalInfoSection: FormSection = {
      title: 'Additional Information',
      fields: [
        {
          id: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter any additional notes about the case'
        },
        {
          id: 'tags',
          label: 'Tags (comma-separated)',
          type: 'text',
          placeholder: 'Enter tags separated by commas'
        }
      ]
    };

    return [
      basicInfoSection,
      assignmentSection,
      courtDetailsSection,
      additionalInfoSection
    ];
  };

  return (
    <div className="case-form-container">
      <DataForm
        title="Add New Case"
        sections={getFormSections()}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitButtonText="Create Case"
        isLoading={isLoading}
      />
    </div>
  );
};

export default NewCaseForm;