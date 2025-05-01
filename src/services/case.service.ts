import Case from '../models/case.model';
import Task from '../models/task.model';
import TimeEntry from '../models/timeEntry.model';
import Document from '../models/document.model';
import { CaseStatus, ICaseParty, ICaseActivity } from '../interfaces/case.interface';
import logger from '../utils/logger';

/**
 * Service for case-related operations
 */
export class CaseService {
  /**
   * Get all cases with filtering options
   */
  static async getAllCases(filters: any = {}): Promise<any[]> {
    try {
      const filter: any = { isDeleted: false, ...filters };
      
      // Handle date range filters if they exist in the filters object
      if (filter.openedAfter) {
        filter.openDate = { $gte: new Date(filter.openedAfter) };
        delete filter.openedAfter;
      }
      
      if (filter.openedBefore) {
        filter.openDate = filter.openDate || {};
        filter.openDate.$lte = new Date(filter.openedBefore);
        delete filter.openedBefore;
      }
      
      // Handle tag filtering
      if (filter.tags && typeof filter.tags === 'string') {
        const tags = filter.tags.split(',');
        filter.tags = { $in: tags };
      }
      
      return await Case.find(filter)
        .populate('client', 'firstName lastName company')
        .populate('attorneys', 'firstName lastName')
        .populate('paralegal', 'firstName lastName')
        .sort({ openDate: -1 });
    } catch (error) {
      logger.error('Error fetching cases', { error, filters });
      throw error;
    }
  }

  /**
   * Get a single case by ID
   */
  static async getCaseById(caseId: string): Promise<any | null> {
    try {
      return await Case.findOne({ _id: caseId, isDeleted: false })
        .populate('client', 'firstName lastName company')
        .populate('attorneys', 'firstName lastName email')
        .populate('paralegal', 'firstName lastName email')
        .populate('parties');
    } catch (error) {
      logger.error('Error fetching case by ID', { error, caseId });
      throw error;
    }
  }

  /**
   * Create a new case
   */
  static async createCase(caseData: any): Promise<any> {
    try {
      // Generate case number
      const caseNumber = await Case.generateCaseNumber();
      caseData.caseNumber = caseNumber;
      
      // Set initial values
      caseData.status = CaseStatus.OPEN;
      caseData.openDate = new Date();
      
      const caseItem = await Case.create(caseData);
      logger.info('New case created', { caseId: caseItem._id, caseNumber });
      return caseItem;
    } catch (error) {
      logger.error('Error creating case', { error, caseData });
      throw error;
    }
  }

