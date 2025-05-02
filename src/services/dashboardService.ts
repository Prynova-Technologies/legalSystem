/**
 * Dashboard Service
 * Provides functions to fetch dashboard data from the API
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../utils/apiConfig';

// Define interfaces for dashboard data
interface DashboardMetrics {
  openCases: number;
  assignedTasks: number;
  unassignedTasks: number;
  unbilledHours: number;
  unbilledAmount: number;
  totalIncome: number;
  clientCount: number;
}

interface MonthlyIncome {
  month: number;
  income: number;
}

interface MonthlyFinancial {
  month: number;
  income: number;
  expenditure: number;
}

interface CaseStatusItem {
  status: string;
  count: number;
}

interface CaseTypeItem {
  type: string;
  count: number;
}

interface TaskPriorityItem {
  priority: string;
  count: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  graphs: {
    monthlyFinancial: MonthlyFinancial[];
    caseStatusDistribution: CaseStatusItem[];
    caseTypeDistribution: CaseTypeItem[];
    taskPriorityBreakdown: TaskPriorityItem[];
  };
  recent: {
    cases: any[];
    timeEntries: any[];
  };
  upcoming: {
    tasks: any[];
    events: any[];
  };
}

/**
 * Fetches dashboard analytics data from the API
 * @returns Promise with dashboard data
 */
const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await axios.get(API_ENDPOINTS.DASHBOARD.ANALYTICS, {
      headers: {
        'Content-Type': 'application/json',
        // Include authorization header if using token-based auth
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Dashboard service object with all dashboard-related API functions
 */
const dashboardService = {
  getDashboardData,
};

export default dashboardService;
export type { DashboardData, DashboardMetrics, MonthlyIncome, MonthlyFinancial };