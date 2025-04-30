import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { generateReport, fetchReportHistory, setDateRange } from '../store/slices/reportingSlice';

const Reports: React.FC = () => {
  const dispatch = useDispatch();
  const { reports, currentReport, isLoading, error, dateRange } = useSelector(
    (state: RootState) => state.reporting
  );

  const [reportType, setReportType] = useState<'case' | 'financial' | 'productivity' | 'custom'>('case');
  const [startDate, setStartDate] = useState<string>(dateRange.start || '');
  const [endDate, setEndDate] = useState<string>(dateRange.end || '');
  const [filters, setFilters] = useState({
    practiceAreas: [] as string[],
    users: [] as string[],
    clients: [] as string[],
    caseTypes: [] as string[]
  });

  useEffect(() => {
    dispatch(fetchReportHistory() as any);
  }, [dispatch]);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      await dispatch(generateReport({
        type: reportType,
        dateRange: {
          start: startDate,
          end: endDate
        },
        filters
      }) as any);

      // Save date range for future use
      dispatch(setDateRange({
        start: startDate,
        end: endDate
      }));
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const renderCaseMetrics = () => {
    if (!currentReport?.metrics.case) return null;
    
    const metrics = currentReport.metrics.case;
    
    return (
      <div className="report-section">
        <h3>Case Metrics</h3>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Case Volume</h4>
            <div className="metric-value">{metrics.totalCases}</div>
            <div className="metric-breakdown">
              <div>Open: {metrics.openCases}</div>
              <div>Closed: {metrics.closedCases}</div>
            </div>
          </div>
          
          <div className="metric-card">
            <h4>Average Case Duration</h4>
            <div className="metric-value">{metrics.averageCaseDuration} days</div>
          </div>
        </div>
        
        <div className="report-charts">
          <div className="chart-container">
            <h4>Cases by Type</h4>
            <div className="chart-placeholder">
              {/* In a real app, this would be a chart component */}
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Case Type</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.casesByType).map(([type, count]) => (
                      <tr key={type}>
                        <td>{type}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <h4>Cases by Status</h4>
            <div className="chart-placeholder">
              {/* In a real app, this would be a chart component */}
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.casesByStatus).map(([status, count]) => (
                      <tr key={status}>
                        <td>{status}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialMetrics = () => {
    if (!currentReport?.metrics.financial) return null;
    
    const metrics = currentReport.metrics.financial;
    
    return (
      <div className="report-section">
        <h3>Financial Metrics</h3>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Total Revenue</h4>
            <div className="metric-value">{formatCurrency(metrics.totalRevenue)}</div>
          </div>
          
          <div className="metric-card">
            <h4>Outstanding Balance</h4>
            <div className="metric-value">{formatCurrency(metrics.outstandingBalance)}</div>
          </div>
          
          <div className="metric-card">
            <h4>Billable Hours</h4>
            <div className="metric-value">{metrics.billableHours}</div>
          </div>
          
          <div className="metric-card">
            <h4>Collection Rate</h4>
            <div className="metric-value">{formatPercentage(metrics.collectionRate)}</div>
          </div>
        </div>
        
        <div className="report-charts">
          <div className="chart-container">
            <h4>Revenue by Practice Area</h4>
            <div className="chart-placeholder">
              {/* In a real app, this would be a chart component */}
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Practice Area</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.revenueByPracticeArea).map(([area, revenue]) => (
                      <tr key={area}>
                        <td>{area}</td>
                        <td>{formatCurrency(revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <h4>Top Clients</h4>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Revenue</th>
                    <th>Cases</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topClients.map(client => (
                    <tr key={client.clientId}>
                      <td>{client.clientId}</td>
                      <td>{formatCurrency(client.revenue)}</td>
                      <td>{client.casesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductivityMetrics = () => {
    if (!currentReport?.metrics.productivity) return null;
    
    const metrics = currentReport.metrics.productivity;
    
    return (
      <div className="report-section">
        <h3>Productivity Metrics</h3>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Task Completion Rate</h4>
            <div className="metric-value">{formatPercentage(metrics.taskCompletionRate)}</div>
          </div>
          
          <div className="metric-card">
            <h4>Average Response Time</h4>
            <div className="metric-value">{metrics.averageResponseTime} hours</div>
          </div>
          
          <div className="metric-card">
            <h4>Document Generation Time</h4>
            <div className="metric-value">{metrics.documentGenerationTime} minutes</div>
          </div>
        </div>
        
        <div className="report-section">
          <h4>User Productivity</h4>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Billable Hours</th>
                  <th>Tasks Completed</th>
                  <th>Documents Generated</th>
                </tr>
              </thead>
              <tbody>
                {metrics.userProductivity.map(user => (
                  <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>{user.billableHours}</td>
                    <td>{user.tasksCompleted}</td>
                    <td>{user.documentsGenerated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      
      <div className="report-generator">
        <h2>Generate Report</h2>
        
        <div className="report-form">
          <div className="form-group">
            <label htmlFor="reportType">Report Type</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="case">Case Report</option>
              <option value="financial">Financial Report</option>
              <option value="productivity">Productivity Report</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleGenerateReport}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {currentReport && (
        <div className="report-results">
          <div className="report-header">
            <h2>{currentReport.name}</h2>
            <div className="report-meta">
              <span>Generated: {new Date(currentReport.createdAt).toLocaleString()}</span>
              <span>Period: {new Date(currentReport.dateRange.start).toLocaleDateString()} - {new Date(currentReport.dateRange.end).toLocaleDateString()}</span>
            </div>
          </div>
          
          {currentReport.type === 'case' && renderCaseMetrics()}
          {currentReport.type === 'financial' && renderFinancialMetrics()}
          {currentReport.type === 'productivity' && renderProductivityMetrics()}
          
          <div className="report-actions">
            <button className="btn btn-outline">Export PDF</button>
            <button className="btn btn-outline">Export Excel</button>
            <button className="btn btn-outline">Print</button>
          </div>
        </div>
      )}
      
      <div className="report-history">
        <h2>Report History</h2>
        
        {reports.length > 0 ? (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>{report.name}</td>
                    <td>{report.type}</td>
                    <td>{new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}</td>
                    <td>{new Date(report.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No reports have been generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;