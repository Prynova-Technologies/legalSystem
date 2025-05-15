import Invoice from '../models/invoice.model';
import TimeEntry from '../models/timeEntry.model';
import Expense from '../models/expense.model';
import Client from '../models/client.model';
import Case from '../models/case.model';
import { InvoiceStatus, PaymentMethod } from '../interfaces/billing.interface';
import { ExpenseStatus } from '../interfaces/expense.interface';
import logger from '../utils/logger';

/**
 * Service for billing-related operations
 */
export class BillingService {
  /**
   * Get unbilled items by case ID
   * Retrieves all billable but unbilled time entries and expenses for a specific case,
   * along with the client data associated with the case
   */
  static async getUnbilledItemsByCaseId(caseId: string): Promise<any> {
    try {
      // Find the case and populate client data
      const caseData = await Case.findById(caseId)
        .populate({
          path: 'client',
          select: 'firstName lastName company email phone contacts address clientType'
        });
      
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Get unbilled time entries for this case
      const timeEntries = await TimeEntry.find({
        case: caseId,
        billable: true,
        invoiced: false,
        isDeleted: false
      }).populate('user', 'firstName lastName');

      // Get unbilled expenses for this case
      const expenses = await Expense.find({
        case: caseId,
        billable: true,
        invoiced: false,
        isDeleted: false
      }).populate('submittedBy', 'firstName lastName');

      // Calculate totals
      const timeEntriesTotal = timeEntries.reduce((sum, entry) => {
        return sum + (entry.billableAmount || 0);
      }, 0);

      const expensesTotal = expenses.reduce((sum, expense) => {
        return sum + (expense.billableAmount || expense.amount || 0);
      }, 0);

      return {
        case: caseData,
        client: caseData.client,
        timeEntries,
        expenses,
        timeEntriesTotal,
        expensesTotal,
        subtotal: timeEntriesTotal + expensesTotal
      };
    } catch (error) {
      logger.error('Error fetching unbilled items by case ID', { error, caseId });
      throw error;
    }
  }
  /**
   * Get all invoices with filtering options
   */
  static async getAllInvoices(filters: any = {}, userId?: string): Promise<any[]> {
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
   * Get invoice by ID
   */
  static async getInvoiceById(id: string, userId?: string): Promise<any> {
    try {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false })
        .populate('client', 'firstName lastName company email phone')
        .populate('case', 'caseNumber title')
        .populate({
          path: 'items.timeEntry',
          select: 'description startTime duration billableAmount',
        });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      return invoice;
    } catch (error) {
      logger.error('Error fetching invoice by ID', { error, id });
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  static async createInvoice(invoiceData: any, userId: string): Promise<any> {
    try {
      // Generate invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = await Invoice.generateInvoiceNumber();
      }
      
      // Calculate totals
      let subtotal = 0;
      if (invoiceData.items && invoiceData.items.length > 0) {
        subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
      }
      
      invoiceData.subtotal = subtotal;
      
      // Calculate tax if applicable
      if (invoiceData.taxRate) {
        invoiceData.taxAmount = (subtotal * invoiceData.taxRate) / 100;
      }
      
      // Calculate total
      invoiceData.total = subtotal + (invoiceData.taxAmount || 0) - (invoiceData.discount || 0);
      
      // Set initial status
      invoiceData.status = InvoiceStatus.DRAFT;
      invoiceData.amountPaid = 0;
      invoiceData.balance = invoiceData.total;
      
      // Create invoice
      const invoice = await Invoice.create(invoiceData);
      
      // If time entries are included, mark them as invoiced
      if (invoiceData.timeEntryIds && invoiceData.timeEntryIds.length > 0) {
        await TimeEntry.updateMany(
          { _id: { $in: invoiceData.timeEntryIds } },
          { invoiced: true, invoice: invoice._id }
        );
      }
      
      // If expenses are included, mark them as invoiced
      if (invoiceData.expenseIds && invoiceData.expenseIds.length > 0) {
        await Expense.updateMany(
          { _id: { $in: invoiceData.expenseIds } },
          { invoiced: true, invoice: invoice._id, status: ExpenseStatus.BILLED }
        );
      }
      
      return invoice;
    } catch (error) {
      logger.error('Error creating invoice', { error, invoiceData });
      throw error;
    }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(id: string, updateData: any, userId: string): Promise<any> {
    try {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Don't allow updating if invoice is already paid
      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('Cannot update a paid invoice');
      }
      
      // Recalculate totals if items are updated
      if (updateData.items) {
        let subtotal = updateData.items.reduce((sum: number, item: any) => sum + item.amount, 0);
        updateData.subtotal = subtotal;
        
        // Recalculate tax if applicable
        if (updateData.taxRate !== undefined) {
          updateData.taxAmount = (subtotal * updateData.taxRate) / 100;
        } else if (invoice.taxRate) {
          updateData.taxAmount = (subtotal * invoice.taxRate) / 100;
        }
        
        // Recalculate total
        const taxAmount = updateData.taxAmount !== undefined ? updateData.taxAmount : (invoice.taxAmount || 0);
        const discount = updateData.discount !== undefined ? updateData.discount : (invoice.discount || 0);
        updateData.total = subtotal + taxAmount - discount;
        updateData.balance = updateData.total - (invoice.amountPaid || 0);
      }
      
      // Update invoice
      const updatedInvoice = await Invoice.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('client', 'firstName lastName company email phone')
        .populate('case', 'caseNumber title');
      
      return updatedInvoice;
    } catch (error) {
      logger.error('Error updating invoice', { error, id, updateData });
      throw error;
    }
  }

