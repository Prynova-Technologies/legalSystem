import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchTasks, setFilters, clearFilters, updateTask } from '../store/slices/tasksSlice';

const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, isLoading, error, filters } = useSelector((state: RootState) => state.tasks);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  useEffect(() => {
    dispatch(fetchTasks() as any);
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ searchTerm: searchInput }));
  };

  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchInput('');
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      await dispatch(updateTask({
        taskId,
        taskData: { status: 'completed' }
      }) as any);
    } catch (error) {
      console.error('Failed to mark task as complete:', error);
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    // Search term filter
    if (filters.searchTerm && !task.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Assigned to filter
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) {
      return false;
    }

    // Case filter
    if (filters.caseId && task.caseId !== filters.caseId) {
      return false;
    }

    // Due date filter
    if (filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (filters.dueDate) {
        case 'today':
          if (taskDueDate.getTime() !== today.getTime()) {
            return false;
          }
          break;
        case 'this_week':
          if (taskDueDate < today || taskDueDate >= nextWeek) {
            return false;
          }
          break;
        case 'overdue':
          if (taskDueDate >= today) {
            return false;
          }
          break;
        case 'upcoming':
          if (taskDueDate < tomorrow) {
            return false;
          }
          break;
      }
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'priority-low';
      case 'medium':
        return 'priority-medium';
      case 'high':
        return 'priority-high';
      case 'urgent':
        return 'priority-urgent';
      default:
        return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'status-not-started';
      case 'in_progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      case 'deferred':
        return 'status-deferred';
      default:
        return '';
    }
  };

  return (
    <div className="tasks-container">
      <div className="page-header">
        <h1>Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          New Task
        </Link>
      </div>

      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || null)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Due Date:</label>
            <select
              value={filters.dueDate || ''}
              onChange={(e) => handleFilterChange('dueDate', e.target.value || null)}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          <button onClick={handleClearFilters} className="clear-filters-button">
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading tasks...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found. Try adjusting your filters or create a new task.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div key={task.id} className={`task-card ${getPriorityClass(task.priority)}`}>
              <div className="task-header">
                <h3 className="task-title">{task.title}</h3>
                <span className={`task-status ${getStatusClass(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="task-description">{task.description}</div>
              
              <div className="task-meta">
                <div className="task-meta-item">
                  <span className="meta-label">Due:</span>
                  <span className="meta-value">{formatDate(task.dueDate)}</span>
                </div>
                
                <div className="task-meta-item">
                  <span className="meta-label">Priority:</span>
                  <span className={`meta-value ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                </div>
                
                {task.caseId && (
                  <div className="task-meta-item">
                    <span className="meta-label">Case:</span>
                    <Link to={`/cases/${task.caseId}`} className="meta-value case-link">View Case</Link>
                  </div>
                )}
              </div>
              
              <div className="task-actions">
                {task.status !== 'completed' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleMarkComplete(task.id)}
                  >
                    Mark Complete
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;