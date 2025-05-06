import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import DataForm, { FormSection } from '../common/Form';
import { toast } from 'react-toastify';
import { createClient } from '../../store/slices/clientsSlice';
import { User } from '../../services/userService';
import './FormStyles.css';
type ClientType = 'individual' | 'organization';

interface NewClientFormProps {
  onCancel: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  const [clientType, setClientType] = useState<ClientType>('individual');

  const handleClientTypeChange = (value: string) => {
    setClientType(value as ClientType);
  };

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
      
      // Combine address fields into a structured format
      if (formData.street || formData.city || formData.country || formData.postalCode) {
        const addressParts = {
          street: formData.street || '',
          city: formData.city || '',
          country: formData.country || '',
          postalCode: formData.postalCode || ''
        };
        
        contacts.push({
          type: 'address',
          value: JSON.stringify(addressParts)
        });
      }

      // Add company contact for organization
      if (clientType === 'organization' && formData.companyEmail) {
        contacts.push({
          type: 'email',
          value: formData.companyEmail,
          isPrimary: false,
          label: 'Company Email'
        });
      }

      if (clientType === 'organization' && formData.companyPhone) {
        contacts.push({
          type: 'phone',
          value: formData.companyPhone,
          isPrimary: false,
          label: 'Company Phone'
        });
      }

      if (clientType === 'organization' && (formData.companyStreet || formData.companyCity || formData.companyCountry || formData.companyPostalCode)) {
        const companyAddressParts = {
          street: formData.companyStreet || '',
          city: formData.companyCity || '',
          country: formData.companyCountry || '',
          postalCode: formData.companyPostalCode || ''
        };
        
        contacts.push({
          type: 'address',
          value: JSON.stringify(companyAddressParts),
          label: 'Company Address'
        });
      }
      
      // Prepare client data
      const clientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        clientType,
        company: formData.company || undefined,
        dateOfBirth: clientType === 'individual' ? formData.dateOfBirth || undefined : undefined,
        maritalStatus: clientType === 'individual' ? formData.maritalStatus || undefined : undefined,
        contacts,
        primaryAttorney: formData.primaryAttorney || undefined,
        referralSource: formData.referralSource || undefined,
        intakeDate: formData.intakeDate || new Date(),
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()) : [],
        isActive: true,
        kycVerified: false,
        conflictCheckCompleted: false,
        conflictCheckNotes: undefined
      };
      
      // Use Redux thunk to create client
      const resultAction = await dispatch(createClient(clientData));
      
      if (createClient.fulfilled.match(resultAction)) {
        toast.success('Client created successfully');
        navigate(`/clients/${resultAction.payload.id}`);
      } else {
        throw new Error(resultAction.error.message || 'Failed to create client');
      }
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
    // eslint-disable-next-line no-useless-escape
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone) ? null : 'Please enter a valid phone number';
  };

  // Get form sections based on client type
  const getFormSections = (): FormSection[] => {
    const clientTypeSection: FormSection = {
      title: 'Client Type',
      fields: [
        {
          id: 'clientType',
          label: 'Client Type',
          type: 'select',
          options: [
            { value: 'individual', label: 'Individual' },
            { value: 'organization', label: 'Organization' }
          ],
          required: true
        }
      ]
    };

    // Basic information section changes based on client type
    const basicInfoSection: FormSection = {
      title: 'Basic Information',
      fields: [
        {
          id: 'firstName',
          label: clientType === 'individual' ? 'First Name' : 'Contact Person First Name',
          type: 'text',
          placeholder: 'Enter first name',
          required: true
        },
        {
          id: 'lastName',
          label: clientType === 'individual' ? 'Last Name' : 'Contact Person Last Name',
          type: 'text',
          placeholder: 'Enter last name',
          required: true
        }
      ]
    };

    // Add individual client fields
    if (clientType === 'individual') {
      basicInfoSection.fields.push(
        {
          id: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          placeholder: 'Select date of birth'
        },
        {
          id: 'maritalStatus',
          label: 'Marital Status',
          type: 'select',
          options: [
            { value: '', label: 'Select marital status' },
            { value: 'single', label: 'Single' },
            { value: 'married', label: 'Married' },
            { value: 'divorced', label: 'Divorced' },
            { value: 'widowed', label: 'Widowed' },
            { value: 'separated', label: 'Separated' }
          ]
        }
      );
    }

    // Add organization client fields
    if (clientType === 'organization') {
      basicInfoSection.fields.push(
        {
          id: 'company',
          label: 'Company Name',
          type: 'text',
          placeholder: 'Enter company name',
          required: true
        }
      );
    }

    // Create contact information section
    const contactInfoSection: FormSection = {
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
          id: 'street',
          label: 'Street Address',
          type: 'text',
          placeholder: 'Enter street address'
        },
        {
          id: 'city',
          label: 'City',
          type: 'text',
          placeholder: 'Enter city'
        },
        {
          id: 'country',
          label: 'Country',
          type: 'text',
          placeholder: 'Enter country'
        },
        {
          id: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          placeholder: 'Enter postal code'
        }
      ]
    };
    
    // Add company contact fields for organization
    if (clientType === 'organization') {
      contactInfoSection.fields = [
        {
          id: 'companyStreet',
          label: 'Company Street Address',
          type: 'text',
          placeholder: 'Enter company street address',
          required: true
        },
        {
          id: 'companyCity',
          label: 'Company City',
          type: 'text',
          placeholder: 'Enter company city',
          required: true
        },
        {
          id: 'companyCountry',
          label: 'Company Country',
          type: 'text',
          placeholder: 'Enter company country',
          required: true
        },
        {
          id: 'companyPostalCode',
          label: 'Company Postal Code',
          type: 'text',
          placeholder: 'Enter company postal code',
          required: true
        },
        {
          id: 'companyEmail',
          label: 'Company Email',
          type: 'text',
          placeholder: 'Enter company email',
          validation: validateEmail
        },
        {
          id: 'companyPhone',
          label: 'Company Phone',
          type: 'text',
          placeholder: 'Enter company phone number',
          validation: validatePhone
        }
      ];
    }
    
    const formSections: FormSection[] = [clientTypeSection, basicInfoSection, contactInfoSection,
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
  
  return formSections;
  };

  return (
    <div className="client-form-container">
      <DataForm
        title="Add New Client"
        sections={getFormSections()}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitButtonText="Create Client"
        isLoading={isLoading}
        onChange={{
          clientType: handleClientTypeChange
        }}
      />
    </div>
  );
};

export default NewClientForm;