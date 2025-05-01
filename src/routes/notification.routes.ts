import express from 'express';
import { authenticate } from '../middlewares/auth';
import {
  sendInvoiceNotification,
  sendCaseUpdateNotification,
  sendDocumentNotification,
  sendAppointmentReminder
} from '../controllers/notification.controller';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Notification endpoints
router.post('/invoice', sendInvoiceNotification);
router.post('/case-update', sendCaseUpdateNotification);
router.post('/document', sendDocumentNotification);
router.post('/appointment', sendAppointmentReminder);

export default router;