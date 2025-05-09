import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateTask } from '../../store/slices/tasksSlice';
import './TaskCard.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate: string;
  assignedTo: User[];
  assignedBy: string;
  onStatusChange?: () => void;
  loading: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  status,
  priority,
  startDate,
  dueDate,
  assignedTo,
  assignedBy,
  onStatusChange,
  loading
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const isAdmin = user?.data?.role === 'admin';
  const isCreator = user?.data?._id === assignedBy;
  const canChangeStatus = isAdmin || isCreator;

  const isOverdue = new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled';

  const handleStatusChange = async (newStatus: string) => {
   await dispatch(updateTask({
      taskId: id,
      taskData: { status: newStatus }
    }) as any);

    onStatusChange();
  };

  return (
    <div className={`task-card priority-${priority} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-card-header">
        <h4 className="task-card-title">{title}</h4>
        <span className={`task-card-status status-${status.replace('_', '-')}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="task-card-description">{description}</p>
      
      <div className="task-card-meta">
        {startDate && (
          <div className="task-card-start-date">
            <span className="meta-label">Start:</span>
            <span className="meta-value">{formatDate(startDate)}</span>
          </div>
        )}
        
        <div className="task-card-due-date">
          <span className="meta-label">Due:</span>
          <span className={`meta-value ${isOverdue ? 'overdue' : ''}`}>{formatDate(dueDate)}</span>
        </div>
        
        <div className="task-card-priority">
          <span className="meta-label">Priority:</span>
          <span className="meta-value">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
        </div>
      </div>

      <div className="task-card-assignees">
        <span className="meta-label">Assigned to:</span>
        <div className="assignee-list">
          {assignedTo.map(user => (
            <span key={user._id} className="assignee-name">
              {user.firstName} {user.lastName}
            </span>
          ))}
        </div>
      </div>
      
      {canChangeStatus &&  
      (status === 'in_progress' || status === 'todo' ?
        <div className="task-card-status-actions">
          <label className="status-checkbox">
            <input 
              type="checkbox" 
              checked={status === 'in_progress'} 
              onChange={() => handleStatusChange('in_progress')} 
            />
            In Progress
          </label>
          <label className="status-checkbox">
            <input 
              type="checkbox" 
              checked={status === 'completed'} 
              onChange={() => handleStatusChange('completed')} 
            />
            Completed
          </label>
          <label className="status-checkbox">
            <input 
              type="checkbox" 
              checked={status === 'cancelled'} 
              onChange={() => handleStatusChange('cancelled')} 
              />
            Cancelled
          </label>
        </div>
        :
        null)
      }
    </div>
  );
};

export default TaskCard;