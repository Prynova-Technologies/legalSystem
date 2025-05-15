import React from 'react';
import { Modal, Button, StatusBadge } from '../common';
import * as FaIcons from 'react-icons/fa';
import './InvoiceDetailsModal.css';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  if (!invoice) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Details"
      size="large"
    >
      <div className="invoice-details-container">
        <div className="invoice-header">
          <div className="invoice-title">
            <h2>Invoice #{invoice.invoiceNumber}</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="invoice-dates">
            <div className="detail-item">
              <span className="detail-label">Issue Date</span>
              <span className="detail-value">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Due Date</span>
              <span className="detail-value">{formatDate(invoice.dueDate)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-client-section">
          <h3>Client Information</h3>
          <div className="detail-item">
            <span className="detail-label">Client</span>
            <span className="detail-value">
              {invoice.client.firstName} {invoice.client.lastName}
              {invoice.client.company && ` - ${invoice.client.company}`}
            </span>
          </div>
          {invoice.case && (
            <div className="detail-item">
              <span className="detail-label">Case</span>
              <span className="detail-value">{invoice.case.title || invoice.case.caseNumber}</span>
            </div>
          )}
        </div>

        <div className="invoice-items-section">
          <h3>Invoice Items</h3>
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.rate)}</td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right">Subtotal</td>
                <td>{formatCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.taxAmount > 0 && (
                <tr>
                  <td colSpan={3} className="text-right">Tax ({invoice.taxRate}%)</td>
                  <td>{formatCurrency(invoice.taxAmount)}</td>
                </tr>
              )}
              {invoice.discount > 0 && (
                <tr>
                  <td colSpan={3} className="text-right">Discount</td>
                  <td>-{formatCurrency(invoice.discount)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={3} className="text-right">Total</td>
                <td>{formatCurrency(invoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoice.payments && invoice.payments.length > 0 && (
          <div className="invoice-payments-section">
            <h3>Payment History</h3>
            <table className="invoice-payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment: any, index: number) => (
                  <tr key={index}>
                    <td>{formatDate(payment.date)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || 'N/A'}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right">Amount Paid</td>
                  <td>{formatCurrency(invoice.amountPaid)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right">Balance</td>
                  <td>{formatCurrency(invoice.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {invoice.notes && (
          <div className="invoice-notes-section">
            <h3>Notes</h3>
            <p>{invoice.notes}</p>
          </div>
        )}

        {invoice.terms && (
          <div className="invoice-terms-section">
            <h3>Terms</h3>
            <p>{invoice.terms}</p>
          </div>
        )}

        <div className="invoice-actions">
          <Button variant="secondary" onClick={onClose}>
            <FaIcons.FaTimes /> Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailsModal;