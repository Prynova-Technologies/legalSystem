import { Request, Response, NextFunction } from 'express';
import Invoice from '../models/invoice.model';
import TimeEntry from '../models/timeEntry.model';
import { InvoiceStatus } from '../interfaces/billing.interface';
import { InvoiceService }  from '../services/invoice.service';

// Get all invoices with filtering options
export const getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.client) filter.client = req.query.client;
    if (req.query.case) filter.case = req.query.case;
    if (req.query.status) filter.status = req.query.status;
    
    // Date range filters
    if (req.query.issuedAfter) filter.issueDate = { $gte: new Date(req.query.issuedAfter as string) };
    if (req.query.issuedBefore) {
      filter.issueDate = filter.issueDate || {};
      filter.issueDate.$lte = new Date(req.query.issuedBefore as string);
    }
    
    if (req.query.dueAfter) filter.dueDate = { $gte: new Date(req.query.dueAfter as string) };
    if (req.query.dueBefore) {
      filter.dueDate = filter.dueDate || {};
      filter.dueDate.$lte = new Date(req.query.dueBefore as string);
    }
    
    const invoices = await Invoice.find(filter)
      .populate('client', 'firstName lastName company')
      .populate('case', 'caseNumber title')
      .sort({ issueDate: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// Get a single invoice by ID
export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false })
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
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Create a new invoice
export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate required fields
    if (!req.body.client) {
      return res.status(400).json({
        success: false,
        message: 'Client is required'
      });
    }
    
    // Create the invoice using the service which handles calculations, email sending,
    // and marking time entries and expenses as billed
    const invoice = await InvoiceService.createInvoice(req.body);
    
    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Update an invoice
export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // Check if invoice exists and is not deleted
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Don't allow updating certain fields if invoice is already sent or paid
    if (invoice.status !== InvoiceStatus.DRAFT && 
        (req.body.items || req.body.subtotal || req.body.total || req.body.taxRate || req.body.taxAmount || req.body.discount)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify invoice items or amounts after invoice has been sent or paid'
      });
    }
    
    // Update the invoice using the service which handles calculations and email sending
    const updatedInvoice = await InvoiceService.updateInvoice(req.params.id, req.body);
    
    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Update status based on new values if needed
    if (updatedInvoice.updateStatus) {
      updatedInvoice.status = updatedInvoice.updateStatus();
      await updatedInvoice.save();
    }
    
    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// Delete an invoice (soft delete)
export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await InvoiceService.deleteInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add payment to an invoice
export const addInvoicePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    if (!req.body.amount || !req.body.method) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount and method are required'
      });
    }
    
    // Add payment
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    invoice.addPayment(req.body, req.user.id);
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue invoices
export const getOverdueInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overdueInvoices = await Invoice.getOverdueInvoices();
    
    res.status(200).json({
      success: true,
      count: overdueInvoices.length,
      data: overdueInvoices
    });
  } catch (error) {
    next(error);
  }
};

// Get invoice statistics
export const getInvoiceStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total revenue for current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const yearlyRevenue = await Invoice.getTotalRevenue(startOfYear, endOfYear);
    
    // Get invoices by status
    const invoicesByStatus = await Invoice.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }
    ]);
    
    // Get outstanding balance
    const outstandingBalance = await Invoice.aggregate([
      { 
        $match: { 
          status: { $nin: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
          isDeleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);
    
    // Get monthly revenue for the current year
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          status: InvoiceStatus.PAID,
          'payments.date': { $gte: startOfYear, $lte: endOfYear },
          isDeleted: false
        }
      },
      {
        $unwind: '$payments'
      },
      {
        $match: {
          'payments.date': { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$payments.date' },
          revenue: { $sum: '$payments.amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const statistics = {
      yearlyRevenue,
      outstandingBalance: outstandingBalance.length > 0 ? outstandingBalance[0].total : 0,
      invoicesByStatus: invoicesByStatus.reduce((acc: any, curr: any) => {
        acc[curr._id] = {
          count: curr.count,
          total: curr.total
        };
        return acc;
      }, {}),
      monthlyRevenue: Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const found = monthlyRevenue.find(item => item._id === month);
        return {
          month,
          revenue: found ? found.revenue : 0
        };
      })
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

// Generate invoice from unbilled time entries
// Send an invoice (mark as sent and send email)
export const sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Import the invoice service
    const { InvoiceService } = await import('../services/invoice.service');
    
    const invoice = await InvoiceService.sendInvoice(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Invoice marked as sent and email notification sent to client'
    });
  } catch (error) {
    next(error);
  }
};

export const generateInvoiceFromTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }
    
    // Get unbilled time entries for the client
    const filter: any = {
      billable: true,
      invoiced: false,
      isDeleted: false
    };
    
    if (req.body.caseId) {
      filter.case = req.body.caseId;
    } else {
      // If no case specified, we need to find entries for any case belonging to this client
      // This would require a more complex query in a real implementation
    }
    
    if (req.body.timeEntryIds && Array.isArray(req.body.timeEntryIds)) {
      filter._id = { $in: req.body.timeEntryIds };
    }
    
    const timeEntries = await TimeEntry.find(filter)
      .populate('user', 'firstName lastName')
      .populate('case', 'caseNumber title')
      .populate('task', 'title');
    
    // Check if we have expenses to include
    let expenses = [];
    if (req.body.expenseIds && Array.isArray(req.body.expenseIds) && req.body.expenseIds.length > 0) {
      const Expense = (await import('../models/expense.model')).default;
      expenses = await Expense.find({
        _id: { $in: req.body.expenseIds },
        billable: true,
        invoiced: false,
        isDeleted: false
      });
    }
    
    // If no billable items found, return error
    if (timeEntries.length === 0 && expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No unbilled items found for this client'
      });
    }
    
    // Generate invoice items from time entries
    const timeEntryItems = timeEntries.map((entry: any) => ({
      description: `${entry.description} (${entry.user.firstName} ${entry.user.lastName})`,
      quantity: entry.duration / 60, // Convert minutes to hours
      rate: entry.billingRate || 0,
      amount: entry.billableAmount || 0,
      timeEntry: entry._id,
      case: entry.case?._id,
      taxable: true
    }));
    
    // Generate invoice items from expenses
    const expenseItems = expenses.map((expense: any) => ({
      description: `Expense: ${expense.description}`,
      quantity: 1,
      rate: expense.billableAmount || expense.amount || 0,
      amount: expense.billableAmount || expense.amount || 0,
      expense: expense._id,
      case: expense.case,
      taxable: true
    }));
    
    // Combine all items
    const items = [...timeEntryItems, ...expenseItems];
    
    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // Calculate tax if applicable
    const taxRate = req.body.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    
    // Calculate total
    const discount = req.body.discount || 0;
    const total = subtotal + taxAmount - discount;
    
    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    
    // Create invoice data
    const invoiceData = {
      invoiceNumber,
      client: req.body.clientId,
      case: req.body.caseId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      status: InvoiceStatus.DRAFT,
      payments: [],
      amountPaid: 0,
      balance: total,
      notes: req.body.notes,
      terms: req.body.terms || 'Payment due within 30 days of invoice date.',
      timeEntryIds: timeEntries.map((entry: any) => entry._id),
      expenseIds: expenses.map((expense: any) => expense._id)
    };
    
    // Use the invoice service to create the invoice which will handle marking items as billed
    const invoice = await InvoiceService.createInvoice(invoiceData);
    
    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};