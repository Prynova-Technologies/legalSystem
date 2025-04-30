import React from 'react';
import './CommonStyles.css';

type StatusType = 
  | 'verified' 
  | 'unverified' 
  | 'pending' 
  | 'cleared' 
  | 'flagged'
  | 'open'
  | 'closed'
  | 'paid'
  | 'overdue'
  | 'draft'
  | 'sent'
  | 'high'
  | 'medium'
  | 'low';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = 'status',
  className = '' 
}) => {
  // Convert status to lowercase and remove spaces for CSS class matching
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  
  // Determine the appropriate CSS class based on status type
  const badgeClass = type === 'priority' 
    ? `priority-${normalizedStatus}` 
    : `status-${normalizedStatus}`;

  return (
    <span className={`status-badge ${badgeClass} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;