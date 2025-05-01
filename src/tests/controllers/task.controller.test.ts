import request from 'supertest';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { TaskStatus, TaskPriority } from '../../interfaces/task.interface';
import Task from '../../models/task.model';

// Mock the express app and authentication middleware
jest.mock('../../middlewares/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: mockUserId };
    next();
assigned  }),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

// Mock data
const mockUserId = new mongoose.Types.ObjectId().toString();
const mockAssignerId = new mongoose.Types.ObjectId().toString();
const mockCaseId = new mongoose.Types.ObjectId().toString();

const mockTask = {
  title: 'Test Task',
  description: 'This is a test task',
  assignedTo: mockUserId,
  assignedBy: mockAssignerId,
  case: mockCaseId,
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.TODO,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  billable: true,
  tags: ['test', 'api'],
  notes: 'Test notes'
};

describe('Task Controller Tests', () => {
  let app: any;
  
  beforeAll(async () => {
    // In a real test, we would import the actual app
    // For this example, we'll mock the app behavior
    const express = require('express');
    app = express();
    
    // Mock routes setup would go here
    // This is simplified for demonstration purposes
  });

  beforeEach(async () => {
    // Clear the tasks collection before each test
    await Task.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/tasks', () => {
    it('should return all non-deleted tasks', async () => {
      // Create test tasks
      await Task.create(mockTask);
      await Task.create({
        ...mockTask,
        title: 'Another Task',
        isDeleted: true // This one shouldn't be returned
      });

      const res = await request(app).get('/api/tasks');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test Task');
    });

    it('should filter tasks by status', async () => {
      // Create tasks with different statuses
      await Task.create(mockTask); // TODO status
      await Task.create({
        ...mockTask,
        title: 'In Progress Task',
        status: TaskStatus.IN_PROGRESS
      });

      const res = await request(app).get(`/api/tasks?status=${TaskStatus.IN_PROGRESS}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('In Progress Task');
    });

    it('should filter tasks by priority', async () => {
      await Task.create(mockTask); // MEDIUM priority
      await Task.create({
        ...mockTask,
        title: 'High Priority Task',
        priority: TaskPriority.HIGH
      });

      const res = await request(app).get(`/api/tasks?priority=${TaskPriority.HIGH}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('High Priority Task');
    });

    it('should filter tasks by assignedTo', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      
      await Task.create(mockTask); // Assigned to mockUserId
      await Task.create({
        ...mockTask,
        title: 'Other User Task',
        assignedTo: otherUserId
      });

      const res = await request(app).get(`/api/tasks?assignedTo=${otherUserId}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Other User Task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send(mockTask);
      
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(mockTask.title);
      
      // Verify task was saved to database
      const savedTask = await Task.findById(res.body.data._id);
      expect(savedTask).toBeTruthy();
      expect(savedTask?.title).toBe(mockTask.title);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidTask = {
        priority: TaskPriority.LOW
        // Missing required fields: title, description, assignedTo, assignedBy
      };

      const res = await request(app)
        .post('/api/tasks')
        .send(invalidTask);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get task by ID', async () => {
      // Create a task
      const task = await Task.create(mockTask);
      
      const res = await request(app).get(`/api/tasks/${task._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(task._id.toString());
    });

    it('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app).get(`/api/tasks/${nonExistentId}`);
      
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task', async () => {
      // Create a task
      const task = await Task.create(mockTask);
      
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.IN_PROGRESS
      };

      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .send(updateData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.status).toBe(updateData.status);
      
      // Verify task was updated in database
      const updatedTask = await Task.findById(task._id);
      expect(updatedTask?.title).toBe(updateData.title);
      expect(updatedTask?.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should soft delete a task', async () => {
      // Create a task
      const task = await Task.create(mockTask);
      
      const res = await request(app).delete(`/api/tasks/${task._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      
      // Verify task is soft deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeTruthy();
      expect(deletedTask?.isDeleted).toBe(true);
    });
  });

  describe('GET /api/tasks/overdue', () => {
    it('should get overdue tasks', async () => {
      // Create an overdue task
      await Task.create({
        ...mockTask,
        title: 'Overdue Task',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      });
      
      // Create a future task
      await Task.create({
        ...mockTask,
        title: 'Future Task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day in future
      });

      const res = await request(app).get('/api/tasks/overdue');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Overdue Task');
    });
  });

  describe('GET /api/tasks/user/:userId', () => {
    it('should get tasks for a specific user', async () => {
      const otherUserId = new mongoose.Types.ObjectId().toString();
      
      // Create tasks for different users
      await Task.create(mockTask); // For mockUserId
      await Task.create({
        ...mockTask,
        title: 'Other User Task',
        assignedTo: otherUserId
      });

      const res = await request(app).get(`/api/tasks/user/${otherUserId}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Other User Task');
    });
  });

  describe('GET /api/tasks/case/:caseId', () => {
    it('should get tasks for a specific case', async () => {
      const otherCaseId = new mongoose.Types.ObjectId().toString();
      
      // Create tasks for different cases
      await Task.create(mockTask); // For mockCaseId
      await Task.create({
        ...mockTask,
        title: 'Other Case Task',
        case: otherCaseId
      });

      const res = await request(app).get(`/api/tasks/case/${otherCaseId}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Other Case Task');
    });
  });
});