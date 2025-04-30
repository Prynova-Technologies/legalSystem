import React, { ReactNode } from 'react';
import './CommonStyles.css';

interface DetailItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

interface DetailSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

interface DetailViewProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Detail Item Component
export const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = '' }) => {
  return (
    <div className={`detail-item ${className}`}>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
};

// Detail Section Component
export const DetailSection: React.FC<DetailSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`detail-section ${className}`}>
      {title && <h3 className="detail-section-title">{title}</h3>}
      <div className="detail-grid">{children}</div>
    </div>
  );
};

// Main Detail View Component
const DetailView: React.FC<DetailViewProps> = ({ title, actions, children, className = '' }) => {
  return (
    <div className={`detail-container ${className}`}>
      <div className="detail-header">
        <h2 className="detail-title">{title}</h2>
        {actions && <div className="detail-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default DetailView;