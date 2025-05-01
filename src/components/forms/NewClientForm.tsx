import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataForm, FormSection } from '../common';
import { createClient } from '../../store/slices/clientsSlice';
import { AppDispatch } from '../../store';

interface NewClientFormProps {
  onCancel?: () => void;
}

const NewClientForm: React.FC<NewClientFormProps> = ({ onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Format the data as needed for the API
      const clientData = {
        ...formData,
        intakeDate: new Date().toISOString(),
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
        },
        // Remove the flattened fields that are now in the nested structure
        email: undefined,
        phone: undefined,
        street: undefined,
        city: undefined,
        state: undefined,
        zipCode: undefined,
        country: undefined,
      };
      
      // Dispatch action to add the client
      await dispatch(createClient(clientData));
      
      // Navigate to the clients list
      navigate('/clients');
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const formSections: FormSection[] = [
    {
      title: 'Client Type',
      fields: [
        {
          id: 'type',
          label: 'Client Type',
          type: 'select',
          required: true,
          options: [
            { value: 'individual', label: 'Individual' },
            { value: 'organization', label: 'Organization' },
          ],
        },
      ],
    },
    {
      title: 'Client Information',
      fields: [
        {
          id: 'firstName',
          label: 'First Name',
          type: 'text',
          placeholder: 'Enter first name',
          required: true,
          // Only show for individual clients
          validation: (value) => {
            // This would be conditional based on the client type
            return null;
          },
        },
        {
          id: 'lastName',
          label: 'Last Name',
          type: 'text',
          placeholder: 'Enter last name',
          required: true,
          // Only show for individual clients
          validation: (value) => {
            // This would be conditional based on the client type
            return null;
          },
        },
        {
          id: 'organizationName',
          label: 'Organization Name',
          type: 'text',
          placeholder: 'Enter organization name',
          required: true,
          // Only show for organization clients
          validation: (value) => {
            // This would be conditional based on the client type
            return null;
          },
        },
      ],
    },
    {
      title: 'Contact Information',
      fields: [
        {
          id: 'email',
          label: 'Email',
          type: 'text',
          placeholder: 'Enter email address',
          required: true,
          validation: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? null : 'Please enter a valid email address';
          },
        },
        {
          id: 'phone',
          label: 'Phone',
          type: 'text',
          placeholder: 'Enter phone number',
          required: true,
        },
        {
          id: 'street',
          label: 'Street Address',
          type: 'text',
          placeholder: 'Enter street address',
        },
        {
          id: 'city',
          label: 'City',
          type: 'text',
          placeholder: 'Enter city',
        },
        {
          id: 'state',
          label: 'State/Province',
          type: 'text',
          placeholder: 'Enter state or province',
        },
        {
          id: 'zipCode',
          label: 'Zip/Postal Code',
          type: 'text',
          placeholder: 'Enter zip or postal code',
        },
        {
          id: 'country',
          label: 'Country',
          type: 'text',
          placeholder: 'Enter country',
        },
      ],
    },
    {
      title: 'Verification',
      fields: [
        {
          id: 'kycVerified',
          label: 'KYC Verified',
          type: 'checkbox',
        },
        {
          id: 'conflictCheckStatus',
          label: 'Conflict Check Status',
          type: 'select',
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'cleared', label: 'Cleared' },
            { value: 'flagged', label: 'Flagged' },
          ],
        },
      ],
    },
  ];

  return (
    <DataForm
      title="Add New Client"
      sections={formSections}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitButtonText="Create Client"
    />
  );
};

export default NewClientForm;