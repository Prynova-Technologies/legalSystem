import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generatePaymentLink,
  recordPayment,
  getBillingStats,
  getAllTimeEntries,
  createTimeEntry,
  getAllExpenses,
  createExpense,
  updateExpense
} from '../controllers/billing.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';


const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Invoice routes
// Get all invoices - Admin, Lawyer, Accountant
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getAllInvoices
);

// Get billing statistics - Admin, Accountant
// Note: This route must be defined before the '/:id' route to avoid conflicts
router.get(
  '/stats',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  getBillingStats
);

// Time entry routes
// Get all time entries - Admin, Lawyer, Accountant
router.get(
  '/time-entries',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getAllTimeEntries
);

// Create time entry - Admin, Lawyer, Paralegal
router.post(
  '/time-entries',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  createTimeEntry
);

// Expense routes
// Get all expenses - Admin, Lawyer, Accountant
router.get(
  '/expenses',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  getAllExpenses
);

// Create expense - Admin, Lawyer, Paralegal
router.post(
  '/expenses',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  createExpense
);

// Update expense - Admin, Lawyer, Paralegal
router.patch(
  '/expenses/:id',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  updateExpense
);

// Get invoice by ID
router.get(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT, UserRole.CLIENT]),
  getInvoiceById
);

// Create new invoice - Admin, Lawyer, Accountant
router.post(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  createInvoice
);

// Update invoice - Admin, Lawyer, Accountant
router.put(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  updateInvoice
);

// Delete invoice - Admin only
router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  deleteInvoice
);

// Generate payment link
router.post(
  '/:id/payment-link',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  generatePaymentLink
);

// Record payment
router.post(
  '/:id/payments',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  recordPayment
);



export default router;