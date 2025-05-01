import { Request, Response, NextFunction } from 'express';
import TimeEntry from '../models/timeEntry.model';

// Get all time entries with filtering options
export const getAllTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: any = { isDeleted: false };
    
    // Apply filters if provided
    if (req.query.user) filter.user = req.query.user;
    if (req.query.case) filter.case = req.query.case;
    if (req.query.task) filter.task = req.query.task;
    if (req.query.billable) filter.billable = req.query.billable === 'true';
    if (req.query.invoiced) filter.invoiced = req.query.invoiced === 'true';
    
    // Date range filters
    if (req.query.startAfter) filter.startTime = { $gte: new Date(req.query.startAfter as string) };
    if (req.query.startBefore) {
      filter.startTime = filter.startTime || {};
      filter.startTime.$lte = new Date(req.query.startBefore as string);
    }
    
    // Tag filtering
    if (req.query.tags) {
      const tags = (req.query.tags as string).split(',');
      filter.tags = { $in: tags };
    }
    
    const timeEntries = await TimeEntry.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('case', 'caseNumber title')
      .populate('task', 'title')
      .sort({ startTime: -1 });
    
    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get a single time entry by ID
export const getTimeEntryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeEntry = await TimeEntry.findOne({ _id: req.params.id, isDeleted: false })
      .populate('user', 'firstName lastName email')
      .populate('case', 'caseNumber title')
      .populate('task', 'title');
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    next(error);
  }
};

// Create a new time entry
export const createTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add the current user if not specified
    if (!req.body.user && req.user) {
      req.body.user = req.user.id;
    }
    
    // Calculate duration if start and end times are provided
    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      const durationMs = end.getTime() - start.getTime();
      req.body.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }
    
    const timeEntry = await TimeEntry.create(req.body);
    
    // Calculate billable amount if applicable
    if (timeEntry.billable && timeEntry.billingRate) {
      timeEntry.calculateBillableAmount();
      await timeEntry.save();
    }
    
    res.status(201).json({
      success: true,
      data: timeEntry
    });
  } catch (error) {
    next(error);
  }
};

// Update a time entry
export const updateTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if time entry exists and is not deleted
    const timeEntry = await TimeEntry.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }
    
    // Recalculate duration if start and end times are provided
    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      const durationMs = end.getTime() - start.getTime();
      req.body.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }
    
    const updatedTimeEntry = await TimeEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('user', 'firstName lastName email')
      .populate('case', 'caseNumber title')
      .populate('task', 'title');
    
    // Recalculate billable amount if applicable
    if (updatedTimeEntry && updatedTimeEntry.billable && updatedTimeEntry.billingRate) {
      updatedTimeEntry.calculateBillableAmount();
      await updatedTimeEntry.save();
    }
    
    res.status(200).json({
      success: true,
      data: updatedTimeEntry
    });
  } catch (error) {
    next(error);
  }
};

// Delete a time entry (soft delete)
export const deleteTimeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeEntry = await TimeEntry.findById(req.params.id);
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }
    
    // Soft delete by setting isDeleted flag
    timeEntry.isDeleted = true;
    await timeEntry.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Get time entries for a specific user
export const getUserTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.params.userId && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    const userId = req.params.userId || (req.user ? req.user.id : undefined);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const timeEntries = await TimeEntry.find({
      user: userId,
      isDeleted: false
    })
      .populate('case', 'caseNumber title')
      .populate('task', 'title')
      .sort({ startTime: -1 });
    
    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get time entries for a specific case
export const getCaseTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeEntries = await TimeEntry.find({
      case: req.params.caseId,
      isDeleted: false
    })
      .populate('user', 'firstName lastName email')
      .populate('task', 'title')
      .sort({ startTime: -1 });
    
    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get time entries for a specific task
export const getTaskTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeEntries = await TimeEntry.find({
      task: req.params.taskId,
      isDeleted: false
    })
      .populate('user', 'firstName lastName email')
      .populate('case', 'caseNumber title')
      .sort({ startTime: -1 });
    
    res.status(200).json({
      success: true,
      count: timeEntries.length,
      data: timeEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get unbilled time entries
export const getUnbilledTimeEntries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unbilledEntries = await TimeEntry.getUnbilledEntries();
    
    res.status(200).json({
      success: true,
      count: unbilledEntries.length,
      data: unbilledEntries
    });
  } catch (error) {
    next(error);
  }
};

// Get time tracking statistics
export const getTimeTrackingStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total hours by user for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get all users with time entries
    const userStats = await TimeEntry.aggregate([
      { 
        $match: { 
          startTime: { $gte: startOfMonth, $lte: endOfMonth },
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: '$user', 
          totalMinutes: { $sum: '$duration' },
          billableMinutes: {
            $sum: { $cond: [{ $eq: ['$billable', true] }, '$duration', 0] }
          },
          entryCount: { $sum: 1 }
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $project: {
          user: { $arrayElemAt: ['$userDetails', 0] },
          totalHours: { $divide: ['$totalMinutes', 60] },
          billableHours: { $divide: ['$billableMinutes', 60] },
          entryCount: 1
        }
      },
      {
        $project: {
          'user.password': 0,
          'user.resetPasswordToken': 0,
          'user.resetPasswordExpire': 0
        }
      }
    ]);
    
    // Get case statistics
    const caseStats = await TimeEntry.aggregate([
      { $match: { case: { $exists: true }, isDeleted: false } },
      { 
        $group: { 
          _id: '$case', 
          totalMinutes: { $sum: '$duration' },
          billableMinutes: {
            $sum: { $cond: [{ $eq: ['$billable', true] }, '$duration', 0] }
          },
          entryCount: { $sum: 1 }
        } 
      },
      {
        $lookup: {
          from: 'cases',
          localField: '_id',
          foreignField: '_id',
          as: 'caseDetails'
        }
      },
      {
        $project: {
          case: { $arrayElemAt: ['$caseDetails', 0] },
          totalHours: { $divide: ['$totalMinutes', 60] },
          billableHours: { $divide: ['$billableMinutes', 60] },
          entryCount: 1
        }
      }
    ]);
    
    // Overall statistics
    const overallStats = await TimeEntry.aggregate([
      { $match: { isDeleted: false } },
      { 
        $group: { 
          _id: null, 
          totalMinutes: { $sum: '$duration' },
          billableMinutes: {
            $sum: { $cond: [{ $eq: ['$billable', true] }, '$duration', 0] }
          },
          billableAmount: { $sum: { $ifNull: ['$billableAmount', 0] } },
          entryCount: { $sum: 1 }
        } 
      },
      {
        $project: {
          _id: 0,
          totalHours: { $divide: ['$totalMinutes', 60] },
          billableHours: { $divide: ['$billableMinutes', 60] },
          billableAmount: 1,
          entryCount: 1,
          utilizationRate: { 
            $multiply: [
              { $divide: ['$billableMinutes', { $max: ['$totalMinutes', 1] }] },
              100
            ] 
          }
        }
      }
    ]);
    
    const statistics = {
      userStats,
      caseStats,
      overall: overallStats.length > 0 ? overallStats[0] : {
        totalHours: 0,
        billableHours: 0,
        billableAmount: 0,
        entryCount: 0,
        utilizationRate: 0
      }
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
};