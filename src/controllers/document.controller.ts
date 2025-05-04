import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from '../interfaces/user.interface';
import Document from '../models/document.model';
import { DocumentType } from '../interfaces/document.interface';

// Get all documents with filtering options
export const getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.case) filter.case = req.query.case;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.documentType) filter.documentType = req.query.documentType;
    if (req.query.uploadedBy) filter.uploadedBy = req.query.uploadedBy;
    
    // Date range filters
    if (req.query.uploadedAfter) filter.createdAt = { $gte: new Date(req.query.uploadedAfter as string) };
    if (req.query.uploadedBefore) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$lte = new Date(req.query.uploadedBefore as string);
    }
    
    // Tag filtering
    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',');
      filter.tags = { $in: tags };
    }
    
    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
    
    const documents = await Document.find(filter)
      .populate('uploadedBy', 'firstName lastName')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// Get a single document by ID
export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false })
      .populate('uploadedBy', 'firstName lastName')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company')
      .populate('versions.uploadedBy', 'firstName lastName');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Create a new document
export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add user ID from authenticated user
    const user = req.user as IUserDocument | undefined;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Set initial version
    req.body.versions = [{
      version: 1,
      fileName: req.body.fileName,
      filePath: req.body.filePath,
      uploadedBy: req.body.uploadedBy,
      uploadedAt: new Date(),
      notes: req.body.notes || 'Initial version'
    }];
    
    const document = await Document.create(req.body);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Update a document
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Don't allow updating certain fields
    if (req.body.versions) {
      delete req.body.versions;
    }
    
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('uploadedBy', 'firstName lastName')
      .populate('case', 'caseNumber title')
      .populate('client', 'firstName lastName company');
    
    res.status(200).json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    next(error);
  }
};

// Delete a document (soft delete)
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Soft delete by setting isDeleted flag
    document.isDeleted = true;
    await document.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add a new version to a document
export const addDocumentVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user is authenticated
    const user = req.user as IUserDocument | undefined;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Calculate next version number
    const nextVersion = document.versions.length + 1;
    
    // Add user ID from authenticated user
    const versionData = {
      version: nextVersion,
      fileName: req.body.fileName,
      filePath: req.body.filePath,
      uploadedBy: user.id,
      uploadedAt: new Date(),
      notes: req.body.notes || `Version ${nextVersion}`
    };
    
    document.versions.push(versionData);
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Share a document
export const shareDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user is authenticated
    const user = req.user as IUserDocument | undefined;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Add user ID from authenticated user
    const shareData = {
      sharedWith: req.body.sharedWith,
      sharedBy: user.id,
      sharedAt: new Date(),
      accessLevel: req.body.accessLevel || 'view',
      expiresAt: req.body.expiresAt,
      notes: req.body.notes,
      isRevoked: false // Required by IDocumentShare interface
    };
    
    // Use sharedWith array instead of shares
    if (!document.sharedWith) {
      document.sharedWith = [];
    }
    document.sharedWith.push(shareData);
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Remove a share from a document
export const removeDocumentShare = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Filter out the share to remove
    if (document.sharedWith && Array.isArray(document.sharedWith)) {
      document.sharedWith = document.sharedWith.filter(
        (share) => share._id && share._id.toString() !== req.params.shareId
      );
    }
    
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// Get document statistics
export const getDocumentStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get documents by type
    const documentsByType = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);
    
    // Get recently uploaded documents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDocuments = await Document.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isDeleted: false
    });
    
    // Get top uploaders
    const topUploaders = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate user details for top uploaders
    const populatedUploaders = await Document.populate(topUploaders, {
      path: '_id',
      select: 'firstName lastName'
    });
    
    const statistics = {
      documentsByType: documentsByType.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentDocuments,
      topUploaders: populatedUploaders.map((uploader: any) => ({
        user: uploader._id ? `${uploader._id.firstName} ${uploader._id.lastName}` : 'Unknown',
        count: uploader.count
      }))
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};