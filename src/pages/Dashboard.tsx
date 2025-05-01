import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchCases } from '../store/slices/casesSlice';
import { fetchTasks } from '../store/slices/tasksSlice';
import { fetchEvents } from '../store/slices/calendarSlice';
import { fetchTimeEntries } from '../store/slices/billingSlice';
import { DashboardCharts } from '../components/common';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { cases, isLoading: casesLoading } = useSelector((state: RootState) => state.cases);
  const { tasks, isLoading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const { events, isLoading: eventsLoading } = useSelector((state: RootState) => state.calendar);
  const { timeEntries, isLoading: timeEntriesLoading } = useSelector((state: RootState) => state.billing);

  useEffect(() => {
    // Load dashboard data
    dispatch(fetchCases() as any);
    dispatch(fetchTasks() as any);
    dispatch(fetchEvents() as any);
    dispatch(fetchTimeEntries() as any);
  }, [dispatch]);

  const isLoading = casesLoading || tasksLoading || eventsLoading || timeEntriesLoading;

  // Calculate dashboard metrics
  const openCasesCount = cases.filter(c => c.status === 'open').length;
  const upcomingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const upcomingEventsCount = events.filter(e => new Date(e.startTime) > new Date()).length;
  const unbilledHours = timeEntries.filter(t => !t.billed).reduce((total, entry) => total + entry.duration / 60, 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <p>Here's an overview of your legal practice</p>
      </div>

      {isLoading ? (
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
              {cases.length > 0 ? (
                <div className="dashboard-list">
                  {cases.slice(0, 5).map(c => (
                    <div key={c.id} className="dashboard-list-item">
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
              {tasks.length > 0 ? (
                <div className="dashboard-list">
                  {tasks
                    .filter(t => t.status !== 'completed')
                    .slice(0, 5)
                    .map(t => (
                      <div key={t.id} className="dashboard-list-item">
                        <div className="item-title">{t.title}</div>
                        <div className="item-subtitle">Due: {new Date(t.dueDate).toLocaleDateString()}</div>
                        <div className={`item-priority priority-${t.priority}`}>{t.priority}</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-state">No upcoming tasks</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Upcoming Events</h2>
              {events.length > 0 ? (
                <div className="dashboard-list">
                  {events
                    .filter(e => new Date(e.startTime) > new Date())
                    .slice(0, 5)
                    .map(e => (
                      <div key={e.id} className="dashboard-list-item">
                        <div className="item-title">{e.title}</div>
                        <div className="item-subtitle">
                          {new Date(e.startTime).toLocaleDateString()} at {new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className={`item-type event-type-${e.eventType}`}>{e.eventType.replace('_', ' ')}</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-state">No upcoming events</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Time Entries</h2>
              {timeEntries.length > 0 ? (
                <div className="dashboard-list">
                  {timeEntries.slice(0, 5).map(entry => (
                    <div key={entry.id} className="dashboard-list-item">
                      <div className="item-title">{entry.description}</div>
                      <div className="item-subtitle">{new Date(entry.date).toLocaleDateString()}</div>
                      <div className="item-hours">{(entry.duration / 60).toFixed(1)} hrs</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No recent time entries</p>
              )}
            </div>
          </div>

          <DashboardCharts />
        </>
      )}
    </div>
  );
};

export default Dashboard;