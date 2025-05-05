import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  addClientContact,
  removeClientContact,
  getClientCases,
  getClientInvoices,
  getClientStatistics
} from '../controllers/client.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Client statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getClientStatistics
);

// Client contact management
router.post(
  '/:id/contacts',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  addClientContact
);

router.delete(
  '/:id/contacts/:contactId',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  removeClientContact
);

// Get client cases
router.get(
  '/:id/cases',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]),
  getClientCases
);

// Get client invoices
router.get(
  '/:id/invoices',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT, UserRole.CLIENT]),
  getClientInvoices
);

// Basic CRUD routes
router.route('/')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.ACCOUNTANT]), getAllClients)
  .post(authorize([UserRole.ADMIN, UserRole.LAWYER]), createClient);

router.route('/:id')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.ACCOUNTANT, UserRole.CLIENT]), getClientById)
  .patch(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), updateClient)
  .delete(authorize([UserRole.ADMIN, UserRole.LAWYER]), deleteClient);

export default router;