import request from 'supertest';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { setupTestDB } from './utils/setupTestDB';
import app from '../index';
import Settings from '../models/settings.model';

// Setup the in-memory database
setupTestDB();

// Mock the email service
jest.mock('../utils/emailService', () => ({
  verifyConnection: jest.fn().mockResolvedValue(true),
  sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock the authentication middleware
jest.mock('../middlewares/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: new mongoose.Types.ObjectId().toString(), role: 'ADMIN' };
    next();
  })
}));

describe('Settings API Tests', () => {
  // Mock data
  const mockSettings = {
    companyName: 'Test Law Firm',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street',
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'password123'
      }
    }
  };
  
  beforeEach(async () => {
    // Clear settings collection before each test
    await Settings.deleteMany({});
  });

  describe('GET /api/settings', () => {
    it('should return the system settings', async () => {
      await Settings.create(mockSettings);
      
      const res = await request(app).get('/api/settings');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companyName).toBe(mockSettings.companyName);
      expect(res.body.data.email).toBe(mockSettings.email);
    });

    it('should return default settings if none exist', async () => {
      const res = await request(app).get('/api/settings');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeTruthy();
    });
  });

  describe('PUT /api/settings', () => {
    it('should update system settings', async () => {
      await Settings.create(mockSettings);
      
      const updateData = {
        companyName: 'Updated Law Firm',
        email: 'updated@example.com'
      };
      
      const res = await request(app)
        .put('/api/settings')
        .send(updateData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companyName).toBe(updateData.companyName);
      expect(res.body.data.email).toBe(updateData.email);
      // Original fields should be preserved
      expect(res.body.data.phone).toBe(mockSettings.phone);
    });
    
    it('should validate required fields', async () => {
      const invalidSettings = {
        // Missing required fields
        phone: '+1234567890'
      };
      
      const res = await request(app)
        .put('/api/settings')
        .send(invalidSettings);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/settings/test-email', () => {
    it('should successfully send a test email', async () => {
      // Setup: Create settings in the database
      await Settings.create(mockSettings);
      
      const testData = {
        testEmail: 'recipient@example.com'
      };
      
      const res = await request(app)
        .post('/api/settings/test-email')
        .send(testData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Test email sent successfully');
    });
    
    it('should return error if test email address is missing', async () => {
      await Settings.create(mockSettings);
      
      const res = await request(app)
        .post('/api/settings/test-email')
        .send({});
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
    
    it('should return error if email server connection fails', async () => {
      // Setup: Create settings in the database
      await Settings.create(mockSettings);
      
      // Mock the email service to fail connection verification
      const emailService = require('../utils/emailService');
      emailService.verifyConnection.mockRejectedValueOnce(
        new Error('Invalid SMTP configuration')
      );
      
      const testData = {
        testEmail: 'recipient@example.com'
      };
      
      const res = await request(app)
        .post('/api/settings/test-email')
        .send(testData);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });
});