import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  dueDate: string;
  assignedTo: User[];
  onClick?: () => void;
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
  dueDate,
  assignedTo,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/tasks/${id}`);
    }
  };

  const isOverdue = new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled';

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
            <span key={user.id} className="assignee-name">
              {user.firstName} {user.lastName}
            </span>
          ))}
        </div>
      </div>
      
      <button className="task-card-btn" onClick={handleClick}>
        View Details
      </button>
    </div>
  );
};

export default TaskCard;