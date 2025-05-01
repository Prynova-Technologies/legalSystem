import express from 'express';
import { authenticate } from '../middlewares/auth';
import { DeviceTrackingService } from '../services/deviceTracking.service';

// Note: Actual controller functions would be imported here
// For now, using placeholder functions to fix TypeScript errors
const authController = {
  register: (req: express.Request, res: express.Response) => {
    res.status(201).json({ message: 'User registered' });
  },
  login: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'User logged in' });
  },
  logout: async (req: express.Request, res: express.Response) => {
    try {
      // End the device session when user logs out
      if (req.user && req.deviceInfo) {
        await DeviceTrackingService.endSession(req.user._id, req.deviceInfo.deviceId);
      }
      res.status(200).json({ message: 'User logged out' });
    } catch (error) {
      res.status(500).json({ message: 'Error during logout' });
    }
  },
  forgotPassword: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Password reset email sent' });
  },
  resetPassword: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Password reset successful' });
  },
  getMe: (req: express.Request, res: express.Response) => {
    res.status(200).json({ message: 'Current user profile' });
  }
};

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