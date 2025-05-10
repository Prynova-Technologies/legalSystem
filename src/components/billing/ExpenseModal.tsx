import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createExpense, updateExpense } from '../../store/slices/billingSlice';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: any;
  onSuccess?: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSections: FormSection[] = [
    {
      title: 'Expense Details',
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
          placeholder: 'Enter expense description'
        },
        {
          id: 'amount',
          label: 'Amount',
          type: 'number',
          required: true,
          placeholder: 'Enter expense amount'
        },
        {
          id: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: [
            { value: 'travel', label: 'Travel' },
            { value: 'meals', label: 'Meals' },
            { value: 'supplies', label: 'Supplies' },
            { value: 'filing', label: 'Filing Fees' },
            { value: 'other', label: 'Other' }
          ]
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
      
      if (expense) {
        await dispatch(updateExpense({ id: expense.id, ...formData }) as any);
      } else {
        await dispatch(createExpense(formData) as any);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense' : 'Add Expense'}
      size="medium"
    >
      <DataForm
        sections={formSections}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={expense}
        submitButtonText={expense ? 'Update' : 'Create'}
        isLoading={isSubmitting}
      />
    </Modal>
  );
};

export default ExpenseModal;