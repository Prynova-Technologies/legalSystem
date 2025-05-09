import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchTasks, setFilters, clearFilters, updateTask } from '../store/slices/tasksSlice';
import { CalendarModal } from '../components/common';
import { TaskCard } from '../components/tasks';
import * as FaIcons from 'react-icons/fa';
import './Tasks.css';

const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, isLoading, error, filters } = useSelector((state: RootState) => state.tasks);
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [showCalendar, setShowCalendar] = useState(false);

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

  const handleTaskStatusChange = async () => {
    // Refresh tasks after status change
    dispatch(fetchTasks() as any);
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
  }

  console.log(filteredTasks)

  return (
    <div className="tasks-container">
      <div className="page-header">
        <h1>Tasks</h1>
        <div className="page-header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowCalendar(true)}
          >
            <FaIcons.FaCalendarAlt /> View Calendar
          </button>
          <Link to="/tasks/new" className="btn btn-primary">
            New Task
          </Link>
        </div>
      </div>
      
      <CalendarModal 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />

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
            <div key={task._id} className="task-card-wrapper">
              <TaskCard
                id={task._id}
                title={task.title}
                description={task.description}
                status={task.status}
                priority={task.priority}
                dueDate={task.dueDate}
                assignedTo={task.assignedTo}
                assignedBy={task.assignedBy}
                startDate={task.startDate}
                onStatusChange={handleTaskStatusChange}
                loading={isLoading}
              />
              
              {task.case && (
                <div className="case-link-container">
                  <Link 
                    to={`/cases/${task.case?._id}`} 
                    className="case-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Related Case
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;