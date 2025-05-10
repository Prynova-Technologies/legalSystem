import Document from '../models/document.model';
import Activity from '../models/activity.model';
import logger from '../utils/logger';

/**
 * Service for document-related operations
 */
export class DocumentService {
  /**
   * Helper method to create an activity record for document actions
   * @private
   */
  private static async createDocumentActivity(document: any, action: string, description: string, userId: string): Promise<void> {
    try {
      // Only create activity if document has a case reference
      if (document && document.case) {
        await Activity.create({
          case: document.case,
          action,
          description,
          performedBy: userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error creating document activity', { error, documentId: document?._id, action });
      // Don't throw the error to prevent disrupting the main operation
    }
  }
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
        .populate('createdBy', 'firstName lastName')
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
        fileType: documentData.fileType,
        fileSize: documentData.fileSize,
        uploadedBy: userId,
        uploadedAt: new Date(),
        notes: documentData.notes || 'Initial version'
      }];
      
      const document = await Document.create(documentData);
      
      // Create activity record for document creation
      await this.createDocumentActivity(
        document,
        'DOCUMENT_CREATED',
        `Document "${document.title}" was created`,
        userId
      );
      
      logger.info('New document created', { documentId: document._id });
      return document;
    } catch (error) {
      logger.error('Error creating document', { error, documentData });
      throw error;
    }
  }

  /**
   * Update a document
   * @param documentId - ID of the document to update
   * @param updateData - Data to update the document with
   * @param userId - ID of the user performing the update
   */
  static async updateDocument(documentId: string, updateData: any, userId: string): Promise<any | null> {
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
      
      // Create activity record for document update
      await this.createDocumentActivity(
        updatedDocument,
        'DOCUMENT_UPDATED',
        `Document "${updatedDocument && updatedDocument.title}" was updated`,
        userId
      );
      
      logger.info('Document updated', { documentId });
      return updatedDocument;
    } catch (error) {
      logger.error('Error updating document', { error, documentId, updateData });
      throw error;
    }
  }

  /**
   * Delete a document (soft delete)
   * @param documentId - ID of the document to delete
   * @param userId - ID of the user performing the deletion
   */
  static async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = await Document.findById(documentId);
      if (!document) return false;
      
      // Soft delete by setting isDeleted flag
      document.isDeleted = true;
      await document.save();
      
      // Create activity record for document deletion
      await this.createDocumentActivity(
        document,
        'DOCUMENT_DELETED',
        `Document "${document.title}" was deleted`,
        userId
      );
      
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
      
      // Create activity record for adding new document version
      await this.createDocumentActivity(
        document,
        'DOCUMENT_VERSION_ADDED',
        `New version (v${newVersion.version}) added to document "${document.title}"`,
        userId
      );
      
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