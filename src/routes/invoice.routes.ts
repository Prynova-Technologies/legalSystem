import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  addInvoicePayment,
  getOverdueInvoices,
  getInvoiceStatistics,
  generateInvoiceFromTimeEntries
} from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Invoice statistics - restricted to admin, lawyers, and accountants
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getInvoiceStatistics
);

// Get overdue invoices - restricted to admin, lawyers, and accountants
router.get(
  '/overdue',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getOverdueInvoices
);

// Generate invoice from time entries - restricted to admin, lawyers, and accountants
router.post(
  '/generate',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  generateInvoiceFromTimeEntries
);

// Basic CRUD routes
router.route('/')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT, UserRole.PARALEGAL]), getAllInvoices)
  .post(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]), createInvoice);

router.route('/:id')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT, UserRole.PARALEGAL, UserRole.CLIENT]), getInvoiceById)
  .put(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]), updateInvoice)
  .delete(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]), deleteInvoice);

// Add payment to invoice
router.post(
  '/:id/payment',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  addInvoicePayment
);

export default router;