import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store';
import { fetchTimeEntries, fetchExpenses, fetchInvoices } from '../store/slices/billingSlice';
import { Tabs, DataTable, Button, StatusBadge } from '../components/common';
import * as FaIcons from 'react-icons/fa';
import '../components/common/CommonStyles.css';
import TimeEntryModal from '../components/billing/TimeEntryModal';
import TimeEntryDetailsModal from '../components/billing/TimeEntryDetailsModal';
import ExpenseModal from '../components/billing/ExpenseModal';
import InvoiceModal from '../components/billing/InvoiceModal';

const Billing: React.FC = () => {
  const dispatch = useDispatch();
  const { timeEntries, expenses, invoices, isLoading, error } = useSelector(
    (state: RootState) => state.billing
  );
  const [activeTab, setActiveTab] = useState('time-entries');
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [isTimeEntryDetailsModalOpen, setIsTimeEntryDetailsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchTimeEntries() as any);
    dispatch(fetchExpenses() as any);
    dispatch(fetchInvoices() as any);
  }, [dispatch]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getInvoiceStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'overdue':
        return 'status-overdue';
      case 'draft':
        return 'status-draft';
      case 'sent':
        return 'status-sent';
      default:
        return '';
    }
  };

  const renderTimeEntries = () => {
    return (
      <div className="time-entries-section detail-container">
        <div className="detail-header">
          <h2 className="detail-title">Time Entries</h2>
          <Button 
            variant="outline" 
            onClick={() => setIsTimeEntryModalOpen(true)}
          >
            <FaIcons.FaPlus /> New Time Entry
          </Button>
        </div>

        <DataTable
          columns={[
            { header: 'Date', accessor: row => formatDate(row.createdAt) },
            { header: 'Description', accessor: 'description' },
            { header: 'Duration', accessor: row => formatDuration(row.duration) },
            { 
              header: 'Task', 
              accessor: row => (
                row.task._id ? (
                  <Link to={`/cases/${row.task._id}`}>View task</Link>
                ) : 'N/A'
              )
            },
            { 
              header: 'Billable', 
              accessor: row => (
                <StatusBadge status={row.billable ? 'yes' : 'no'} />
              )
            },
          ]}
          data={timeEntries}
          emptyMessage="No time entries recorded. Start tracking your time by creating a new entry."
          onRowClick={(entry) => {
            setSelectedItem(entry);
            setIsTimeEntryDetailsModalOpen(true);
          }}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      </div>
    );
  };

  const renderExpenses = () => {
    return (
      <div className="expenses-section detail-container">
        <div className="detail-header">
          <h2 className="detail-title">Expenses</h2>
          <Button 
            variant="primary" 
            onClick={() => setIsExpenseModalOpen(true)}
          >
            <FaIcons.FaReceipt /> New Expense
          </Button>
        </div>

        <DataTable
          columns={[
            { header: 'Date', accessor: row => formatDate(row.date) },
            { header: 'Description', accessor: 'description' },
            { header: 'Amount', accessor: row => formatCurrency(row.amount) },
            { header: 'Category', accessor: 'category' },
            { 
              header: 'Case', 
              accessor: row => (
                row.caseId ? (
                  <Link to={`/cases/${row.caseId}`}>View Case</Link>
                ) : 'N/A'
              )
            },
            { 
              header: 'Billable', 
              accessor: row => (
                <StatusBadge status={row.billable ? 'Verified' : 'Unverified'} />
              )
            },
            { 
              header: 'Actions', 
              accessor: row => (
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(row);
                    setIsExpenseModalOpen(true);
                  }}
                >
                  <FaIcons.FaEdit /> Edit
                </Button>
              )
            }
          ]}
          data={expenses}
          emptyMessage="No expenses recorded. Add your first expense by clicking the button above."
          onRowClick={(expense) => {
            setSelectedItem(expense);
            setIsExpenseModalOpen(true);
          }}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      </div>
    );
  };

  const renderInvoices = () => {
    return (
      <div className="invoices-section detail-container">
        <div className="detail-header">
          <h2 className="detail-title">Invoices</h2>
          <Button 
            variant="primary" 
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            <FaIcons.FaFileInvoiceDollar /> Create Invoice
          </Button>
        </div>

        <DataTable
          columns={[
            { header: 'Invoice #', accessor: 'invoiceNumber' },
            { 
              header: 'Client', 
              accessor: row => (
                <Link to={`/clients/${row.clientId}`}>View Client</Link>
              )
            },
            { header: 'Issue Date', accessor: row => formatDate(row.issueDate) },
            { header: 'Due Date', accessor: row => formatDate(row.dueDate) },
            { header: 'Amount', accessor: row => formatCurrency(row.total) },
            { 
              header: 'Status', 
              accessor: row => (
                <StatusBadge status={row.status} />
              )
            },
            { 
              header: 'Actions', 
              accessor: row => (
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(row);
                    setIsInvoiceModalOpen(true);
                  }}
                >
                  <FaIcons.FaEdit /> Edit
                </Button>
              )
            }
          ]}
          data={invoices}
          emptyMessage="No invoices created. Generate your first invoice by clicking the button above."
          onRowClick={(invoice) => {
            setSelectedItem(invoice);
            setIsInvoiceModalOpen(true);
          }}
          pagination={true}
          pageSize={10}
          striped={true}
        />
      </div>
    );
  };

  const renderBillingDashboard = () => {
    // Calculate summary metrics
    const totalBillableHours = timeEntries
      .filter(entry => entry.billable)
      .reduce((total, entry) => total + entry.duration / 60, 0);
    
    const totalBillableAmount = totalBillableHours * 250; // Assuming $250/hr average rate
    
    const totalExpensesAmount = expenses
      .filter(expense => expense.billable)
      .reduce((total, expense) => total + expense.amount, 0);
    
    const outstandingInvoicesAmount = invoices
      .filter(invoice => invoice.status !== 'paid')
      .reduce((total, invoice) => total + invoice.total, 0);
    
    const paidInvoicesAmount = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.total, 0);

    return (
      <div className="billing-dashboard">
        <h2>Billing Overview</h2>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Billable Hours</h3>
            <div className="metric-value">{totalBillableHours.toFixed(1)} hrs</div>
            <div className="metric-subtitle">Estimated Value: {formatCurrency(totalBillableAmount)}</div>
          </div>
          
          <div className="metric-card">
            <h3>Billable Expenses</h3>
            <div className="metric-value">{formatCurrency(totalExpensesAmount)}</div>
            <div className="metric-subtitle">{expenses.filter(e => e.billable).length} billable expenses</div>
          </div>
          
          <div className="metric-card">
            <h3>Outstanding Invoices</h3>
            <div className="metric-value">{formatCurrency(outstandingInvoicesAmount)}</div>
            <div className="metric-subtitle">{invoices.filter(i => i.status !== 'paid').length} unpaid invoices</div>
          </div>
          
          <div className="metric-card">
            <h3>Collected Revenue</h3>
            <div className="metric-value">{formatCurrency(paidInvoicesAmount)}</div>
            <div className="metric-subtitle">{invoices.filter(i => i.status === 'paid').length} paid invoices</div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          
          <div className="activity-list">
            {timeEntries.length > 0 && (
              <div className="activity-item">
                <div className="activity-icon">⏱️</div>
                <div className="activity-content">
                  <div className="activity-title">Latest Time Entry</div>
                  <div className="activity-details">
                    {timeEntries[0].description} - {formatDuration(timeEntries[0].duration)}
                  </div>
                  <div className="activity-meta">{formatDate(timeEntries[0].date)}</div>
                </div>
              </div>
            )}
            
            {expenses.length > 0 && (
              <div className="activity-item">
                <div className="activity-icon">💰</div>
                <div className="activity-content">
                  <div className="activity-title">Latest Expense</div>
                  <div className="activity-details">
                    {expenses[0].description} - {formatCurrency(expenses[0].amount)}
                  </div>
                  <div className="activity-meta">{formatDate(expenses[0].date)}</div>
                </div>
              </div>
            )}
            
            {invoices.length > 0 && (
              <div className="activity-item">
                <div className="activity-icon">📄</div>
                <div className="activity-content">
                  <div className="activity-title">Latest Invoice</div>
                  <div className="activity-details">
                    Invoice #{invoices[0].invoiceNumber} - {formatCurrency(invoices[0].total)}
                  </div>
                  <div className="activity-meta">
                    {formatDate(invoices[0].issueDate)} - 
                    <span className={`status-badge ${getInvoiceStatusClass(invoices[0].status)}`}>
                      {invoices[0].status}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {timeEntries.length === 0 && expenses.length === 0 && invoices.length === 0 && (
              <p className="empty-state">No recent billing activity.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="billing-container">
      <TimeEntryModal
        isOpen={isTimeEntryModalOpen}
        onClose={() => {
          setIsTimeEntryModalOpen(false);
          setSelectedItem(null);
        }}
        timeEntry={selectedItem}
        onSuccess={() => dispatch(fetchTimeEntries() as any)}
      />
      
      <TimeEntryDetailsModal
        isOpen={isTimeEntryDetailsModalOpen}
        onClose={() => {
          setIsTimeEntryDetailsModalOpen(false);
          setSelectedItem(null);
        }}
        timeEntry={selectedItem}
        onEdit={() => {
          setIsTimeEntryDetailsModalOpen(false);
          setIsTimeEntryModalOpen(true);
        }}
      />
      
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedItem(null);
        }}
        expense={selectedItem}
        onSuccess={() => dispatch(fetchExpenses() as any)}
      />
      
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedItem(null);
        }}
        invoice={selectedItem}
        onSuccess={() => dispatch(fetchInvoices() as any)}
      />
      <div className="billing-header">
        <h1>Billing & Finance</h1>
      </div>

      <div className="billing-tabs">
        <Tabs
          tabs={[
            { id: 'time-entries', label: 'Time Entries', icon: <FaIcons.FaClock /> },
            { id: 'expenses', label: 'Expenses', icon: <FaIcons.FaReceipt /> },
            { id: 'invoices', label: 'Invoices', icon: <FaIcons.FaFileInvoiceDollar /> }
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="default"
        />

        <div className="tab-content">
          {isLoading ? (
            <div className="loading-indicator">Loading billing data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {activeTab === 'time-entries' && renderTimeEntries()}
              {activeTab === 'expenses' && renderExpenses()}
              {activeTab === 'invoices' && renderInvoices()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;