import { Request, Response, NextFunction } from 'express';
import Case from '../models/case.model';
import Task from '../models/task.model';
import TimeEntry from '../models/timeEntry.model';
import Invoice from '../models/invoice.model';
import { CaseStatus } from '../interfaces/case.interface';
import { TaskStatus } from '../interfaces/task.interface';
import { InvoiceStatus } from '../interfaces/billing.interface';

// Define interface for event objects
interface IEvent {
  title: string;
  date: Date;
  description?: string;
  relatedTo?: {
    type: 'case' | 'client' | 'task';
    id: string;
  };
}

/**
 * Get dashboard analytics data
 * @route GET /api/dashboard
 * @access Private
 */
export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get current date and time references
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);
    
    // 1. Case metrics
    const openCases = await Case.countDocuments({ 
      status: CaseStatus.OPEN, 
      isDeleted: false 
    });
    
    // 2. Task metrics
    const assignedTasks = await Task.countDocuments({ 
      assignedTo: { $exists: true },
      status: { $ne: TaskStatus.COMPLETED },
      isDeleted: false 
    });
    
    const unassignedTasks = await Task.countDocuments({ 
      assignedTo: { $exists: false },
      isDeleted: false 
    });
    
    // 3. Upcoming tasks (due in the next 7 days)
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const upcomingTasks = await Task.find({ 
      dueDate: { $gte: now, $lte: sevenDaysFromNow },
      status: { $ne: TaskStatus.COMPLETED },
      isDeleted: false 
    })
    .populate('assignedTo', 'firstName lastName email')
    .populate('case', 'caseNumber title')
    .sort({ dueDate: 1 })
    .limit(10);
    
    // 4. Unbilled hours
    const unbilledHoursResult = await TimeEntry.aggregate([
      { 
        $match: { 
          billable: true, 
          invoiced: false,
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalMinutes: { $sum: '$duration' },
          billableAmount: { $sum: { $ifNull: ['$billableAmount', 0] } }
        } 
      }
    ]);
    
    const unbilledHours = unbilledHoursResult.length > 0 
      ? Math.round((unbilledHoursResult[0].totalMinutes / 60) * 100) / 100
      : 0;
    
    const unbilledAmount = unbilledHoursResult.length > 0 
      ? unbilledHoursResult[0].billableAmount
      : 0;
    
    // 5. Financial metrics
    // Total income (paid invoices)
    const totalIncomeResult = await Invoice.aggregate([
      { 
        $match: { 
          status: InvoiceStatus.PAID,
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$total' } 
        } 
      }
    ]);
    
    const totalIncome = totalIncomeResult.length > 0 ? totalIncomeResult[0].total : 0;
    
    // Monthly income data for graph
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const monthlyIncome = await Invoice.aggregate([
      {
        $match: {
          status: InvoiceStatus.PAID,
          issueDate: { $gte: startOfYear, $lte: endOfYear },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { $month: '$issueDate' },
          income: { $sum: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Monthly expenditure data for graph
    const monthlyExpenditure = await TimeEntry.aggregate([
      {
        $match: {
          date: { $gte: startOfYear, $lte: endOfYear },
          isDeleted: false,
          // Consider entries that represent expenses
          isExpense: true
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          expenditure: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format monthly income and expenditure for graph
    const monthlyFinancialData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const incomeFound = monthlyIncome.find(item => item._id === month);
      const expenditureFound = monthlyExpenditure.find(item => item._id === month);
      return {
        month,
        income: incomeFound ? incomeFound.income : 0,
        expenditure: expenditureFound ? expenditureFound.expenditure : 0
      };
    });
    
    // 6. Total clients
    const totalClients = await Case.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$client' } },
      { $count: 'total' }
    ]);
    
    const clientCount = totalClients.length > 0 ? totalClients[0].total : 0;
    
    // 7. Recently added cases (last 10 days)
    const recentCases = await Case.find({
      createdAt: { $gte: tenDaysAgo },
      isDeleted: false
    })
    .populate('client', 'name')
    .populate('assignedAttorneys', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);
    
    // 8. Recent time entries
    const recentTimeEntries = await TimeEntry.find({
      createdAt: { $gte: tenDaysAgo },
      isDeleted: false
    })
    .populate('user', 'firstName lastName')
    .populate('case', 'caseNumber title')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .limit(5);
    
    // 9. Upcoming events (if you have an events collection)
    // This is a placeholder - you would need to implement this based on your events model
    const upcomingEvents: IEvent[] = [];
    
    // Get case status distribution data
    const caseStatusDistribution = await Case.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Get case type distribution data
    const caseTypeDistribution = await Case.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);

    // Get task priority breakdown data
    const taskPriorityBreakdown = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { priority: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Compile all dashboard data
    const dashboardData = {
      metrics: {
        openCases,
        assignedTasks,
        unassignedTasks,
        unbilledHours,
        unbilledAmount,
        totalIncome,
        clientCount
      },
      graphs: {
        monthlyFinancial: monthlyFinancialData,
        caseStatusDistribution,
        caseTypeDistribution,
        taskPriorityBreakdown
      },
      recent: {
        cases: recentCases,
        timeEntries: recentTimeEntries
      },
      upcoming: {
        tasks: upcomingTasks,
        events: upcomingEvents
      }
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};