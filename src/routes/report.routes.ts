import express from 'express';
import { generateReport } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Reports generation - restricted to admin, lawyers, and accountants
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.ACCOUNTANT]),
  generateReport
);

export default router;