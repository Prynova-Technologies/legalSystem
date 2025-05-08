import express from 'express';
import {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addCaseParty,
  removeCaseParty,
  addCaseActivity,
  getCaseStatistics,
  getCaseTimeline,
  addCaseNote
} from '../controllers/case.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Case statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getCaseStatistics
);

// Get case timeline
router.get(
  '/:id/timeline',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]),
  getCaseTimeline
);

// Case party management
router.post(
  '/:id/parties',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  addCaseParty
);

router.delete(
  '/:id/parties/:partyId',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  removeCaseParty
);

// Case activity management
router.post(
  '/:id/activities',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  addCaseActivity
);

// Case note management
router.post(
  '/:id/notes',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]),
  addCaseNote
);

// Basic CRUD routes
router.route('/')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]), getAllCases)
  .post(authorize([UserRole.ADMIN, UserRole.LAWYER]), createCase);

router.route('/:id')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL, UserRole.CLIENT]), getCaseById)
  .put(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), updateCase)
  .delete(authorize([UserRole.ADMIN, UserRole.LAWYER]), deleteCase);

export default router;