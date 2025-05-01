import express from 'express';
import {
  getAllTimeEntries,
  getTimeEntryById,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getUserTimeEntries,
  getCaseTimeEntries,
  getTaskTimeEntries,
  getUnbilledTimeEntries,
  getTimeTrackingStatistics
} from '../controllers/timeEntry.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Time tracking statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getTimeTrackingStatistics
);

// Get unbilled time entries - restricted to admin, lawyers, and accountants
router.get(
  '/unbilled',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getUnbilledTimeEntries
);

// Get time entries for current user
router.get('/my-entries', getUserTimeEntries);

// Get time entries for a specific user - restricted to admin and lawyers
router.get(
  '/user/:userId',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getUserTimeEntries
);

// Get time entries for a specific case
router.get('/case/:caseId', getCaseTimeEntries);

// Get time entries for a specific task
router.get('/task/:taskId', getTaskTimeEntries);

// Standard CRUD routes
router
  .route('/')
  .get(getAllTimeEntries)
  .post(createTimeEntry);

router
  .route('/:id')
  .get(getTimeEntryById)
  .put(updateTimeEntry)
  .delete(deleteTimeEntry);

export default router;