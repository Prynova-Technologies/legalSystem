import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataForm, { FormSection } from '../common/Form';
import { toast } from 'react-toastify';
import './FormStyles.css';

interface NewClientFormProps {
  onCancel: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsLoading(true);
      
      // Format contacts array
      const contacts = [];
      if (formData.phone) {
        contacts.push({
          type: 'phone',
          value: formData.phone,
          isPrimary: true
        });
      }
      
      if (formData.email) {
        contacts.push({
          type: 'email',
          value: formData.email,
          isPrimary: !formData.phone // Make email primary if no phone
        });
      }
      
      if (formData.address) {
        contacts.push({
          type: 'address',
          value: formData.address
        });
      }
      
      // Prepare client data
      const clientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company || undefined,
        contacts,
        primaryAttorney: formData.primaryAttorney || undefined,
        referralSource: formData.referralSource || undefined,
        intakeDate: formData.intakeDate || new Date(),
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : [],
        isActive: true,
        kycVerified: formData.kycVerified || false,
        conflictCheckCompleted: formData.conflictCheckCompleted || false,
        conflictCheckNotes: formData.conflictCheckNotes || undefined
      };
      
      // Make API call to create client
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create client');
      }
      
      toast.success('Client created successfully');
      navigate(`/clients/${result.data._id}`);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setIsLoading(false);
    }
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : 'Please enter a valid email address';
  };

  // Phone validation function
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone) ? null : 'Please enter a valid phone number';
  };

  const formSections: FormSection[] = [
    {
      title: 'Basic Information',
      fields: [
        {
          id: 'firstName',
          label: 'First Name',
          type: 'text',
          placeholder: 'Enter first name',
          required: true
        },
        {
          id: 'lastName',
          label: 'Last Name',
          type: 'text',
          placeholder: 'Enter last name',
          required: true
        },
        {
          id: 'company',
          label: 'Company',
          type: 'text',
          placeholder: 'Enter company name (if applicable)'
        }
      ]
    },
    {
      title: 'Contact Information',
      fields: [
        {
          id: 'phone',
          label: 'Phone Number',
          type: 'text',
          placeholder: 'Enter phone number',
          validation: validatePhone
        },
        {
          id: 'email',
          label: 'Email',
          type: 'text',
          placeholder: 'Enter email address',
          validation: validateEmail
        },
        {
          id: 'address',
          label: 'Address',
          type: 'textarea',
          placeholder: 'Enter address'
        }
      ]
    },
    {
      title: 'Case Information',
      fields: [
        {
          id: 'primaryAttorney',
          label: 'Primary Attorney',
          type: 'select',
          options: [
            // This would typically be populated from an API call
            { value: '', label: 'Select an attorney' },
            { value: 'attorney1', label: 'John Doe' },
            { value: 'attorney2', label: 'Jane Smith' }
          ]
        },
        {
          id: 'referralSource',
          label: 'Referral Source',
          type: 'text',
          placeholder: 'How did the client hear about us?'
        },
        {
          id: 'intakeDate',
          label: 'Intake Date',
          type: 'date'
        },
        {
          id: 'tags',
          label: 'Tags',
          type: 'text',
          placeholder: 'Enter tags separated by commas'
        }
      ]
    },
    {
      title: 'Compliance',
      fields: [
        {
          id: 'kycVerified',
          label: 'KYC Verified',
          type: 'checkbox'
        },
        {
          id: 'conflictCheckCompleted',
          label: 'Conflict Check Completed',
          type: 'checkbox'
        },
        {
          id: 'conflictCheckNotes',
          label: 'Conflict Check Notes',
          type: 'textarea',
          placeholder: 'Enter any notes about conflict checks'
        }
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        {
          id: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Enter any additional notes about the client'
        }
      ]
    }
  ];

  return (
    <div className="client-form-container">
      <DataForm
        title="Add New Client"
        sections={formSections}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitButtonText="Create Client"
        isLoading={isLoading}
      />
    </div>
  );
};

export default NewClientForm;