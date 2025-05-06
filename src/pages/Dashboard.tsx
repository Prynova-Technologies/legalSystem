import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import dashboardService, { DashboardData } from '../services/dashboardService';
import { DashboardCharts } from '../components/common';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load dashboard data from API
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
  // Get metrics from dashboard data
  const openCasesCount = dashboardData?.metrics?.openCases || 0;
  const upcomingTasksCount = dashboardData?.metrics?.assignedTasks || 0;
  const upcomingEventsCount = dashboardData?.upcoming?.events?.length || 0;
  const unbilledHours = dashboardData?.metrics?.unbilledHours || 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>Here's an overview of your legal practice</p>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : isLoading ? (
        <div className="loading-indicator">Loading dashboard data...</div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Open Cases</h3>
              <div className="metric-value">{openCasesCount}</div>
              <a href="/cases" className="metric-link">View all cases</a>
            </div>

            <div className="metric-card">
              <h3>Pending Tasks</h3>
              <div className="metric-value">{upcomingTasksCount}</div>
              <a href="/tasks" className="metric-link">View all tasks</a>
            </div>

            <div className="metric-card">
              <h3>Upcoming Events</h3>
              <div className="metric-value">{upcomingEventsCount}</div>
              <a href="/calendar" className="metric-link">View calendar</a>
            </div>

            <div className="metric-card">
              <h3>Unbilled Hours</h3>
              <div className="metric-value">{unbilledHours.toFixed(1)}</div>
              <a href="/billing" className="metric-link">View billing</a>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h2>Recent Cases</h2>
              {dashboardData?.recent?.cases && dashboardData.recent.cases.length > 0 ? (
                <div className="dashboard-list">
                  {dashboardData.recent.cases.slice(0, 5).map(c => (
                    <div key={c._id} className="dashboard-list-item">
                      <div className="item-title">{c.title}</div>
                      <div className="item-subtitle">{c.caseNumber}</div>
                      <div className={`item-status status-${c.status}`}>{c.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No cases found</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Upcoming Tasks</h2>
              {dashboardData?.upcoming?.tasks && dashboardData.upcoming.tasks.length > 0 ? (
                <div className="dashboard-list">
                  {dashboardData.upcoming.tasks.slice(0, 5).map(t => (
                    <div key={t._id} className="dashboard-list-item">
                      <div className="item-title">{t.title}</div>
                      <div className="item-subtitle">Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                      <div className="item-status">{t.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No upcoming tasks</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Upcoming Events</h2>
              {dashboardData?.upcoming?.events && dashboardData.upcoming.events.length > 0 ? (
                <div className="dashboard-list">
                  {dashboardData.upcoming.events.map(e => (
                    <div key={e.title} className="dashboard-list-item">
                      <div className="item-title">{e.title}</div>
                      <div className="item-subtitle">
                        {new Date(e.date).toLocaleDateString()}
                      </div>
                      {e.description && <div className="item-description">{e.description}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No upcoming events</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Time Entries</h2>
              {dashboardData?.recent?.timeEntries && dashboardData.recent.timeEntries.length > 0 ? (
                <div className="dashboard-list">
                  {dashboardData.recent.timeEntries.map(entry => (
                    <div key={entry._id} className="dashboard-list-item">
                      <div className="item-title">{entry.description}</div>
                      <div className="item-subtitle">{new Date(entry.createdAt).toLocaleDateString()}</div>
                      <div className="item-hours">{(entry.duration / 60).toFixed(1)} hrs</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No recent time entries</p>
              )}
            </div>
          </div>

          <DashboardCharts dashboardData={dashboardData} />
        </>
      )}
    </div>
  );
};

export default Dashboard;