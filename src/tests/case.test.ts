import request from 'supertest';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { setupTestDB } from './utils/setupTestDB';
import app from '../index';
import Case from '../models/case.model';

// Setup the in-memory database
setupTestDB();

// Mock data
const mockUserId = new mongoose.Types.ObjectId().toString();
const mockClientId = new mongoose.Types.ObjectId().toString();

// Mock the authentication middleware
jest.mock('../middlewares/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: mockUserId, role: 'ADMIN' };
    next();
  }),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

const mockCaseData = {
  title: 'Test Case',
  description: 'This is a test case',
  client: mockClientId,
  caseNumber: 'CASE-2023-001',
  caseType: 'Civil',
  status: 'OPEN',
  assignedTo: mockUserId,
  filingDate: new Date(),
  courtDetails: {
    court: 'Test Court',
    judge: 'Test Judge',
    location: 'Test Location'
  },
  parties: [
    {
      name: 'Test Party',
      role: 'Plaintiff',
      contact: {
        email: 'party@example.com',
        phone: '123-456-7890'
      }
    }
  ],
  notes: 'Test case notes',
  createdBy: mockUserId
};

describe('Case API Endpoints', () => {
  beforeEach(async () => {
    // Clear cases collection before each test
    await Case.deleteMany({});
  });

  describe('GET /api/cases', () => {
    it('should return all non-deleted cases', async () => {
      // Create test cases
      await Case.create(mockCaseData);
      await Case.create({
        ...mockCaseData,
        title: 'Deleted Case',
        caseNumber: 'CASE-2023-002',
        isDeleted: true // This one shouldn't be returned
      });

      const res = await request(app).get('/api/cases');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test Case');
    });

    it('should filter cases by status', async () => {
      await Case.create(mockCaseData); // OPEN status
      await Case.create({
        ...mockCaseData,
        title: 'Closed Case',
        caseNumber: 'CASE-2023-003',
        status: 'CLOSED'
      });

      const res = await request(app).get('/api/cases?status=CLOSED');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Closed Case');
    });
  });

  describe('POST /api/cases', () => {
    it('should create a new case', async () => {
      const res = await request(app)
        .post('/api/cases')
        .send(mockCaseData);
      
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(mockCaseData.title);
      expect(res.body.data.caseNumber).toBe(mockCaseData.caseNumber);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidCase = { status: 'OPEN' }; // Missing required fields
      
      const res = await request(app)
        .post('/api/cases')
        .send(invalidCase);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/cases/:id', () => {
    it('should get case by ID', async () => {
      const caseDoc = await Case.create(mockCaseData);
      
      const res = await request(app).get(`/api/cases/${caseDoc._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(caseDoc._id.toString());
    });

    it('should return 404 for non-existent case', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app).get(`/api/cases/${nonExistentId}`);
      
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/cases/:id', () => {
    it('should update case', async () => {
      const caseDoc = await Case.create(mockCaseData);
      
      const updateData = {
        title: 'Updated Case Title',
        status: 'IN_PROGRESS'
      };
      
      const res = await request(app)
        .put(`/api/cases/${caseDoc._id}`)
        .send(updateData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/cases/:id', () => {
    it('should soft delete a case', async () => {
      const caseDoc = await Case.create(mockCaseData);
      
      const res = await request(app).delete(`/api/cases/${caseDoc._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      
      // Verify case is soft deleted
      const deletedCase = await Case.findById(caseDoc._id);
      expect(deletedCase).toBeTruthy();
      expect(deletedCase?.isDeleted).toBe(true);
    });
  });

  describe('POST /api/cases/:id/parties', () => {
    it('should add a party to a case', async () => {
      const caseDoc = await Case.create(mockCaseData);
      
      const partyData = {
        name: 'New Party',
        role: 'Defendant',
        contact: {
          email: 'newparty@example.com',
          phone: '555-123-4567'
        }
      };
      
      const res = await request(app)
        .post(`/api/cases/${caseDoc._id}/parties`)
        .send(partyData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parties).toContainEqual(expect.objectContaining(partyData));
    });
  });

  describe('GET /api/cases/:id/timeline', () => {
    it('should get timeline for a specific case', async () => {
      const caseDoc = await Case.create(mockCaseData);
      
      const res = await request(app).get(`/api/cases/${caseDoc._id}/timeline`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/cases/statistics', () => {
    it('should get case statistics', async () => {
      // Create some cases for statistics
      await Case.create(mockCaseData);
      await Case.create({
        ...mockCaseData,
        title: 'Another Case',
        caseNumber: 'CASE-2023-004',
        status: 'CLOSED'
      });
      
      const res = await request(app).get('/api/cases/statistics');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalCases');
      expect(res.body.data).toHaveProperty('casesByStatus');
      expect(res.body.data.totalCases).toBe(2);
    });
  });
});