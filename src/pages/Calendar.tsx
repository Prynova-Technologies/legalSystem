import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../store/slices/calendarSlice';
import { EventType } from '../types';

const Calendar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { events, isLoading, error } = useSelector((state: RootState) => state.calendar);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: EventType.CLIENT_MEETING,
    caseId: '',
    attendees: []
  });

  useEffect(() => {
    dispatch(fetchEvents() as any);
  }, [dispatch]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setView(newView);
  };

  const handleOpenEventModal = (date?: Date, event?: any) => {
    if (event) {
      // Edit existing event
      setSelectedEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.startTime).toISOString().slice(0, 16),
        endTime: new Date(event.endTime).toISOString().slice(0, 16),
        location: event.location || '',
        eventType: event.eventType,
        caseId: event.caseId || '',
        attendees: event.attendees || []
      });
    } else {
      // Create new event
      setSelectedEvent(null);
      const startDate = date || new Date();
      startDate.setHours(9, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);
      
      setNewEvent({
        title: '',
        description: '',
        startTime: startDate.toISOString().slice(0, 16),
        endTime: endDate.toISOString().slice(0, 16),
        location: '',
        eventType: EventType.CLIENT_MEETING,
        caseId: '',
        attendees: []
      });
    }
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        // Update existing event
        await dispatch(updateEvent({
          eventId: selectedEvent.id,
          eventData: newEvent
        }) as any);
      } else {
        // Create new event
        await dispatch(createEvent(newEvent) as any);
      }
      handleCloseEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dispatch(deleteEvent(selectedEvent.id) as any);
        handleCloseEventModal();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          onClick={() => handleOpenEventModal(date)}
        >
          <div className="day-header">
            <span className="day-number">{day}</span>
          </div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map(event => (
              <div 
                key={event.id} 
                className={`event-item event-type-${event.eventType}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEventModal(undefined, event);
                }}
              >
                <span className="event-time">{formatTime(event.startTime)}</span>
                <span className="event-title">{event.title}</span>
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
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="calendar-days">{days}</div>
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
        <div key={`week-day-${i}`} className="week-day-column">
          <div className={`week-day-header ${isToday ? 'today' : ''}`}>
            <div className="weekday">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="date">{date.getDate()}</div>
          </div>
          <div className="week-day-events" onClick={() => handleOpenEventModal(date)}>
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-item event-type-${event.eventType}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEventModal(undefined, event);
                }}
              >
                <div className="event-time">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                <div className="event-title">{event.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="calendar-week-view">{days}</div>;
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = [];

    for (let hour = 8; hour < 18; hour++) {
      const hourEvents = dayEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart.getHours() === hour;
      });

      hours.push(
        <div key={`hour-${hour}`} className="day-hour-row">
          <div className="hour-label">
            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </div>
          <div className="hour-events" onClick={() => {
            const date = new Date(currentDate);
            date.setHours(hour, 0, 0, 0);
            handleOpenEventModal(date);
          }}>
            {hourEvents.map(event => (
              <div 
                key={event.id} 
                className={`event-item event-type-${event.eventType}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEventModal(undefined, event);
                }}
              >
                <div className="event-time">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                <div className="event-title">{event.title}</div>
                {event.location && <div className="event-location">{event.location}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <h3>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
        </div>
        <div className="day-hours">{hours}</div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendar</h1>
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
            <button 
              className={`view-button ${view === 'day' ? 'active' : ''}`}
              onClick={() => handleViewChange('day')}
            >
              Day
            </button>
          </div>
          <div className="navigation-controls">
            <button className="nav-button" onClick={handlePrevious}>&lt;</button>
            <button className="today-button" onClick={handleToday}>Today</button>
            <button className="nav-button" onClick={handleNext}>&gt;</button>
          </div>
          <button className="add-event-button" onClick={() => handleOpenEventModal()}>Add Event</button>
        </div>
      </div>

      <div className="calendar-date-display">
        <h2>{formatDate(currentDate)}</h2>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading calendar...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="calendar-view">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      )}

      {showEventModal && (
        <div className="event-modal-overlay">
          <div className="event-modal">
            <div className="event-modal-header">
              <h3>{selectedEvent ? 'Edit Event' : 'New Event'}</h3>
              <button className="close-button" onClick={handleCloseEventModal}>×</button>
            </div>
            <form onSubmit={handleEventSubmit} className="event-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleEventChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newEvent.description}
                  onChange={handleEventChange}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleEventChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleEventChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newEvent.location}
                  onChange={handleEventChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  name="eventType"
                  value={newEvent.eventType}
                  onChange={handleEventChange}
                  required
                >
                  {Object.values(EventType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="caseId">Related Case (optional)</label>
                <input
                  type="text"
                  id="caseId"
                  name="caseId"
                  value={newEvent.caseId}
                  onChange={handleEventChange}
                  placeholder="Enter case ID if applicable"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {selectedEvent ? 'Update Event' : 'Create Event'}
                </button>
                {selectedEvent && (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteEvent}>
                    Delete Event
                  </button>
                )}
                <button type="button" className="btn btn-outline" onClick={handleCloseEventModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;