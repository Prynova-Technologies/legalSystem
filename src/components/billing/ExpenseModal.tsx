import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createExpense, updateExpense } from '../../store/slices/billingSlice';
import { fetchCases } from '../../store/slices/casesSlice';
import { RootState } from '../../store';

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
  const [isBillable, setIsBillable] = useState(expense?.billable || false);
  const cases = useSelector((state: RootState) => state.cases.cases);
  
  // Fetch cases when modal is opened
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCases() as any);
      setIsBillable(expense?.billable || false);
    }
  }, [isOpen, dispatch, expense]);

  // Dynamically build form sections based on billable status
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
          type: 'checkbox',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setIsBillable(e.target.checked);
          }
        },
        // Conditionally add case selection field if expense is billable
        ...(isBillable && !expense ? [
          {
            id: 'caseId',
            label: 'Select Case',
            type: 'select',
            required: true,
            options: cases.map(c => ({
              value: c.id,
              label: `${c.caseNumber}: ${c.title}`
            })),
            placeholder: 'Select a case for this expense'
          }
        ] : [])
      ]
    }
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      
      // If not billable, remove caseId if it exists
      if (!formData.billable && formData.caseId) {
        delete formData.caseId;
      }

      formData.case = formData.caseId
      formData.billableAmount = formData.amount
      
      if (expense) {
        await dispatch(updateExpense({ expenseId: expense._id, expenseData: formData }) as any);
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
  
  // Prepare initial data with case selection if expense is billable
  const initialData = expense ? {
    ...expense,
    // Ensure caseId is properly set from existing expense
    caseId: expense.caseId || '',
    // Format date to yyyy-MM-dd for date input
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : ''
  } : undefined;

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
        onChange={value => setIsBillable(value)}
      />
    </Modal>
  );
};

export default ExpenseModal;