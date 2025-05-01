import Invoice from '../models/invoice.model';
import TimeEntry from '../models/timeEntry.model';
import { InvoiceStatus } from '../interfaces/billing.interface';
import logger from '../utils/logger';

/**
 * Service for invoice-related operations
 */
export class InvoiceService {
  /**
   * Get all invoices with filtering options
   */
  static async getAllInvoices(filters: any = {}): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters if they exist in the filters object
      if (filter.issuedAfter) {
        filter.issueDate = { $gte: new Date(filter.issuedAfter) };
        delete filter.issuedAfter;
      }
      
      if (filter.issuedBefore) {
        filter.issueDate = filter.issueDate || {};
        filter.issueDate.$lte = new Date(filter.issuedBefore);
        delete filter.issuedBefore;
      }
      
      if (filter.dueAfter) {
        filter.dueDate = { $gte: new Date(filter.dueAfter) };
        delete filter.dueAfter;
      }
      
      if (filter.dueBefore) {
        filter.dueDate = filter.dueDate || {};
        filter.dueDate.$lte = new Date(filter.dueBefore);
        delete filter.dueBefore;
      }
      
      return await Invoice.find(filter)
        .populate('client', 'firstName lastName company')
        .populate('case', 'caseNumber title')
        .sort({ issueDate: -1 });
    } catch (error) {
      logger.error('Error fetching invoices', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<any | null> {
    try {
      return await Invoice.findOne({ _id: invoiceId, isDeleted: false })
        .populate('client', 'firstName lastName company')
        .populate('case', 'caseNumber title')
        .populate({
          path: 'items.timeEntry',
          select: 'description startTime duration',
          populate: {
            path: 'user',
            select: 'firstName lastName'
          }
        });
    } catch (error) {
      logger.error('Error fetching invoice by ID', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(invoiceData: any): Promise<any> {
    try {
      // Generate invoice number
      const invoiceNumber = await Invoice.generateInvoiceNumber();
      invoiceData.invoiceNumber = invoiceNumber;
      
      // Set initial values
      invoiceData.status = InvoiceStatus.DRAFT;
      invoiceData.amountPaid = 0;
      invoiceData.balance = invoiceData.total;
      
      const invoice = await Invoice.create(invoiceData);
      
      // If time entries are included, mark them as invoiced
      if (invoiceData.timeEntryIds && Array.isArray(invoiceData.timeEntryIds)) {
        await TimeEntry.updateMany(
          { _id: { $in: invoiceData.timeEntryIds } },
          { invoiced: true, invoice: invoice._id }
        );
      }
      
      logger.info('New invoice created', { invoiceId: invoice._id, invoiceNumber });
      return invoice;
    } catch (error) {
      logger.error('Error creating invoice', { error, invoiceData });
      throw error;
    }
  }

  /**
   * Update an invoice
   */
  static async updateInvoice(invoiceId: string, updateData: any): Promise<any | null> {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false });
      if (!invoice) return null;
      
      // Don't allow updating invoiceNumber
      if (updateData.invoiceNumber) {
        delete updateData.invoiceNumber;
      }
      
      // Update balance if total is changing
      if (updateData.total) {
        updateData.balance = updateData.total - (invoice.amountPaid || 0);
      }
      
      const updatedInvoice = await Invoice.findByIdAndUpdate(
        invoiceId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('client', 'firstName lastName company')
        .populate('case', 'caseNumber title');
      
      logger.info('Invoice updated', { invoiceId });
      return updatedInvoice;
    } catch (error) {
      logger.error('Error updating invoice', { error, invoiceId, updateData });
      throw error;
    }
  }

  /**
   * Delete an invoice (soft delete)
   */
  static async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) return false;
      
      // Soft delete by setting isDeleted flag
      invoice.isDeleted = true;
      await invoice.save();
      
      // Unmark any time entries as invoiced
      await TimeEntry.updateMany(
        { invoice: invoiceId },
        { invoiced: false, $unset: { invoice: 1 } }
      );
      
      logger.info('Invoice deleted (soft)', { invoiceId });
      return true;
    } catch (error) {
      logger.error('Error deleting invoice', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Record a payment for an invoice
   */
  static async recordPayment(invoiceId: string, paymentData: any): Promise<any | null> {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false });
      if (!invoice) return null;
      
      // Add payment to payments array
      const payment: {
        amount: number;
        date: Date;
        method: string;
        reference?: string;
        notes?: string;
      } = {
        amount: paymentData.amount,
        date: paymentData.date || new Date(),
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes
      };
      
      invoice.payments.push(payment);
      
      // Update amount paid and balance
      invoice.amountPaid = (invoice.amountPaid || 0) + payment.amount;
      invoice.balance = invoice.total - invoice.amountPaid;
      
      // Update status if fully paid
      if (invoice.balance <= 0) {
        invoice.status = InvoiceStatus.PAID;
      } else if (invoice.status === InvoiceStatus.DRAFT) {
        invoice.status = InvoiceStatus.UNPAID;
      }
      
      await invoice.save();
      
      logger.info('Invoice payment recorded', { invoiceId, amount: payment.amount });
      return invoice;
    } catch (error) {
      logger.error('Error recording invoice payment', { error, invoiceId, paymentData });
      throw error;
    }
  }

  /**
   * Send an invoice (mark as sent)
   */
  static async sendInvoice(invoiceId: string): Promise<any | null> {
    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false });
      if (!invoice) return null;
      
      // Only draft invoices can be sent
      if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new Error('Only draft invoices can be sent');
      }
      
      invoice.status = InvoiceStatus.UNPAID;
      invoice.sentDate = new Date();
      
      await invoice.save();
      
      logger.info('Invoice sent', { invoiceId });
      return invoice;
    } catch (error) {
      logger.error('Error sending invoice', { error, invoiceId });
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStatistics(): Promise<any> {
    try {
      // Get total invoices
      const totalInvoices = await Invoice.countDocuments({ isDeleted: false });
      
      // Get invoices by status
      const invoicesByStatus = await Invoice.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
      ]);
      
      // Get recently created invoices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentInvoices = await Invoice.countDocuments({
        issueDate: { $gte: thirtyDaysAgo },
        isDeleted: false
      });
      
      // Get total outstanding balance
      const outstandingBalance = await Invoice.aggregate([
        { $match: { status: InvoiceStatus.UNPAID, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]);
      
      // Get total revenue (paid invoices)
      const totalRevenue = await Invoice.aggregate([
        { $match: { status: InvoiceStatus.PAID, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      
      const statistics = {
        totalInvoices,
        invoicesByStatus: invoicesByStatus.reduce((acc: Record<string, { count: number; total: number }>, curr: { _id: string; count: number; total: number }) => {
          acc[curr._id] = { count: curr.count, total: curr.total };
          return acc;
        }, {} as Record<string, { count: number; total: number }>),
        recentInvoices,
        outstandingBalance: outstandingBalance.length > 0 ? outstandingBalance[0].total : 0,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      };
      
      logger.info('Invoice statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating invoice statistics', { error });
      throw error;
    }
  }

  /**
   * Get invoices by client ID
   */
  static async getInvoicesByClient(clientId: string): Promise<any[]> {
    try {
      return await Invoice.find({
        client: clientId,
        isDeleted: false
      })
        .populate('case', 'caseNumber title')
        .sort({ issueDate: -1 });
    } catch (error) {
      logger.error('Error fetching invoices by client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get invoices by case ID
   */
  static async getInvoicesByCase(caseId: string): Promise<any[]> {
    try {
      return await Invoice.find({
        case: caseId,
        isDeleted: false
      })
        .populate('client', 'firstName lastName company')
        .sort({ issueDate: -1 });
    } catch (error) {
      logger.error('Error fetching invoices by case', { error, caseId });
      throw error;
    }
  }
}