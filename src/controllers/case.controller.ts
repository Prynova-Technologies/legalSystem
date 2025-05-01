import { Request, Response, NextFunction } from 'express';
import Case from '../models/case.model';
import Task from '../models/task.model';
import TimeEntry from '../models/timeEntry.model';
import Document from '../models/document.model';
import { CaseStatus, ICaseParty, ICaseActivity } from '../interfaces/case.interface';
import { CaseService } from '../services/case.service';

// Get all cases with filtering options
export const getAllCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.client) filter.client = req.query.client;
    if (req.query.attorney) filter.attorneys = req.query.attorney;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.caseType = req.query.type;
    
    // Date range filters
    if (req.query.openedAfter) filter.openDate = { $gte: new Date(req.query.openedAfter as string) };
    if (req.query.openedBefore) {
      filter.openDate = filter.openDate || {};
      filter.openDate.$lte = new Date(req.query.openedBefore as string);
    }
    
    // Tag filtering
    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',');
      filter.tags = { $in: tags };
    }
    
    const cases = await Case.find(filter)
      .populate('client', 'firstName lastName company')
      .populate('attorneys', 'firstName lastName')
      .populate('paralegal', 'firstName lastName')
      .sort({ openDate: -1 });
    
    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    next(error);
  }
};

// Get a single case by ID
export const getCaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseItem = await Case.findOne({ _id: req.params.id, isDeleted: false })
      .populate('client', 'firstName lastName company')
      .populate('attorneys', 'firstName lastName email')
      .populate('paralegal', 'firstName lastName email')
      .populate('parties');
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// Create a new case
export const createCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate case number
    const caseNumber = await Case.generateCaseNumber();
    req.body.caseNumber = caseNumber;
    
    // Set initial values
    req.body.status = CaseStatus.OPEN;
    req.body.openDate = new Date();
    
    const caseItem = await Case.create(req.body);
    
    res.status(201).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// Update a case
export const updateCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if case exists and is not deleted
    const caseItem = await Case.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Don't allow updating caseNumber
    if (req.body.caseNumber) {
      delete req.body.caseNumber;
    }
    
    // If status is changing to closed, set closeDate
    if (req.body.status === CaseStatus.CLOSED && caseItem.status !== CaseStatus.CLOSED) {
      req.body.closeDate = new Date();
    }
    
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('client', 'firstName lastName company')
      .populate('attorneys', 'firstName lastName')
      .populate('paralegal', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      data: updatedCase
    });
  } catch (error) {
    next(error);
  }
};

// Delete a case (soft delete)
export const deleteCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Soft delete by setting isDeleted flag
    caseItem.isDeleted = true;
    await caseItem.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Add a party to a case
export const addCaseParty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseItem = await Case.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    caseItem.parties.push(req.body);
    await caseItem.save();
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// Remove a party from a case
export const removeCaseParty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseItem = await Case.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    caseItem.parties = caseItem.parties.filter(
      (party: ICaseParty & { _id: { toString(): string } }) => party._id.toString() !== req.params.partyId
    );
    
    await caseItem.save();
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// Add activity to a case
export const addCaseActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add user ID from authenticated user
    req.body.performedBy = (req.user as any)?.id || '';
    
    const caseItem = await CaseService.addCaseActivity(req.params.id, req.body);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: caseItem
    });
  } catch (error) {
    next(error);
  }
};

// Get case statistics
export const getCaseStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = await CaseService.getCaseStatistics();
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};

// Get case timeline (activities, tasks, time entries)
export const getCaseTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeline = await CaseService.getCaseTimeline(req.params.id);
    
    if (!timeline || timeline.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or no timeline data available'
      });
    }
    
    res.status(200).json({
      success: true,
      count: timeline.length,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};