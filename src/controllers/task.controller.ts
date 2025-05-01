import { Request, Response, NextFunction } from 'express';
import TimeEntry from '../models/timeEntry.model';
import { TaskStatus } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';

// Get all tasks with filtering options
export const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = {};
    
    // Apply filters if provided
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.case) filter.case = req.query.case;
    if (req.query.billable) filter.billable = req.query.billable === 'true';
    
    // Date range filters
    if (req.query.dueBefore) filter.dueBefore = req.query.dueBefore;
    if (req.query.dueAfter) filter.dueAfter = req.query.dueAfter;
    
    // Tag filtering
    if (req.query.tags) filter.tags = req.query.tags;
    
    const tasks = await TaskService.getAllTasks(filter);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await TaskService.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Create a new task
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add the current user as the assigner
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    req.body.assignedBy = req.user.id;
    
    const task = await TaskService.createTask(req.body);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Update a task
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedTask = await TaskService.updateTask(req.params.id, req.body);
    
    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

// Delete a task (soft delete)
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await TaskService.deleteTask(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add a reminder to a task
export const addTaskReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Reminder date is required'
      });
    }
    
    const task = await TaskService.addTaskReminder(req.params.id, new Date(req.body.reminderDate));
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue tasks
export const getOverdueTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await TaskService.getOverdueTasks();
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks assigned to a specific user
export const getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.userId && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    const userId = req.params.userId || (req.user ? req.user.id : undefined);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const tasks = await TaskService.getTasksByUser(userId);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks for a specific case
export const getCaseTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await TaskService.getTasksByCase(req.params.caseId);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// Get task statistics
export const getTaskStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await TaskService.getTaskStatistics();
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};