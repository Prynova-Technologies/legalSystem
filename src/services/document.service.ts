import Document from '../models/document.model';
import { DocumentType } from '../interfaces/document.interface';
import logger from '../utils/logger';

/**
 * Service for document-related operations
 */
export class DocumentService {
  /**
   * Get all documents with filtering options
   */
  static async getAllDocuments(filters: any = {}): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters if they exist in the filters object
      if (filter.uploadedAfter) {
        filter.createdAt = { $gte: new Date(filter.uploadedAfter) };
        delete filter.uploadedAfter;
      }
      
      if (filter.uploadedBefore) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$lte = new Date(filter.uploadedBefore);
        delete filter.uploadedBefore;
      }
      
      // Handle tag filtering
      if (filter.tags && typeof filter.tags === 'string') {
        const tags = filter.tags.split(',');
        filter.tags = { $in: tags };
      }
      
      // Handle search by title or description
      if (filter.search) {
        const searchRegex = new RegExp(filter.search, 'i');
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
        delete filter.search;
      }
      
      return await Document.find(filter)
        .populate('uploadedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .populate('client', 'firstName lastName company')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching documents', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  static async getDocumentById(documentId: string): Promise<any | null> {
    try {
      return await Document.findOne({ _id: documentId, isDeleted: false })
        .populate('uploadedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .populate('client', 'firstName lastName company')
        .populate('versions.uploadedBy', 'firstName lastName');
    } catch (error) {
      logger.error('Error fetching document by ID', { error, documentId });
      throw error;
    }
  }

  /**
   * Create a new document
   */
  static async createDocument(documentData: any, userId: string): Promise<any> {
    try {
      // Add user ID from authenticated user
      documentData.uploadedBy = userId;
      
      // Set initial version
      documentData.versions = [{
        version: 1,
        fileName: documentData.fileName,
        filePath: documentData.filePath,
        uploadedBy: userId,
        uploadedAt: new Date(),
        notes: documentData.notes || 'Initial version'
      }];
      
      const document = await Document.create(documentData);
      logger.info('New document created', { documentId: document._id });
      return document;
    } catch (error) {
      logger.error('Error creating document', { error, documentData });
      throw error;
    }
  }

  /**
   * Update a document
   */
  static async updateDocument(documentId: string, updateData: any): Promise<any | null> {
    try {
      const document = await Document.findOne({ _id: documentId, isDeleted: false });
      if (!document) return null;
      
      const updatedDocument = await Document.findByIdAndUpdate(
        documentId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('uploadedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .populate('client', 'firstName lastName company');
      
      logger.info('Document updated', { documentId });
      return updatedDocument;
    } catch (error) {
      logger.error('Error updating document', { error, documentId, updateData });
      throw error;
    }
  }

  /**
   * Delete a document (soft delete)
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const document = await Document.findById(documentId);
      if (!document) return false;
      
      // Soft delete by setting isDeleted flag
      document.isDeleted = true;
      await document.save();
      
      logger.info('Document deleted (soft)', { documentId });
      return true;
    } catch (error) {
      logger.error('Error deleting document', { error, documentId });
      throw error;
    }
  }

  /**
   * Add a new version to a document
   */
  static async addDocumentVersion(documentId: string, versionData: any, userId: string): Promise<any | null> {
    try {
      const document = await Document.findOne({ _id: documentId, isDeleted: false });
      if (!document) return null;
      
      // Get the latest version number and increment it
      const latestVersion = document.versions.reduce(
        (max, version) => (version.version > max ? version.version : max),
        0
      );
      
      const newVersion = {
        version: latestVersion + 1,
        fileName: versionData.fileName,
        filePath: versionData.filePath,
        uploadedBy: userId,
        uploadedAt: new Date(),
        notes: versionData.notes || `Version ${latestVersion + 1}`
      };
      
      document.versions.push(newVersion);
      await document.save();
      
      logger.info('Document version added', { documentId, version: newVersion.version });
      return document;
    } catch (error) {
      logger.error('Error adding document version', { error, documentId, versionData });
      throw error;
    }
  }

  /**
   * Get documents by case ID
   */
  static async getDocumentsByCase(caseId: string): Promise<any[]> {
    try {
      return await Document.find({
        case: caseId,
        isDeleted: false
      })
        .populate('uploadedBy', 'firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching documents by case', { error, caseId });
      throw error;
    }
  }

  /**
   * Get documents by client ID
   */
  static async getDocumentsByClient(clientId: string): Promise<any[]> {
    try {
      return await Document.find({
        client: clientId,
        isDeleted: false
      })
        .populate('uploadedBy', 'firstName lastName')
        .populate('case', 'caseNumber title')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching documents by client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  static async getDocumentStatistics(): Promise<any> {
    try {
      // Get total documents
      const totalDocuments = await Document.countDocuments({ isDeleted: false });
      
      // Get documents by type
      const documentsByType = await Document.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } }
      ]);
      
      // Get recently added documents (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentDocuments = await Document.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        isDeleted: false
      });
      
      const statistics = {
        totalDocuments,
        documentsByType: documentsByType.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        recentDocuments
      };
      
      logger.info('Document statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating document statistics', { error });
      throw error;
    }
  }
}