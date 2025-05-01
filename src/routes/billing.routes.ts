import express from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

// Note: Actual controller functions would be imported here
// For now, using placeholder functions to fix TypeScript errors
const billingController = {
  getAllInvoices: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Get all invoices' });
  },
  getInvoiceById: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Get invoice by ID' });
  },
  createInvoice: (req: express.Request, res: express.Response) => {
    res.status(201).json({ message: 'Create invoice' });
  },
  updateInvoice: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Update invoice' });
  },
  deleteInvoice: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Delete invoice' });
  },
  generatePaymentLink: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Generate payment link' });
  },
  recordPayment: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Record payment' });
  },
  getBillingStats: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Get billing statistics' });
  }
};

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Get all invoices - Admin, Lawyer, Accountant
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  billingController.getAllInvoices
);

// Get invoice by ID
router.get(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT, UserRole.CLIENT]),
  billingController.getInvoiceById
);

// Create new invoice - Admin, Lawyer, Accountant
router.post(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  billingController.createInvoice
);

// Update invoice - Admin, Lawyer, Accountant
router.put(
  '/:id',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  billingController.updateInvoice
);

// Delete invoice - Admin only
router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  billingController.deleteInvoice
);

// Generate payment link
router.post(
  '/:id/payment-link',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  billingController.generatePaymentLink
);

// Record payment
router.post(
  '/:id/payments',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  billingController.recordPayment
);

// Get billing statistics - Admin, Accountant
router.get(
  '/stats',
  authorize([UserRole.ADMIN, UserRole.ACCOUNTANT]),
  billingController.getBillingStats
);

export default router;