  /**
   * Delete invoice (soft delete)
   */
  static async deleteInvoice(id: string, userId: string): Promise<boolean> {
    try {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Don't allow deleting if invoice is already paid
      if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIALLY_PAID) {
        throw new Error('Cannot delete a paid invoice');
      }
      
      // Soft delete
      await Invoice.findByIdAndUpdate(id, { isDeleted: true });
      
      // Update any time entries to mark them as not invoiced
      await TimeEntry.updateMany(
        { invoice: id },
        { invoiced: false, $unset: { invoice: 1 } }
      );
      
      // Update any expenses to mark them as not invoiced
      await Expense.updateMany(
        { invoice: id },
        { invoiced: false, status: ExpenseStatus.APPROVED, $unset: { invoice: 1 } }
      );
      
      return true;
    } catch (error) {
      logger.error('Error deleting invoice', { error, id });
      throw error;
    }
  }

  /**
   * Generate payment link for invoice
   */
  static async generatePaymentLink(id: string, userId?: string): Promise<string> {
    try {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // In a real implementation, this would generate a payment link
      // using a payment gateway API
      const paymentLink = `https://payment-gateway.example.com/invoice/${id}`;
      
      return paymentLink;
    } catch (error) {
      logger.error('Error generating payment link', { error, id });
      throw error;
    }
  }

  /**
   * Record payment for invoice
   */
  static async recordPayment(id: string, paymentData: any, userId: string): Promise<any> {
    try {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Add recordedBy to payment data
      const payment = {
        ...paymentData,
        recordedBy: userId,
      };
      
      // Add payment to invoice
      invoice.payments.push(payment);
      
      // Update amount paid and balance
      invoice.amountPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      invoice.balance = invoice.total - invoice.amountPaid;
      
      // Update status based on payment
      invoice.status = invoice.updateStatus();
      
      await invoice.save();
      
      return {
        id,
        payment,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
      };
    } catch (error) {
      logger.error('Error recording payment', { error, id, paymentData });
      throw error;
    }
  }

  /**
   * Get billing statistics
   */
  static async getBillingStats(startDate?: Date, endDate?: Date, userId?: string): Promise<any> {
    try {
      const dateFilter: any = {};
      
      if (startDate) {
        dateFilter.issueDate = { $gte: startDate };
      }
      
      if (endDate) {
        dateFilter.issueDate = dateFilter.issueDate || {};
        dateFilter.issueDate.$lte = endDate;
      }
      
      const invoices = await Invoice.find({ ...dateFilter, isDeleted: false });
      
      // Calculate statistics
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalOutstanding = totalInvoiced - totalPaid;
      const averageInvoiceAmount = invoices.length > 0 ? totalInvoiced / invoices.length : 0;
      
      // Group by month
      const invoicesByMonth: any = {};
      const paymentsByMonth: any = {};
      
      invoices.forEach(invoice => {
        const issueMonth = `${invoice.issueDate.getFullYear()}-${(invoice.issueDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!invoicesByMonth[issueMonth]) {
          invoicesByMonth[issueMonth] = 0;
        }
        invoicesByMonth[issueMonth] += invoice.total;
        
        invoice.payments.forEach((payment: any) => {
          const paymentMonth = `${payment.date.getFullYear()}-${(payment.date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (!paymentsByMonth[paymentMonth]) {
            paymentsByMonth[paymentMonth] = 0;
          }
          paymentsByMonth[paymentMonth] += payment.amount;
        });
      });
      
      // Convert to arrays for easier consumption by frontend
      const invoicesByMonthArray = Object.entries(invoicesByMonth).map(([month, amount]) => ({
        month,
        amount,
      }));
      
      const paymentsByMonthArray = Object.entries(paymentsByMonth).map(([month, amount]) => ({
        month,
        amount,
      }));
      
      return {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        averageInvoiceAmount,
        invoicesByMonth: invoicesByMonthArray,
        paymentsByMonth: paymentsByMonthArray,
      };
    } catch (error) {
      logger.error('Error getting billing stats', { error, startDate, endDate });
      throw error;
    }
  }

  /**
   * Get all time entries
   */
  static async getAllTimeEntries(filters: any = {}, userId?: string): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters
      if (filter.startAfter) {
        filter.startTime = { $gte: new Date(filter.startAfter) };
        delete filter.startAfter;
      }
      
      if (filter.startBefore) {
        filter.startTime = filter.startTime || {};
        filter.startTime.$lte = new Date(filter.startBefore);
        delete filter.startBefore;
      }
      
      return await TimeEntry.find(filter)
        .populate('user', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .populate('task', 'title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching time entries', { error, filters });
      throw error;
    }
  }

  /**
   * Create time entry
   */
  static async createTimeEntry(timeEntryData: any, userId: string): Promise<any> {
    try {
      // Ensure user ID is attached to the time entry
      if (!timeEntryData.user) {
        timeEntryData.user = userId;
      }
      
      // Calculate duration if start and end times are provided
      if (timeEntryData.startTime && timeEntryData.endTime && !timeEntryData.duration) {
        const start = new Date(timeEntryData.startTime);
        const end = new Date(timeEntryData.endTime);
        const durationMs = end.getTime() - start.getTime();
        timeEntryData.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
      }
      
      // Remove empty string invoice field to prevent ObjectId casting error
      if (timeEntryData.invoice === '') {
        delete timeEntryData.invoice;
      }
      
      // Create time entry
      const timeEntry = await TimeEntry.create(timeEntryData);
      
    //   Calculate billable amount if billable
      if (timeEntry.billable && timeEntry.billingRate) {
        timeEntry.calculateBillableAmount();
        await timeEntry.save();
      }
      
      return timeEntry;
    } catch (error) {
      logger.error('Error creating time entry', { error, timeEntryData });
      throw error;
    }
  }

  /**
   * Get all expenses
   */
  static async getAllExpenses(filters: any = {}, userId?: string): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters
      if (filter.startAfter) {
        filter.date = { $gte: new Date(filter.startAfter) };
        delete filter.startAfter;
      }
      
      if (filter.startBefore) {
        filter.date = filter.date || {};
        filter.date.$lte = new Date(filter.startBefore);
        delete filter.startBefore;
      }
      
      // If userId is provided, filter by submittedBy
      if (userId && !filter.submittedBy) {
        filter.submittedBy = userId;
      }
      
      return await Expense.find(filter)
        .populate('submittedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .populate('approvedBy', 'firstName lastName company')
        .sort({ date: -1 });
    } catch (error) {
      logger.error('Error fetching expenses', { error, filters });
      throw error;
    }
  }

  /**
   * Create expense
   */
  static async createExpense(expenseData: any, userId: string): Promise<any> {
    try {
      // Ensure submittedBy is set to the current user
      if (!expenseData.submittedBy) {
        expenseData.submittedBy = userId;
      }
      
      // Calculate billable amount if billable and not already set
      if (expenseData.billable && !expenseData.billableAmount) {
        const markupPercentage = expenseData.markupPercentage || 0;
        expenseData.billableAmount = parseFloat((expenseData.amount * (1 + markupPercentage / 100)).toFixed(2));
        delete expenseData.markupPercentage; // Remove temporary field
      }
      
      // Create expense
      const expense = await Expense.create(expenseData);
      
      return expense;
    } catch (error) {
      logger.error('Error creating expense', { error, expenseData });
      throw error;
    }
  }

  /**
   * Update expense
   */
  static async updateExpense(id: string, updateData: any, userId: string): Promise<any> {
    try {
      const expense = await Expense.findOne({ _id: id, isDeleted: false });
      
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      // Don't allow updating if expense is already billed/invoiced
      if (expense.invoiced) {
        throw new Error('Cannot update an invoiced expense');
      }
      
      // Set approvedBy field if expense is being approved
      if (updateData.isApproved === true && !expense.isApproved) {
        updateData.approvedBy = userId;
      }
      
      // Recalculate billable amount if amount or billable status changed
      if (updateData.billable !== undefined || updateData.amount !== undefined) {
        const isBillable = updateData.billable !== undefined ? updateData.billable : expense.billable;
        const amount = updateData.amount !== undefined ? updateData.amount : expense.amount;
        
        if (isBillable) {
          const markupPercentage = updateData.markupPercentage || 0;
          updateData.billableAmount = parseFloat((amount * (1 + markupPercentage / 100)).toFixed(2));
          delete updateData.markupPercentage; // Remove temporary field
        } else {
          updateData.billableAmount = 0;
        }
      }
      
      // Update expense
      const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('submittedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
      
      return updatedExpense;
    } catch (error) {
      logger.error('Error updating expense', { error, id, updateData });
      throw error;
    }
  }

  /**
   * Delete expense (soft delete)
   */
  static async deleteExpense(id: string, userId: string): Promise<boolean> {
    try {
      const expense = await Expense.findOne({ _id: id, isDeleted: false });
      
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      // Don't allow deleting if expense is already billed/invoiced
      if (expense.invoiced) {
        throw new Error('Cannot delete an invoiced expense');
      }
      
      // Soft delete
      await Expense.findByIdAndUpdate(id, { isDeleted: true });
      
      return true;
    } catch (error) {
      logger.error('Error deleting expense', { error, id });
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  static async getExpenseById(id: string, userId?: string): Promise<any> {
    try {
      const expense = await Expense.findOne({ _id: id, isDeleted: false })
        .populate('submittedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
      
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      return expense;
    } catch (error) {
      logger.error('Error fetching expense by ID', { error, id });
      throw error;
    }
  }
}