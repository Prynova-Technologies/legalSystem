import express from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import caseRoutes from './case.routes';
import clientRoutes from './client.routes';
import documentRoutes from './document.routes';
import billingRoutes from './billing.routes';
import deviceSessionRoutes from './deviceSession.routes';
import communicationRoutes from './communication.routes';
import settingsRoutes from './settings.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import taskRoutes from './task.routes';
import timeEntryRoutes from './timeEntry.routes';
import invoiceRoutes from './invoice.routes';

const router = express.Router();

// Register routes
router.use('/api/tasks', taskRoutes);
router.use('/api/time-entries', timeEntryRoutes);
router.use('/api/invoices', invoiceRoutes);
router.use('/api/cases', caseRoutes);
router.use('/api/clients', clientRoutes);
router.use('/documents', documentRoutes);
router.use('/billing', billingRoutes);
router.use('/device-sessions', deviceSessionRoutes);
router.use('/api/messages', communicationRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/reports', reportRoutes);

export default router;