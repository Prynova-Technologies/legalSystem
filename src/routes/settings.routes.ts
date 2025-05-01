import express from 'express';
import { getSettings, updateSettings, testEmailConfig } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// Get company settings
router.get('/', authenticate, getSettings);

// Update company settings
router.put('/', authenticate, updateSettings);

// Test email configuration
router.post('/test-email', authenticate, testEmailConfig);

export default router;