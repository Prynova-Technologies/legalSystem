import express from 'express';
import {
  getAllMessages,
  getMessageById,
  createMessage,
  deleteMessage,
  getUserInbox,
  getUserSentMessages,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMessageStatistics
} from '../controllers/communication.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Message statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getMessageStatistics
);

// User-specific message routes
router.get(
  '/inbox',
  getUserInbox
);

router.get(
  '/sent',
  getUserSentMessages
);

// Notification routes
router.get(
  '/notifications',
  getUserNotifications
);

router.put(
  '/notifications/:id/read',
  markNotificationRead
);

router.put(
  '/notifications/read-all',
  markAllNotificationsRead
);

// Basic CRUD routes
router.route('/')
  .get(authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), getAllMessages)
  .post(createMessage);

router.route('/:id')
  .get(getMessageById)
  .delete(deleteMessage);

export default router;