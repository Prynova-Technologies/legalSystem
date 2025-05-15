import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, DataForm } from '../common';
import { FormSection } from '../common/Form';
import { createInvoice, updateInvoice, fetchUnbilledItems } from '../../store/slices/billingSlice';
import { fetchCases } from '../../store/slices/casesSlice';
import { toast } from 'react-toastify';
import { RootState } from '../../store';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  onSuccess?: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess
}) => {
  const dispatch = useDispatch();
  const cases = useSelector((state: RootState) => state.cases.cases);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [unbilledItems, setUnbilledItems] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [sendNow, setSendNow] = useState<boolean>(false);

  // Fetch cases when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCases() as any);
    }
  }, [isOpen, dispatch]);

  // Fetch unbilled items when a case is selected
  const handleCaseChange = async (caseId: string) => {
    setSelectedCase(caseId);
    if (!caseId) {
      setUnbilledItems(null);
      return;
    }

    setIsLoading(true);
    try {
      const resultAction = await dispatch(fetchUnbilledItems(caseId) as any);
      if (fetchUnbilledItems.fulfilled.match(resultAction)) {
        setUnbilledItems(resultAction.payload);

      } else {
        throw new Error('Failed to fetch unbilled items');
      }
    } catch (error) {
      console.error('Error fetching unbilled items:', error);
      toast.error('Failed to load unbilled items for this case');
      setUnbilledItems(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tax rate change
  const handleTaxRateChange = (value: number) => {
    setTaxRate(value);
  };

  // Define form sections based on whether a case has been selected
  const initialFormSections: FormSection[] = [
    {
      title: 'Select Case',
      fields: [
        {
          id: 'caseId',
          label: 'Select Case',
          type: 'select',
          required: true,
          options: cases.map(c => ({ value: c._id, label: `${c.caseNumber} - ${c.title}` })),
          onChange: handleCaseChange
        }
      ]
    }
  ];
  
  // Define full form sections to be shown after a case is selected
  const getFullFormSections = (): FormSection[] => {
    const sections: FormSection[] = [
      {
        title: 'Invoice Details',
        fields: [
          {
            id: 'caseId',
            label: 'Select Case',
            type: 'select',
            required: true,
            options: cases.map(c => ({ value: c._id, label: `${c.caseNumber} - ${c.title}` })),
            onChange: handleCaseChange
          },
          {
            id: 'dueDate',
            label: 'Due Date',
            type: 'date',
            required: true,
            defaultValue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
          },
          {
            id: 'taxRate',
            label: 'Tax Rate (%)',
            type: 'number',
            placeholder: 'Enter tax rate percentage',
            onChange: handleTaxRateChange,
            defaultValue: 0
          },
          {
            id: 'notes',
            label: 'Notes',
            type: 'textarea',
            placeholder: 'Enter any additional notes'
          },
          {
            id: 'status',
            label: 'Send Status',
            type: 'select',
            required: true,
            options: [
              { value: 'draft', label: 'Save As Draft' },
              { value: 'sent', label: 'Send Now' }
            ],
            defaultValue: sendNow ? 'sent' : 'draft',
            disabled: false
          }
        ]
      },
    ];
    
  return sections;
}

  // Get the complete form sections including time entries and expenses if available
  const getCompleteSections = (): FormSection[] => {
    const sections = getFullFormSections();
    return sections;
  }

  // Render a loading indicator or summary of unbilled items when a case is selected
  const renderUnbilledSummary = () => {
    if (!selectedCase) return null;
    
    if (isLoading) {
      return (
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Loading unbilled items...</p>
        </div>
      );
    }
    
    if (!unbilledItems) return null;
    
    return (
      <div className="p-4 bg-gray-50 rounded-md mb-4">
        <h3 className="text-lg font-semibold mb-2">Unbilled Items Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded shadow-sm">
            <h4 className="font-medium text-gray-700 mb-1">Client</h4>
            <div style={{display: "flex", flexDirection: 'column'}}>
              <div>CLient Type: {unbilledItems.client.clientType || ''}</div>
              <div style={{marginTop: 10}}>Client name: {unbilledItems.client.clientType === 'individual' ? unbilledItems.client.firstName + ' ' + unbilledItems.client.lastName : unbilledItems.client.company || ''}</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <h4 className="font-medium text-gray-700 mb-1">Time Entries</h4>
            <div style={{display: "flex", flexDirection: 'column'}}>
              <div>Total time entries {unbilledItems.timeEntries?.length || 0}</div>
              <div style={{marginTop: 10}}>Total sum of time entries ${unbilledItems.timeEntriesTotal?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <h4 className="font-medium text-gray-700 mb-1">Expenses</h4>
            <div style={{display: "flex", flexDirection: 'column'}}>
              <span>{unbilledItems.expenses?.length || 0} expenses</span>
              <span style={{marginTop: 10, marginBottom: 10}}>Total sum of expenditures ${unbilledItems.expensesTotal?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 bg-white p-3 rounded shadow-sm">
          <div className="flex justify-between font-semibold">
            <span style={{fontSize: 15, fontWeight: 'bold', marginTop: 10}}>Sub total before tax ${unbilledItems.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // If only case is selected but unbilled items aren't loaded yet, don't proceed
      if (!unbilledItems && formData.caseId) {
        toast.error('Please wait for unbilled items to load');
        return;
      }
      
      setIsSubmitting(true);
      
      // If we're just in the case selection step, trigger the case change and return
      if (!selectedCase && formData.caseId) {
        await handleCaseChange(formData.caseId);
        setIsSubmitting(false);
        return;
      }
      
      // Prepare invoice data
      const invoiceData = {
        client: unbilledItems.client._id,
        case: selectedCase,
        dueDate: formData.dueDate,
        notes: formData.notes,
        taxRate: formData.taxRate,
        status: sendNow ? 'sent' : 'draft',
        
        // Create invoice items from time entries
        items: [
          ...(unbilledItems.timeEntries || []).map((entry: any) => ({
            description: entry.description,
            quantity: entry.duration / 60, // Convert minutes to hours
            rate: entry.billingRate || 0,
            amount: entry.billableAmount || 0,
            timeEntry: entry._id,
            case: selectedCase,
            taxable: true
          })),
          
          // Create invoice items from expenses
          ...(unbilledItems.expenses || []).map((expense: any) => ({
            description: expense.description,
            quantity: 1,
            rate: expense.billableAmount || expense.amount || 0,
            amount: expense.billableAmount || expense.amount || 0,
            case: selectedCase,
            taxable: true,
            notes: `Expense: ${expense.category}`
          }))
        ],
        
        // IDs for marking as invoiced
        timeEntryIds: unbilledItems.timeEntries?.map((entry: any) => entry._id) || [],
        expenseIds: unbilledItems.expenses?.map((expense: any) => expense._id) || []
      };
      
      if (invoice) {
        await dispatch(updateInvoice({ id: invoice.id, ...invoiceData }) as any);
      } else {
        await dispatch(createInvoice(invoiceData) as any);
      }

      toast.success(sendNow ? 'Invoice created and sent' : 'Invoice created as draft');
      onSuccess?.();
      onClose();
      setUnbilledItems(null)
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare initial data with properly formatted dates
  const initialData = invoice ? {
    ...invoice,
    // Format date fields to yyyy-MM-dd for date inputs
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  } : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? 'Edit Invoice' : 'Create Invoice'}
      size="large"
    >
      {selectedCase && renderUnbilledSummary()}
      <DataForm
        sections={selectedCase && unbilledItems ? getCompleteSections() : initialFormSections}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={initialData}
        submitButtonText={invoice ? 'Update' : 'Create'}
        isLoading={isSubmitting || isLoading}
        disabled={selectedCase && isLoading}
        onChange={handleCaseChange}
      />
    </Modal>
  );
};

export default InvoiceModal;