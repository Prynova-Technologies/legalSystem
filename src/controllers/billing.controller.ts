import { Request, Response } from 'express';
import { BillingService } from '../services/billing.service';

/**
 * Get all invoices
 * @route GET /api/billing
 * @access Private - Admin, Lawyer, Accountant
 */
export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await BillingService.getAllInvoices(req.query);
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get invoice by ID
 * @route GET /api/billing/:id
 * @access Private - Admin, Lawyer, Accountant, Client (own invoices)
 */
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const invoice = await BillingService.getInvoiceById(id);
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

/**
 * Create new invoice
 * @route POST /api/billing
 * @access Private - Admin, Lawyer, Accountant
 */
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await BillingService.createInvoice(req.body, (req.user as any)?._id);
    
    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Update invoice
 * @route PUT /api/billing/:id
 * @access Private - Admin, Lawyer, Accountant
 */
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const invoice = await BillingService.updateInvoice(id, req.body, (req.user as any)?._id);
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    } else if (error.message === 'Cannot update a paid invoice') {
      res.status(400).json({
        success: false,
        error: 'Cannot update a paid invoice'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

/**
 * Delete invoice
 * @route DELETE /api/billing/:id
 * @access Private - Admin only
 */
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await BillingService.deleteInvoice(id, (req.user as any)?._id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    } else if (error.message === 'Cannot delete a paid invoice') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a paid invoice'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

/**
 * Generate payment link for invoice
 * @route POST /api/billing/:id/payment-link
 * @access Private - Admin, Lawyer, Accountant
 */
export const generatePaymentLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const paymentLink = await BillingService.generatePaymentLink(id);
    
    res.status(200).json({
      success: true,
      data: { paymentLink }
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

/**
 * Record payment for invoice
 * @route POST /api/billing/:id/payments
 * @access Private - Admin, Lawyer, Accountant
 */
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Assuming user ID is available in req.user.id from auth middleware
    const userId = (req as any).user?.id || '000000000000000000000000';
    
    const result = await BillingService.recordPayment(id, req.body, userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

/**
 * Get billing statistics
 * @route GET /api/billing/stats
 * @access Private - Admin, Accountant
 */
export const getBillingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const stats = await BillingService.getBillingStats(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get all time entries
 * @route GET /api/billing/time-entries
 * @access Private - Admin, Lawyer, Accountant
 */
export const getAllTimeEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntries = await BillingService.getAllTimeEntries(req.query);
    
    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Create time entry
 * @route POST /api/billing/time-entries
 * @access Private - Admin, Lawyer, Paralegal
 */
export const createTimeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const timeEntry = await BillingService.createTimeEntry(req.body, (req.user as any)?._id);
    
    res.status(201).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get all expenses
 * @route GET /api/billing/expenses
 * @access Private - Admin, Lawyer, Accountant
 */
export const getAllExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const expenses = await BillingService.getAllExpenses(req.query);
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Create expense
 * @route POST /api/billing/expenses
 * @access Private - Admin, Lawyer, Paralegal
 */
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await BillingService.createExpense(req.body, (req.user as any)?._id);
    
    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};