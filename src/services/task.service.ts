import Task from '../models/task.model';
import TimeEntry from '../models/timeEntry.model';
import { TaskStatus } from '../interfaces/task.interface';
import logger from '../utils/logger';

/**
 * Service for task-related operations
 */
export class TaskService {
  /**
   * Get task statistics
   */
  static async getTaskStatistics(): Promise<any> {
    try {
      const totalTasks = await Task.countDocuments({ isDeleted: false });
      const completedTasks = await Task.countDocuments({ status: TaskStatus.COMPLETED, isDeleted: false });
      const overdueTasks = await Task.countDocuments({
        dueDate: { $lt: new Date() },
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        isDeleted: false
      });
      
      // Get tasks by status
      const tasksByStatus = await Task.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      // Get tasks by priority
      const tasksByPriority = await Task.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);
      
      // Get billable hours
      const billableHours = await TimeEntry.aggregate([
        { $match: { task: { $exists: true }, billable: true } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
      ]);
      
      const statistics = {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        tasksByStatus: tasksByStatus.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        tasksByPriority: tasksByPriority.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        billableHours: billableHours.length > 0 ? billableHours[0].total / 60 : 0
      };
      
      logger.info('Task statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating task statistics', { error });
      throw error;
    }
  }

  /**
   * Get all tasks with filtering options
   */
  static async getAllTasks(filters: any = {}): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters if they exist in the filters object
      if (filter.dueBefore) {
        filter.dueDate = { $lte: new Date(filter.dueBefore) };
        delete filter.dueBefore;
      }
      
      if (filter.dueAfter) {
        filter.dueDate = filter.dueDate || {};
        filter.dueDate.$gte = new Date(filter.dueAfter);
        delete filter.dueAfter;
      }
      
      // Handle tag filtering
      if (filter.tags && typeof filter.tags === 'string') {
        const tags = filter.tags.split(',');
        filter.tags = { $in: tags };
      }
      
      return await Task.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .sort({ dueDate: 1, priority: -1 });
    } catch (error) {
      logger.error('Error fetching tasks', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single task by ID
   */
  static async getTaskById(taskId: string): Promise<any | null> {
    try {
      return await Task.findOne({ _id: taskId, isDeleted: false })
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title');
    } catch (error) {
      logger.error('Error fetching task by ID', { error, taskId });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  static async createTask(taskData: any): Promise<any> {
    try {
      const task = await Task.create(taskData);
      logger.info('New task created', { taskId: task._id });
      return task;
    } catch (error) {
      logger.error('Error creating task', { error, taskData });
      throw error;
    }
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, updateData: any): Promise<any | null> {
    try {
      // Check if task exists and is not deleted
      const task = await Task.findOne({ _id: taskId, isDeleted: false });
      if (!task) return null;
      
      // If status is being updated to COMPLETED, set completedDate
      if (updateData.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        updateData.completedDate = new Date();
      }
      
      // If status is being changed from COMPLETED, remove completedDate
      if (task.status === TaskStatus.COMPLETED && updateData.status && updateData.status !== TaskStatus.COMPLETED) {
        updateData.completedDate = undefined;
      }
      
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title');
      
      logger.info('Task updated', { taskId });
      return updatedTask;
    } catch (error) {
      logger.error('Error updating task', { error, taskId, updateData });
      throw error;
    }
  }

  /**
   * Delete a task (soft delete)
   */
  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const task = await Task.findById(taskId);
      if (!task) return false;
      
      // Soft delete by setting isDeleted flag
      task.isDeleted = true;
      await task.save();
      
      logger.info('Task deleted (soft)', { taskId });
      return true;
    } catch (error) {
      logger.error('Error deleting task', { error, taskId });
      throw error;
    }
  }

  /**
   * Add a reminder to a task
   */
  static async addTaskReminder(taskId: string, reminderDate: Date): Promise<any | null> {
    try {
      const task = await Task.findOne({ _id: taskId, isDeleted: false });
      if (!task) return null;
      
      task.addReminder(reminderDate);
      await task.save();
      
      logger.info('Task reminder added', { taskId, reminderDate });
      return task;
    } catch (error) {
      logger.error('Error adding task reminder', { error, taskId, reminderDate });
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(): Promise<any[]> {
    try {
      const today = new Date();
      
      return await Task.find({
        dueDate: { $lt: today },
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        isDeleted: false
      })
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .sort({ dueDate: 1, priority: -1 });
    } catch (error) {
      logger.error('Error fetching overdue tasks', { error });
      throw error;
    }
  }

  /**
   * Get tasks for a specific user
   */
  static async getTasksByUser(userId: string): Promise<any[]> {
    try {
      return await Task.find({
        assignedTo: userId,
        isDeleted: false
      })
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .sort({ dueDate: 1, priority: -1 });
    } catch (error) {
      logger.error('Error fetching tasks by user', { error, userId });
      throw error;
    }
  }

  /**
   * Get tasks for a specific case
   */
  static async getTasksByCase(caseId: string): Promise<any[]> {
    try {
      return await Task.find({
        case: caseId,
        isDeleted: false
      })
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedBy', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .sort({ dueDate: 1, priority: -1 });
    } catch (error) {
      logger.error('Error fetching tasks by case', { error, caseId });
      throw error;
    }
  }
}