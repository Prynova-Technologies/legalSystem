import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface CaseMetrics {
  totalCases: number;
  openCases: number;
  closedCases: number;
  casesByType: Record<string, number>;
  casesByStatus: Record<string, number>;
  averageCaseDuration: number; // in days
}

interface FinancialMetrics {
  totalRevenue: number;
  outstandingBalance: number;
  revenueByPracticeArea: Record<string, number>;
  billableHours: number;
  collectionRate: number;
  averageDaysToPayment: number;
  topClients: Array<{
    clientId: string;
    revenue: number;
    casesCount: number;
  }>;
}

interface ProductivityMetrics {
  taskCompletionRate: number;
  averageResponseTime: number; // in hours
  documentGenerationTime: number; // in minutes
  userProductivity: Array<{
    userId: string;
    billableHours: number;
    tasksCompleted: number;
    documentsGenerated: number;
  }>;
}

interface Report {
  id: string;
  name: string;
  type: 'case' | 'financial' | 'productivity' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    practiceAreas?: string[];
    users?: string[];
    clients?: string[];
    caseTypes?: string[];
  };
  metrics: {
    case?: CaseMetrics;
    financial?: FinancialMetrics;
    productivity?: ProductivityMetrics;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportingState {
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

const initialState: ReportingState = {
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,
  dateRange: {
    start: null,
    end: null,
  },
};

export const generateReport = createAsyncThunk(
  'reporting/generateReport',
  async (reportConfig: {
    type: Report['type'];
    dateRange: Report['dateRange'];
    filters?: Report['filters'];
  }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = new Date().toISOString();
      const mockReport: Report = {
        id: `${reportConfig.type}-${now}`,
        name: `${reportConfig.type.charAt(0).toUpperCase() + reportConfig.type.slice(1)} Report`,
        type: reportConfig.type,
        dateRange: reportConfig.dateRange,
        filters: reportConfig.filters || {},
        metrics: {
          case: reportConfig.type === 'case' ? {
            totalCases: 150,
            openCases: 75,
            closedCases: 75,
            casesByType: {
              'civil': 50,
              'criminal': 30,
              'family': 40,
              'other': 30
            },
            casesByStatus: {
              'open': 75,
              'closed': 75
            },
            averageCaseDuration: 120
          } : undefined,
          financial: reportConfig.type === 'financial' ? {
            totalRevenue: 500000,
            outstandingBalance: 150000,
            revenueByPracticeArea: {
              'civil': 200000,
              'criminal': 150000,
              'family': 150000
            },
            billableHours: 2000,
            collectionRate: 0.85,
            averageDaysToPayment: 45,
            topClients: [
              { clientId: '1', revenue: 100000, casesCount: 5 },
              { clientId: '2', revenue: 75000, casesCount: 3 }
            ]
          } : undefined,
          productivity: reportConfig.type === 'productivity' ? {
            taskCompletionRate: 0.85,
            averageResponseTime: 24,
            documentGenerationTime: 45,
            userProductivity: [
              {
                userId: '1',
                billableHours: 160,
                tasksCompleted: 45,
                documentsGenerated: 30
              },
              {
                userId: '2',
                billableHours: 140,
                tasksCompleted: 40,
                documentsGenerated: 25
              }
            ]
          } : undefined
        },
        createdAt: now,
        updatedAt: now
      };
      
      return mockReport;
    } catch (error) {
      return rejectWithValue('Failed to generate report');
    }
  }
);

export const fetchReportHistory = createAsyncThunk(
  'reporting/fetchReportHistory',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - would be replaced with actual API call
      const mockReports: Report[] = [];
      
      return mockReports;
    } catch (error) {
      return rejectWithValue('Failed to fetch report history');
    }
  }
);

const reportingSlice = createSlice({
  name: 'reporting',
  initialState,
  reducers: {
    setCurrentReport: (state, action: PayloadAction<Report | null>) => {
      state.currentReport = action.payload;
    },
    setDateRange: (state, action: PayloadAction<ReportingState['dateRange']>) => {
      state.dateRange = action.payload;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate report
      .addCase(generateReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports.push(action.payload);
        state.currentReport = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch report history
      .addCase(fetchReportHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReportHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReportHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentReport,
  setDateRange,
  clearCurrentReport,
} = reportingSlice.actions;

export default reportingSlice.reducer;