  /**
   * Update a case
   */
  static async updateCase(caseId: string, updateData: any): Promise<any | null> {
    try {
      // Check if case exists and is not deleted
      const caseItem = await Case.findOne({ _id: caseId, isDeleted: false });
      if (!caseItem) return null;
      
      // Don't allow updating caseNumber
      if (updateData.caseNumber) {
        delete updateData.caseNumber;
      }
      
      // If status is changing to closed, set closeDate
      if (updateData.status === CaseStatus.CLOSED && caseItem.status !== CaseStatus.CLOSED) {
        updateData.closeDate = new Date();
      }
      
      const updatedCase = await Case.findByIdAndUpdate(
        caseId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('client', 'firstName lastName company')
        .populate('attorneys', 'firstName lastName')
        .populate('paralegal', 'firstName lastName');
      
      logger.info('Case updated', { caseId });
      return updatedCase;
    } catch (error) {
      logger.error('Error updating case', { error, caseId, updateData });
      throw error;
    }
  }

  /**
   * Delete a case (soft delete)
   */
  static async deleteCase(caseId: string): Promise<boolean> {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) return false;
      
      // Soft delete by setting isDeleted flag
      caseItem.isDeleted = true;
      await caseItem.save();
      
      logger.info('Case deleted (soft)', { caseId });
      return true;
    } catch (error) {
      logger.error('Error deleting case', { error, caseId });
      throw error;
    }
  }

  /**
   * Add a party to a case
   */
  static async addCaseParty(caseId: string, partyData: ICaseParty): Promise<any | null> {
    try {
      const caseItem = await Case.findOne({ _id: caseId, isDeleted: false });
      if (!caseItem) return null;
      
      caseItem.parties.push(partyData);
      await caseItem.save();
      
      logger.info('Case party added', { caseId });
      return caseItem;
    } catch (error) {
      logger.error('Error adding case party', { error, caseId, partyData });
      throw error;
    }
  }

  /**
   * Remove a party from a case
   */
  static async removeCaseParty(caseId: string, partyId: string): Promise<any | null> {
    try {
      const caseItem = await Case.findOne({ _id: caseId, isDeleted: false });
      if (!caseItem) return null;
      
      caseItem.parties = caseItem.parties.filter(
        (party: ICaseParty & { _id: { toString(): string } }) => party._id.toString() !== partyId
      );
      
      await caseItem.save();
      
      logger.info('Case party removed', { caseId, partyId });
      return caseItem;
    } catch (error) {
      logger.error('Error removing case party', { error, caseId, partyId });
      throw error;
    }
  }

  /**
   * Add an activity to a case
   */
  static async addCaseActivity(caseId: string, activityData: ICaseActivity): Promise<any | null> {
    try {
      const caseItem = await Case.findOne({ _id: caseId, isDeleted: false });
      if (!caseItem) return null;
      
      caseItem.activityLog.push(activityData);
      await caseItem.save();
      
      logger.info('Case activity added', { caseId });
      return caseItem;
    } catch (error) {
      logger.error('Error adding case activity', { error, caseId, activityData });
      throw error;
    }
  }

  /**
   * Get case statistics
   */
  static async getCaseStatistics(): Promise<any> {
    try {
      // Get cases by status
      const casesByStatus = await Case.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      // Get cases by type
      const casesByType = await Case.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$caseType', count: { $sum: 1 } } }
      ]);
      
      // Get recently opened cases (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCases = await Case.countDocuments({
        openDate: { $gte: thirtyDaysAgo },
        isDeleted: false
      });
      
      // Get recently closed cases (last 30 days)
      const recentClosedCases = await Case.countDocuments({
        closeDate: { $gte: thirtyDaysAgo },
        status: CaseStatus.CLOSED,
        isDeleted: false
      });
      
      // Get total cases, open cases, and closed cases
      const totalCases = await Case.countDocuments({ isDeleted: false });
      const openCases = await Case.countDocuments({ status: CaseStatus.OPEN, isDeleted: false });
      const closedCases = await Case.countDocuments({ status: CaseStatus.CLOSED, isDeleted: false });
      
      // Get total billable hours for all cases
      const billableHours = await TimeEntry.aggregate([
        { $match: { case: { $exists: true }, billable: true } },
        { $group: { _id: null, total: { $sum: '$duration' } } }
      ]);
      
      // Get total documents for all cases
      const totalDocuments = await Document.countDocuments({ case: { $exists: true } });
      
      const statistics = {
        totalCases,
        openCases,
        closedCases,
        casesByStatus: casesByStatus.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        casesByType: casesByType.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        recentCases,
        recentClosedCases,
        billableHours: billableHours.length > 0 ? billableHours[0].total / 60 : 0,
        totalDocuments
      };
      
      logger.info('Case statistics generated');
      return statistics;
    } catch (error) {
      logger.error('Error generating case statistics', { error });
      throw error;
    }
  }

  /**
   * Get cases for a specific client
   */
  static async getCasesByClient(clientId: string): Promise<any[]> {
    try {
      return await Case.find({
        client: clientId,
        isDeleted: false
      })
        .populate('attorneys', 'firstName lastName')
        .populate('paralegal', 'firstName lastName')
        .sort({ openDate: -1 });
    } catch (error) {
      logger.error('Error fetching cases by client', { error, clientId });
      throw error;
    }
  }

  /**
   * Get cases for a specific attorney
   */
  static async getCasesByAttorney(attorneyId: string): Promise<any[]> {
    try {
      return await Case.find({
        attorneys: attorneyId,
        isDeleted: false
      })
        .populate('client', 'firstName lastName company')
        .populate('paralegal', 'firstName lastName')
        .sort({ openDate: -1 });
    } catch (error) {
      logger.error('Error fetching cases by attorney', { error, attorneyId });
      throw error;
    }
  }

  /**
   * Get case timeline (activities, tasks, time entries, documents)
   */
  static async getCaseTimeline(caseId: string): Promise<any[]> {
    try {
      const caseItem = await Case.findOne({ _id: caseId, isDeleted: false });
      if (!caseItem) return [];
      
      // Get case activities
      const activities = caseItem.activityLog.map((activity: ICaseActivity & { toObject?: () => any }) => ({
        type: 'activity',
        ...(activity.toObject ? activity.toObject() : activity),
        timestamp: activity.timestamp
      }));
      
      // Get case tasks
      const tasks = await Task.find({ case: caseId, isDeleted: false })
        .select('title description dueDate createdAt assignedTo status')
        .populate('assignedTo', 'firstName lastName');
        
      const taskEvents = tasks.map((task: { toObject?: () => any; createdAt: Date }) => ({
        type: 'task',
        ...(task.toObject ? task.toObject() : task),
        timestamp: task.createdAt
      }));
      
      // Get case time entries
      const timeEntries = await TimeEntry.find({ case: caseId, isDeleted: false })
        .select('description startTime duration user')
        .populate('user', 'firstName lastName');
        
      const timeEvents = timeEntries.map((entry: { toObject?: () => any; startTime: Date }) => ({
        type: 'timeEntry',
        ...(entry.toObject ? entry.toObject() : entry),
        timestamp: entry.startTime
      }));
      
      // Get case documents
      const documents = await Document.find({ case: caseId, isDeleted: false })
        .select('title documentType createdAt uploadedBy')
        .populate('uploadedBy', 'firstName lastName');
        
      const documentEvents = documents.map((doc: { toObject?: () => any; createdAt: Date }) => ({
        type: 'document',
        ...(doc.toObject ? doc.toObject() : doc),
        timestamp: doc.createdAt
      }));
      
      // Combine all events and sort by timestamp
      const timeline = [...activities, ...taskEvents, ...timeEvents, ...documentEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      logger.info('Case timeline generated', { caseId });
      return timeline;
    } catch (error) {
      logger.error('Error generating case timeline', { error, caseId });
      throw error;
    }
  }
}