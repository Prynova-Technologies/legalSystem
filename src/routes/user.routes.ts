import express from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';
import { userController } from '../controllers/user.controller';


const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Get all users - Admin only
router.get('/', authorize([UserRole.ADMIN]), userController.getAllUsers);

// Get users by role - Accessible to lawyers, paralegals, and admins
router.get('/role/:role', authorize([UserRole.ADMIN, UserRole.LAWYER, UserRole.PARALEGAL]), userController.getUsersByRole);

// Update own profile - All authenticated users
router.put('/profile/update', userController.updateProfile);

// Change password - All authenticated users
router.put('/profile/password', userController.changePassword);

// Get user by ID
router.get('/:id', authorize([UserRole.ADMIN]), userController.getUserById);

// Create new user - Admin only
router.post('/', authorize([UserRole.ADMIN]), userController.createUser);

// Update user - Admin only
router.put('/:id', authorize([UserRole.ADMIN]), userController.updateUser);

// Delete user - Admin only
router.delete('/:id', authorize([UserRole.ADMIN]), userController.deleteUser);

export default router;