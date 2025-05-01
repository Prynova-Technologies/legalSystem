import request from 'supertest';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { setupTestDB } from './utils/setupTestDB';
import app from '../index';
import Document from '../models/document.model';
import { DocumentType } from '../interfaces/document.interface';

// Setup the in-memory database
setupTestDB();

// Mock the authentication middleware
const mockUserId = new mongoose.Types.ObjectId().toString();
const mockCaseId = new mongoose.Types.ObjectId().toString();
const mockClientId = new mongoose.Types.ObjectId().toString();

jest.mock('../middlewares/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: mockUserId, role: 'ADMIN' };
    next();
  }),
  authorize: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

describe('Document API Endpoints', () => {
  // Mock data for testing
  const mockDocument = {
    title: 'Test Document',
    description: 'This is a test document',
    documentType: DocumentType.CONTRACT,
    case: mockCaseId,
    client: mockClientId,
    tags: ['test', 'contract'],
    fileName: 'test-document.pdf',
    filePath: '/uploads/test-document.pdf',
    createdBy: mockUserId,
    notes: 'Initial version notes'
  };
  
  beforeEach(async () => {
    // Clear documents collection before each test
    await Document.deleteMany({});
  });

  describe('GET /api/documents', () => {
    it('should return all non-deleted documents', async () => {
      // Create test documents
      await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      await Document.create({
        ...mockDocument,
        title: 'Deleted Document',
        isDeleted: true, // This one shouldn't be returned
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });

      const res = await request(app).get('/api/documents');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test Document');
    });

    it('should filter documents by documentType', async () => {
      // Create documents with different types
      await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      await Document.create({
        ...mockDocument,
        title: 'Evidence Document',
        documentType: DocumentType.EVIDENCE,
        versions: [{
          version: 1,
          fileName: 'evidence.pdf',
          filePath: '/uploads/evidence.pdf',
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: 'Evidence notes'
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });

      const res = await request(app).get(`/api/documents?documentType=${DocumentType.EVIDENCE}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Evidence Document');
    });
  });

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send(mockDocument);
      
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(mockDocument.title);
      expect(res.body.data.documentType).toBe(mockDocument.documentType);
      expect(res.body.data.versions.length).toBe(1);
      expect(res.body.data.currentVersion).toBe(1);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidDocument = { description: 'Missing required fields' };
      
      const res = await request(app)
        .post('/api/documents')
        .send(invalidDocument);
      
      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should get document by ID', async () => {
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const res = await request(app).get(`/api/documents/${document._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(document._id.toString());
      expect(res.body.data.title).toBe(mockDocument.title);
    });

    it('should return 404 for non-existent document', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(app).get(`/api/documents/${nonExistentId}`);
      
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('should update document', async () => {
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const updateData = {
        title: 'Updated Document Title',
        description: 'Updated description'
      };
      
      const res = await request(app)
        .put(`/api/documents/${document._id}`)
        .send(updateData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.description).toBe(updateData.description);
      // Original fields should be preserved
      expect(res.body.data.documentType).toBe(mockDocument.documentType);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should soft delete a document', async () => {
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const res = await request(app).delete(`/api/documents/${document._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      
      // Verify document is soft deleted
      const deletedDocument = await Document.findById(document._id);
      expect(deletedDocument).toBeTruthy();
      expect(deletedDocument?.isDeleted).toBe(true);
    });
  });

  describe('POST /api/documents/:id/versions', () => {
    it('should add a new version to a document', async () => {
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const versionData = {
        fileName: 'updated-document.pdf',
        filePath: '/uploads/updated-document.pdf',
        notes: 'Version 2 notes'
      };
      
      const res = await request(app)
        .post(`/api/documents/${document._id}/versions`)
        .send(versionData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versions.length).toBe(2);
      expect(res.body.data.currentVersion).toBe(2);
      expect(res.body.data.versions[1].fileName).toBe(versionData.fileName);
      expect(res.body.data.versions[1].notes).toBe(versionData.notes);
    });
  });

  describe('POST /api/documents/:id/share', () => {
    it('should share a document with someone', async () => {
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const shareData = {
        sharedWith: 'recipient@example.com',
        accessLevel: 'view',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      
      const res = await request(app)
        .post(`/api/documents/${document._id}/share`)
        .send(shareData);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sharedWith.length).toBe(1);
      expect(res.body.data.sharedWith[0].sharedWith).toBe(shareData.sharedWith);
      expect(res.body.data.sharedWith[0].accessLevel).toBe(shareData.accessLevel);
      expect(res.body.data.sharedWith[0].accessToken).toBeTruthy();
    });
  });

  describe('DELETE /api/documents/:id/share/:shareId', () => {
    it('should revoke document access', async () => {
      // Create a document with a share
      const document = await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      // Add a share to the document
      const share = document.shareDocument(
        'recipient@example.com',
        mockUserId,
        'view'
      );
      await document.save();
      
      const res = await request(app).delete(`/api/documents/${document._id}/share/${share._id}`);
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      
      // Verify share is revoked
      const updatedDocument = await Document.findById(document._id);
      const updatedShare = updatedDocument?.sharedWith.find(s => s._id.toString() === share._id.toString());
      expect(updatedShare).toBeTruthy();
      expect(updatedShare?.isRevoked).toBe(true);
    });
  });

  describe('GET /api/documents/statistics', () => {
    it('should get document statistics', async () => {
      // Create some documents for statistics
      await Document.create({
        ...mockDocument,
        versions: [{
          version: 1,
          fileName: mockDocument.fileName,
          filePath: mockDocument.filePath,
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: mockDocument.notes
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      await Document.create({
        ...mockDocument,
        title: 'Another Document',
        documentType: DocumentType.PLEADING,
        versions: [{
          version: 1,
          fileName: 'pleading.pdf',
          filePath: '/uploads/pleading.pdf',
          uploadedBy: mockUserId,
          uploadedAt: new Date(),
          notes: 'Pleading notes'
        }],
        currentVersion: 1,
        createdBy: mockUserId
      });
      
      const res = await request(app).get('/api/documents/statistics');
      
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalDocuments');
      expect(res.body.data.totalDocuments).toBe(2);
      expect(res.body.data).toHaveProperty('documentsByType');
      expect(res.body.data.documentsByType).toHaveProperty(DocumentType.CONTRACT);
      expect(res.body.data.documentsByType).toHaveProperty(DocumentType.PLEADING);
    });
  });
});