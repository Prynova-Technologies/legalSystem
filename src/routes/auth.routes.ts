import express from 'express';
import { authenticate } from '../middlewares/auth';
import { authController } from '../controllers/auth.controller';


const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);

export default router;