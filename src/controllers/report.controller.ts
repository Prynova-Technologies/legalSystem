import { Request, Response, NextFunction } from 'express';
import Case from '../models/case.model';
import Task from '../models/task.model';
import TimeEntry from '../models/timeEntry.model';
import Invoice from '../models/invoice.model';
import { CaseStatus, CaseType } from '../interfaces/case.interface';
import { TaskStatus } from '../interfaces/task.interface';
import { InvoiceStatus } from '../interfaces/billing.interface';

// Define report types
export enum ReportType {
  CASE = 'case',
  FINANCIAL = 'financial',
  PRODUCTIVITY = 'productivity'
}

/**
 * Generate reports based on type and date range
 * @route GET /api/reports
 * @access Private
 */
export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract and validate parameters
    const { reportType, startDate, endDate } = req.query;
    
    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Report type, start date, and end date are required'
      });
    }
    
    // Parse dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999); // Set to end of day
    
    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }
    
    let reportData;
    
    // Generate report based on type
    switch (reportType) {
      case ReportType.CASE:
        reportData = await generateCaseReport(start, end);
        break;
      case ReportType.FINANCIAL:
        reportData = await generateFinancialReport(start, end);
        break;
      case ReportType.PRODUCTIVITY:
        reportData = await generateProductivityReport(start, end);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange: {
          startDate: start,
          endDate: end
        },
        report: reportData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate case report
 * @private
 */
const generateCaseReport = async (startDate: Date, endDate: Date) => {
  // Get cases created or updated in the date range
  const cases = await Case.find({
    $or: [
      { createdAt: { $gte: startDate, $lte: endDate } },
      { updatedAt: { $gte: startDate, $lte: endDate } }
    ],
    isDeleted: false
  })
  .populate('client', 'name')
  .populate('assignedAttorneys', 'firstName lastName')
  .lean();
  
  // Count cases by status
  const casesByStatus = {
    [CaseStatus.OPEN]: 0,
    [CaseStatus.PENDING]: 0,
    [CaseStatus.CLOSED]: 0,
    [CaseStatus.ARCHIVED]: 0,
    [CaseStatus.SUSPENDED]: 0
  };
  
  // Count cases by type
  const casesByType = Object.values(CaseType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<string, number>);
  
  // Process cases
  cases.forEach(caseItem => {
    // Count by status
    if (casesByStatus.hasOwnProperty(caseItem.status)) {
      casesByStatus[caseItem.status]++;
    }
    
    // Count by type
    if (casesByType.hasOwnProperty(caseItem.type)) {
      casesByType[caseItem.type]++;
    }
  });
  
  // Get recently closed cases
  const closedCases = await Case.find({
    status: CaseStatus.CLOSED,
    closeDate: { $gte: startDate, $lte: endDate },
    isDeleted: false
  })
  .populate('client', 'name')
  .populate('assignedAttorneys', 'firstName lastName')
  .sort({ closeDate: -1 })
  .lean();
  
  return {
    totalCases: cases.length,
    casesByStatus,
    casesByType,
    closedCases,
    casesList: cases
  };
};

/**
 * Generate financial report
 * @private
 */
const generateFinancialReport = async (startDate: Date, endDate: Date) => {
  // Get invoices in the date range
  const invoices = await Invoice.find({
    issueDate: { $gte: startDate, $lte: endDate },
    isDeleted: false
  })
  .populate('client', 'name')
  .populate('case', 'caseNumber title')
  .sort({ issueDate: -1 })
  .lean();
  
  // Count invoices by status
  const invoicesByStatus = {
    [InvoiceStatus.DRAFT]: 0,
    [InvoiceStatus.SENT]: 0,
    [InvoiceStatus.PAID]: 0,
    [InvoiceStatus.OVERDUE]: 0,
    [InvoiceStatus.CANCELLED]: 0,
    [InvoiceStatus.PARTIALLY_PAID]: 0
  };
  
  // Calculate totals
  let totalBilled = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  
  // Process invoices
  invoices.forEach(invoice => {
    // Count by status
    if (invoicesByStatus.hasOwnProperty(invoice.status)) {
      invoicesByStatus[invoice.status]++;
    }
    
    // Calculate totals
    totalBilled += invoice.total;
    
    if (invoice.status === InvoiceStatus.PAID) {
      totalPaid += invoice.total;
    } else if (invoice.status === InvoiceStatus.PARTIALLY_PAID) {
      // Sum payments
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      totalPaid += paidAmount;
      totalOutstanding += (invoice.total - paidAmount);
    } else if (invoice.status !== InvoiceStatus.CANCELLED) {
      totalOutstanding += invoice.total;
    }
  });
  
  // Get unbilled time entries
  const unbilledTimeEntries = await TimeEntry.find({
    startTime: { $gte: startDate, $lte: endDate },
    billable: true,
    invoiced: false,
    isDeleted: false
  })
  .populate('user', 'firstName lastName')
  .populate('case', 'caseNumber title')
  .populate('task', 'title')
  .sort({ startTime: -1 })
  .lean();
  
  // Calculate unbilled amount
  const unbilledAmount = unbilledTimeEntries.reduce((sum: number, entry: any) => {
    return sum + (entry.billableAmount || 0);
  }, 0);
  
  return {
    totalInvoices: invoices.length,
    invoicesByStatus,
    financialSummary: {
      totalBilled,
      totalPaid,
      totalOutstanding,
      unbilledAmount
    },
    invoicesList: invoices,
    unbilledTimeEntries
  };
};

/**
 * Generate productivity report
 * @private
 */
const generateProductivityReport = async (startDate: Date, endDate: Date) => {
  // Get time entries in the date range
  const timeEntries = await TimeEntry.find({
    startTime: { $gte: startDate, $lte: endDate },
    isDeleted: false
  })
  .populate('user', 'firstName lastName')
  .populate('case', 'caseNumber title')
  .populate('task', 'title')
  .sort({ startTime: -1 })
  .lean();
  
  // Get tasks completed in the date range
  const completedTasks = await Task.find({
    completedDate: { $gte: startDate, $lte: endDate },
    status: TaskStatus.COMPLETED,
    isDeleted: false
  })
  .populate('assignedTo', 'firstName lastName')
  .populate('case', 'caseNumber title')
  .sort({ completedDate: -1 })
  .lean();
  
  // Calculate time by user
  const timeByUser: Record<string, { userId: string, userName: string, totalMinutes: number, billableMinutes: number, nonBillableMinutes: number }> = {};
  
  // Process time entries
  timeEntries.forEach((entry: any) => {
    const userId = entry.user._id || entry.user;
    const userName = entry.user.firstName && entry.user.lastName ? 
      `${entry.user.firstName} ${entry.user.lastName}` : 
      userId.toString();
    
    if (!timeByUser[userId]) {
      timeByUser[userId] = {
        userId: userId.toString(),
        userName,
        totalMinutes: 0,
        billableMinutes: 0,
        nonBillableMinutes: 0
      };
    }
    
    timeByUser[userId].totalMinutes += entry.duration;
    
    if (entry.billable) {
      timeByUser[userId].billableMinutes += entry.duration;
    } else {
      timeByUser[userId].nonBillableMinutes += entry.duration;
    }
  });
  
  // Calculate tasks by user
  const tasksByUser: Record<string, { userId: string, userName: string, completedTasks: number }> = {};
  
  // Process completed tasks
  completedTasks.forEach((task: any) => {
    if (!task.assignedTo) return;
    
    // Use type guard to check if assignedTo is an object with _id property
    const isUserObject = typeof task.assignedTo !== 'string' && task.assignedTo._id;
    const userId = isUserObject ? task.assignedTo._id : task.assignedTo;
    const userName = isUserObject && task.assignedTo.firstName && task.assignedTo.lastName ? 
      `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 
      userId.toString();
    
    if (!tasksByUser[userId]) {
      tasksByUser[userId] = {
        userId: userId.toString(),
        userName,
        completedTasks: 0
      };
    }
    
    tasksByUser[userId].completedTasks++;
  });
  
  // Calculate total time
  const totalMinutes = Object.values(timeByUser).reduce((sum, user) => sum + user.totalMinutes, 0);
  const totalBillableMinutes = Object.values(timeByUser).reduce((sum, user) => sum + user.billableMinutes, 0);
  const totalNonBillableMinutes = Object.values(timeByUser).reduce((sum, user) => sum + user.nonBillableMinutes, 0);
  
  return {
    timeSummary: {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableHours: Math.round((totalBillableMinutes / 60) * 100) / 100,
      nonBillableHours: Math.round((totalNonBillableMinutes / 60) * 100) / 100,
      utilizationRate: totalMinutes > 0 ? Math.round((totalBillableMinutes / totalMinutes) * 100) : 0
    },
    taskSummary: {
      totalCompletedTasks: completedTasks.length
    },
    userProductivity: {
      timeByUser: Object.values(timeByUser).map(user => ({
        ...user,
        totalHours: Math.round((user.totalMinutes / 60) * 100) / 100,
        billableHours: Math.round((user.billableMinutes / 60) * 100) / 100,
        nonBillableHours: Math.round((user.nonBillableMinutes / 60) * 100) / 100
      })),
      tasksByUser: Object.values(tasksByUser)
    },
    timeEntries,
    completedTasks
  };
};