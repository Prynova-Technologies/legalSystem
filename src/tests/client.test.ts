import request from 'supertest';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { setupTestDB } from './utils/setupTestDB';
import app from '../index';
import Client from '../models/client.model';

// Setup the in-memory database
setupTestDB();

// Mock the authentication middleware
const mockUserId = new mongoose.Types.ObjectId().toString();

jest.mock('../middlewares/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: mockUserId, role: 'ADMIN' };
    next();
  }),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

// Mock data
const mockUserId = new mongoose.Types.ObjectId().toString();
const mockClientData = {
  name: 'Test Client',
  email: 'client@example.com',
  phone: '123-456-7890',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  contactPerson: {
    name: 'Contact Person',
    email: 'contact@example.com',
    phone: '098-765-4321'
  },
  notes: 'Test client notes',
  createdBy: mockUserId
};

describe('Client API Endpoints', () => {
  beforeEach(async () => {
    // Clear clients collection before each test
    await Client.deleteMany({});
  });

  describe('GET /api/clients', () => {
    it('should return all non-deleted clients', async () => {
      // Create test clients
      await Client.create(mockClientData);
      await Client.create({
        ...mockClientData,
        name: 'Deleted Client',
        email: 'deleted@example.com',
        isDeleted: true // This one shouldn't be returned
      });

      const res = await request(app).get('/api/clients');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Test Client');
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .send(mockClientData);
      
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(mockClientData.name);
      expect(res.body.data.email).toBe(mockClientData.email);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidClient = { phone: '123-456-7890' }; // Missing required fields
      
      const res = await request(app)
        .post('/api/clients')
        .send(invalidClient);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get client by ID', async () => {
      const client = await Client.create(mockClientData);
      
      const res = await request(app).get(`/api/clients/${client._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(client._id.toString());
    });

    it('should return 404 for non-existent client', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app).get(`/api/clients/${nonExistentId}`);
      
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client', async () => {
      const client = await Client.create(mockClientData);
      
      const updateData = {
        name: 'Updated Client Name',
        email: 'updated@example.com'
      };
      
      const res = await request(app)
        .put(`/api/clients/${client._id}`)
        .send(updateData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.email).toBe(updateData.email);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should soft delete a client', async () => {
      const client = await Client.create(mockClientData);
      
      const res = await request(app).delete(`/api/clients/${client._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      
      // Verify client is soft deleted
      const deletedClient = await Client.findById(client._id);
      expect(deletedClient).toBeTruthy();
      expect(deletedClient?.isDeleted).toBe(true);
    });
  });

  describe('POST /api/clients/:id/contacts', () => {
    it('should add a contact to a client', async () => {
      const client = await Client.create(mockClientData);
      
      const contactData = {
        name: 'New Contact',
        email: 'newcontact@example.com',
        phone: '555-123-4567'
      };
      
      const res = await request(app)
        .post(`/api/clients/${client._id}/contacts`)
        .send(contactData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contacts).toContainEqual(expect.objectContaining(contactData));
    });
  });

  describe('GET /api/clients/:id/cases', () => {
    it('should get cases for a specific client', async () => {
      const client = await Client.create(mockClientData);
      
      // In a real test, we would create cases for this client
      // and then verify they are returned correctly
      
      const res = await request(app).get(`/api/clients/${client._id}/cases`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/clients/statistics', () => {
    it('should get client statistics', async () => {
      // Create some clients for statistics
      await Client.create(mockClientData);
      await Client.create({
        ...mockClientData,
        name: 'Another Client',
        email: 'another@example.com'
      });
      
      const res = await request(app).get('/api/clients/statistics');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalClients');
      expect(res.body.data.totalClients).toBe(2);
    });
  });
});