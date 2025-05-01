import express from 'express';
import { authenticate } from '../middlewares/auth';
import { deviceSessionController } from '../controllers/deviceSession.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get active sessions for current user
router.get('/active', deviceSessionController.getActiveSessions);

// End a specific session
router.post('/end', deviceSessionController.endSession);

// End all other sessions
router.post('/end-all-other', deviceSessionController.endAllOtherSessions);

// Admin route for suspicious logins
router.get('/suspicious', deviceSessionController.getSuspiciousLogins);

export default router;