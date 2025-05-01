import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchEvents } from '../../store/slices/calendarSlice';
import { Modal } from './index';
import * as FaIcons from 'react-icons/fa';
import './CommonStyles.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { events, isLoading } = useSelector((state: RootState) => state.calendar);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchEvents() as any);
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

  // Filter events for the current view
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
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
      const dayEvents = getEventsForDate(date);
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
            {dayEvents.slice(0, 3).map(event => (
              <div 
                key={event.id} 
                className={`event-item event-type-${event.eventType}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="more-events">+{dayEvents.length - 3} more</div>
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
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div key={`week-day-${i}`} className={`week-day ${isToday ? 'today' : ''}`}>
          <div className="week-day-header">
            <div className="week-day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="week-day-date">{date.getDate()}</div>
          </div>
          <div className="week-day-events">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-item event-type-${event.eventType}`}
                title={event.title}
              >
                {event.title}
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

        {isLoading ? (
          <div className="loading-indicator">Loading calendar...</div>
        ) : (
          <div className="calendar-view">
            {view === 'month' ? renderMonthView() : renderWeekView()}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CalendarModal;