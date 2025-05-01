import express from 'express';
import { getDashboardAnalytics } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Dashboard analytics - restricted to admin, lawyers, and accountants
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  getDashboardAnalytics
);

export default router;