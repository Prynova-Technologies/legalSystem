import TimeEntry from '../models/timeEntry.model';
import logger from '../utils/logger';

/**
 * Service for time entry-related operations
 */
export class TimeEntryService {
  /**
   * Get all time entries with filtering options
   */
  static async getAllTimeEntries(filters: any = {}): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters if they exist in the filters object
      if (filter.startAfter) {
        filter.startTime = { $gte: new Date(filter.startAfter) };
        delete filter.startAfter;
      }
      
      if (filter.startBefore) {
        filter.startTime = filter.startTime || {};
        filter.startTime.$lte = new Date(filter.startBefore);
        delete filter.startBefore;
      }
      
      // Handle tag filtering
      if (filter.tags && typeof filter.tags === 'string') {
        const tags = filter.tags.split(',');
        filter.tags = { $in: tags };
      }
      
      return await TimeEntry.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .populate('task', 'title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching time entries', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single time entry by ID
   */
  static async getTimeEntryById(timeEntryId: string): Promise<any | null> {
    try {
      return await TimeEntry.findOne({ _id: timeEntryId, isDeleted: false })
        .populate('user', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .populate('task', 'title');
    } catch (error) {
      logger.error('Error fetching time entry by ID', { error, timeEntryId });
      throw error;
    }
  }

  /**
   * Create a new time entry
   */
  static async createTimeEntry(timeEntryData: any, userId?: string): Promise<any> {
    try {
      // Add the current user if provided and not specified in data
      if (!timeEntryData.user && userId) {
        timeEntryData.user = userId;
      }
      
      // Calculate duration if start and end times are provided
      if (timeEntryData.startTime && timeEntryData.endTime) {
        const start = new Date(timeEntryData.startTime);
        const end = new Date(timeEntryData.endTime);
        const durationMs = end.getTime() - start.getTime();
        timeEntryData.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
      }
      
      const timeEntry = await TimeEntry.create(timeEntryData);
      
      // Calculate billable amount if applicable
      if (timeEntry.billable && timeEntry.billingRate) {
        timeEntry.calculateBillableAmount();
        await timeEntry.save();
      }
      
      logger.info('New time entry created', { timeEntryId: timeEntry._id });
      return timeEntry;
    } catch (error) {
      logger.error('Error creating time entry', { error, timeEntryData });
      throw error;
    }
  }

  /**
   * Update a time entry
   */
  static async updateTimeEntry(timeEntryId: string, updateData: any): Promise<any | null> {
    try {
      const timeEntry = await TimeEntry.findOne({ _id: timeEntryId, isDeleted: false });
      if (!timeEntry) return null;
      
      // Calculate duration if start and end times are provided
      if (updateData.startTime && updateData.endTime) {
        const start = new Date(updateData.startTime);
        const end = new Date(updateData.endTime);
        const durationMs = end.getTime() - start.getTime();
        updateData.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
      }
      
      const updatedTimeEntry = await TimeEntry.findByIdAndUpdate(
        timeEntryId,
        updateData,
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
      
      logger.info('Time entry updated', { timeEntryId });
      return updatedTimeEntry;
    } catch (error) {
      logger.error('Error updating time entry', { error, timeEntryId, updateData });
      throw error;
    }
  }

  /**
   * Delete a time entry (soft delete)
   */
  static async deleteTimeEntry(timeEntryId: string): Promise<boolean> {
    try {
      const timeEntry = await TimeEntry.findById(timeEntryId);
      if (!timeEntry) return false;
      
      // Soft delete by setting isDeleted flag
      timeEntry.isDeleted = true;
      await timeEntry.save();
      
      logger.info('Time entry deleted (soft)', { timeEntryId });
      return true;
    } catch (error) {
      logger.error('Error deleting time entry', { error, timeEntryId });
      throw error;
    }
  }

  /**
   * Get time entries by user ID
   */
  static async getTimeEntriesByUser(userId: string): Promise<any[]> {
    try {
      return await TimeEntry.find({
        user: userId,
        isDeleted: false
      })
        .populate('case', 'caseNumber title')
        .populate('task', 'title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching time entries by user', { error, userId });
      throw error;
    }
  }

  /**
   * Get time entries by case ID
   */
  static async getTimeEntriesByCase(caseId: string): Promise<any[]> {
    try {
      return await TimeEntry.find({
        case: caseId,
        isDeleted: false
      })
        .populate('user', 'firstName lastName email')
        .populate('task', 'title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching time entries by case', { error, caseId });
      throw error;
    }
  }

  /**
   * Get time entries by task ID
   */
  static async getTimeEntriesByTask(taskId: string): Promise<any[]> {
    try {
      return await TimeEntry.find({
        task: taskId,
        isDeleted: false
      })
        .populate('user', 'firstName lastName email')
        .populate('case', 'caseNumber title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching time entries by task', { error, taskId });
      throw error;
    }
  }

  /**
   * Get unbilled time entries for a case
   */
  static async getUnbilledTimeEntries(caseId: string): Promise<any[]> {
    try {
      return await TimeEntry.find({
        case: caseId,
        billable: true,
        invoiced: false,
        isDeleted: false
      })
        .populate('user', 'firstName lastName email')
        .populate('task', 'title')
        .sort({ startTime: -1 });
    } catch (error) {
      logger.error('Error fetching unbilled time entries', { error, caseId });
      throw error;
    }
  }

  /**
   * Get time entry statistics
   */
  static async getTimeEntryStatistics(): Promise<any> {
    try {
      // Get total time entries
      const totalTimeEntries = await TimeEntry.countDocuments({ isDeleted: false });
      
      // Get total billable hours
      const billableHours = await TimeEntry.aggregate([
        { $match: { billable: true, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
      ]);
      
      // Get total non-billable hours
      const nonBillableHours = await TimeEntry.aggregate([
        { $match: { billable: false, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
      ]);
      
      // Get recently added time entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTimeEntries = await TimeEntry.countDocuments({
        startTime: { $gte: thirtyDaysAgo },
        isDeleted: false
      });
      
      // Get total billable amount
      const billableAmount = await TimeEntry.aggregate([
        { $match: { billable: true, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$billableAmount' } } }
      ]);
      
      const statistics = {
        totalTimeEntries,
        billableHours: billableHours.length > 0 ? billableHours[0].total / 60 : 0, // Convert minutes to hours
        nonBillableHours: nonBillableHours.length > 0 ? nonBillableHours[0].total / 60 : 0, // Convert minutes to hours
        recentTimeEntries,
        billableAmount: billableAmount.length > 0 ? billableAmount[0].total : 0
      };
      
      logger.info('Time entry statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating time entry statistics', { error });
      throw error;
    }
  }
}