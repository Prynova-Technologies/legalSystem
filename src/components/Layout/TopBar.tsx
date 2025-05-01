import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import * as FaIcons from 'react-icons/fa';
import './Layout.css';

const TopBar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="top-bar">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
        />
      </div>
      <div className="top-bar-actions">
        <div className="notification-icon">
          <FaIcons.FaBell />
          <span className="notification-badge">3</span>
        </div>
        <div className="user-info">
          <FaIcons.FaUserCircle className="user-avatar" />
          <div className="user-details">
            <span className="user-name">{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
            <span className="user-role">{user?.role || 'Role'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;