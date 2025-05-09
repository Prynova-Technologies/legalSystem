import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskReminder,
  getOverdueTasks,
  getUserTasks,
  getCaseTasks,
  getTaskStatistics
} from '../controllers/task.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../interfaces/user.interface';

const router = express.Router();

// Authenticate all routes
router.use(authenticate);

// Task statistics - restricted to admin and lawyers
router.get(
  '/statistics',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getTaskStatistics
);

// Get overdue tasks
router.get('/overdue', getOverdueTasks);

// Get tasks for current user
router.get('/my-tasks', getUserTasks);

// Get tasks for a specific user - restricted to admin and lawyers
router.get(
  '/user/:userId',
  authorize([UserRole.ADMIN, UserRole.LAWYER]),
  getUserTasks
);

// Get tasks for a specific case
router.get('/case/:caseId', getCaseTasks);

// Add reminder to a task
router.post('/:id/reminders', addTaskReminder);

// Standard CRUD routes
router
  .route('/')
  .get(getAllTasks)
  .post(createTask);

router
  .route('/:id')
  .get(getTaskById)
  .patch(updateTask)
  .delete(deleteTask);

export default router;