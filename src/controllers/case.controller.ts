import { Request, Response, NextFunction } from 'express';
import Note from '../models/note.model';
import Activity from '../models/activity.model';
import { CaseService } from '../services/case.service';
import { TaskService } from '../services/task.service';

// Get all cases with filtering options
export const getAllCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: any = {};
    
    // Apply filters if provided
    if (req.query.client) filters.client = req.query.client;
    if (req.query.attorney) filters.attorneys = req.query.attorney;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.caseType = req.query.type;
    
    // Date range filters
    if (req.query.openedAfter) filters.openedAfter = req.query.openedAfter as string;
    if (req.query.openedBefore) filters.openedBefore = req.query.openedBefore as string;
    
    // Tag filtering
    if (req.query.tags) filters.tags = req.query.tags as string;
    
    // Use the CaseService to get filtered cases
    const cases = await CaseService.getAllCases(filters);
    
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
    const caseItem = await CaseService.getCaseById(req.params.id);
    
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
    // Extract note data if provided
    const noteData = req.body.notes;
    delete req.body.notes;
    
    // Create the case using the service
    const caseItem = await CaseService.createCase(req.body);
    
    // Create activity log for case creation
    await Activity.create({
      case: caseItem._id,
      action: 'create',
      description: `Case ${caseItem.caseNumber} was created`,
      performedBy: (req.user as any)?._id || '',
      timestamp: new Date()
    });
    
    // Create note if provided
    if (noteData && noteData !== '') {
      await Note.create({
        case: caseItem._id,
        client: caseItem.client,
        createdBy: (req.user as any)?._id || '',
        content: noteData
      });
    }
    
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
    // Extract note data if provided
    const noteData = req.body.note;
    delete req.body.note;
    
    const updatedCase = await CaseService.updateCase(req.params.id, req.body);
    
    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Create activity log for case update
    await Activity.create({
      case: updatedCase._id,
      action: 'update',
      description: `Case ${updatedCase.caseNumber} was updated`,
      performedBy: (req.user as any)?.id || '',
      timestamp: new Date()
    });
    
    // Create note if provided
    if (noteData && noteData.content) {
      await Note.create({
        case: updatedCase._id,
        client: updatedCase.client,
        createdBy: (req.user as any)?.id || '',
        content: noteData.content
      });
    }
    
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
    const success = await CaseService.deleteCase(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Create activity log for case deletion
    await Activity.create({
      case: req.params.id,
      action: 'delete',
      description: 'Case was deleted',
      performedBy: (req.user as any)?.id || '',
      timestamp: new Date()
    });
    
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
    const caseItem = await CaseService.addCaseParty(req.params.id, req.body);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Create activity log for adding party
    await Activity.create({
      case: req.params.id,
      action: 'add_party',
      description: `Added ${req.body.name} as ${req.body.role} to the case`,
      performedBy: (req.user as any)?.id || '',
      timestamp: new Date()
    });
    
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
    const caseItem = await CaseService.removeCaseParty(req.params.id, req.params.partyId);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Create activity log for removing party
    await Activity.create({
      case: req.params.id,
      action: 'remove_party',
      description: `Removed a party from the case`,
      performedBy: (req.user as any)?.id || '',
      timestamp: new Date()
    });
    
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

// Add a note to a case
export const addCaseNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if case exists
    const caseItem = await CaseService.getCaseById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Create the note
    const note = await Note.create({
      case: req.params.id,
      client: caseItem.client,
      createdBy: (req.user as any)?._id || '',
      content: req.body.note,
      title: req.body.title || 'Case Note',
      tags: req.body.tags || []
    });
    
    // Create activity log for adding note
    await Activity.create({
      case: req.params.id,
      action: 'add_note',
      description: `Added a note to the case`,
      performedBy: (req.user as any)?._id || '',
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

// Add a task to a case
export const addCaseTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if case exists
    const caseItem = await CaseService.getCaseById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    // Prepare task data
    const taskData = {
      ...req.body,
      case: req.params.id,
      assignedBy: (req.user as any)?._id || '',
    };
    
    // Create the task using TaskService
    const task = await TaskService.createTask(taskData);
    
    // Create activity log for adding task
    await Activity.create({
      case: req.params.id,
      action: 'add_task',
      description: `Added task "${task.title}" to the case`,
      performedBy: (req.user as any)?._id || '',
      timestamp: new Date()
    });
    
    // Return the created task with the caseId for frontend reference
    res.status(201).json({
      success: true,
      data: {
        ...task.toObject(),
        caseId: req.params.id
      }
    });
  } catch (error) {
    next(error);
  }
};