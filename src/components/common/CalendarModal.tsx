import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchTasks } from '../../store/slices/tasksSlice';
import { Modal } from './index';
import * as FaIcons from 'react-icons/fa';
import './CommonStyles.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { tasks, isLoading: tasksLoading } = useSelector((state: RootState) => state.tasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedItem, setSelectedItem] = useState<{type: 'event' | 'task', id: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchTasks() as any);
    }
  }, [dispatch, isOpen]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: 'month' | 'week') => {
    setView(newView);
  };

  // Helper functions for calendar rendering
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get combined events and tasks for the current view
  const getItemsForDate = (date: Date) => {
    
    // Get tasks with due dates matching this date
    const dateTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Return combined items
    return {
      tasks: dateTasks,
      totalCount: dateTasks.length
    };
  };
  
  // Handle item click
  const handleItemClick = (type: 'event' | 'task', id: string) => {
    setSelectedItem({ type, id });
  };
  
  // Get task priority class
  const getTaskPriorityClass = (priority: string) => {
    switch (priority) {
      case 'low': return 'task-priority-low';
      case 'medium': return 'task-priority-medium';
      case 'high': return 'task-priority-high';
      case 'urgent': return 'task-priority-urgent';
      default: return '';
    }
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayItems = getItemsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isToday ? 'today' : ''}`}
        >
          <div className="day-header">
            <span className="day-number">{day}</span>
          </div>
          <div className="day-events">
            
            {/* Display tasks */}
            {dayItems.tasks.slice(0, 2).map(task => (
              <div 
                key={`task-${task._id}`} 
                className={`event-item task-item ${getTaskPriorityClass(task.priority)}`}
                title={`${task.title} (${task.priority} priority)`}
                onClick={() => handleItemClick('task', task._id)}
              >
                <FaIcons.FaTasks className="item-icon" /> {task.title}
              </div>
            ))}
            
            {/* Show more indicator if needed */}
            {dayItems.totalCount > 4 && (
              <div className="more-events">+{dayItems.totalCount - 4} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="calendar-days">
          {days}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayItems = getItemsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div key={`week-day-${i}`} className={`week-day ${isToday ? 'today' : ''}`}>
          <div className="week-day-header">
            <div className="week-day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="week-day-date">{date.getDate()}</div>
          </div>
          <div className="week-day-events">
            {/* Display tasks */}
            {dayItems.tasks.map(task => (
              <div 
                key={`task-${task._id}`} 
                className={`event-item task-item ${getTaskPriorityClass(task.priority)}`}
                title={`${task.title} (${task.priority} priority)`}
                onClick={() => handleItemClick('task', task._id)}
              >
                <FaIcons.FaTasks className="item-icon" /> {task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="week-view">
        {days}
      </div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="CALENDAR" 
      size="large"
    >
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-title">
            {formatDate(currentDate)}
          </div>
          <div className="calendar-controls">
            <div className="view-controls">
              <button 
                className={`view-button ${view === 'month' ? 'active' : ''}`}
                onClick={() => handleViewChange('month')}
              >
                Month
              </button>
              <button 
                className={`view-button ${view === 'week' ? 'active' : ''}`}
                onClick={() => handleViewChange('week')}
              >
                Week
              </button>
            </div>
            <div className="navigation-controls">
              <button className="nav-button" onClick={handlePrevious}>
                <FaIcons.FaChevronLeft />
              </button>
              <button className="nav-button today-button" onClick={handleToday}>
                Today
              </button>
              <button className="nav-button" onClick={handleNext}>
                <FaIcons.FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {tasksLoading ? (
          <div className="loading-indicator">Loading calendar...</div>
        ) : (
          <div className="calendar-view">
            {view === 'month' ? renderMonthView() : renderWeekView()}
          </div>
        )}
      </div>
      
      {selectedItem && (
        <div className="calendar-item-details">
          <div className="details-header">
            <h3>{selectedItem.type === 'event' ? 'Event Details' : 'Task Details'}</h3>
            <button className="close-details" onClick={() => setSelectedItem(null)}>
              <FaIcons.FaTimes />
            </button>
          </div>
          <div className="details-content">
            {selectedItem.type === 'task' && (
              <div className="task-details">
                {tasks.find(t => t.id === selectedItem.id) ? (
                  <div>
                    <h4>{tasks.find(t => t.id === selectedItem.id)?.title}</h4>
                    <p>{tasks.find(t => t.id === selectedItem.id)?.description}</p>
                    <p><strong>Due Date:</strong> {new Date(tasks.find(t => t.id === selectedItem.id)?.dueDate || '').toLocaleDateString()}</p>
                    <p><strong>Priority:</strong> {tasks.find(t => t.id === selectedItem.id)?.priority}</p>
                    <p><strong>Status:</strong> {tasks.find(t => t.id === selectedItem.id)?.status.replace('_', ' ')}</p>
                  </div>
                ) : (
                  <p>Task not found</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CalendarModal;