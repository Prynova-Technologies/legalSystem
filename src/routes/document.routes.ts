import express from 'express';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  addDocumentVersion,
  shareDocument,
  removeDocumentShare,
  getDocumentStatistics
} from '../controllers/document.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Document statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getDocumentStatistics
);

// Document version management
router.post(
  '/:id/versions',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  addDocumentVersion
);

// Document sharing
router.post(
  '/:id/share',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  shareDocument
);

router.delete(
  '/:id/share/:shareId',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  removeDocumentShare
);

// Basic CRUD routes
router.route('/')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]), getAllDocuments)
  .post(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), createDocument);

router.route('/:id')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]), getDocumentById)
  .put(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), updateDocument)
  .delete(authorize([UserRole.ADMIN, UserRole.LAWYER]), deleteDocument);

export default router;