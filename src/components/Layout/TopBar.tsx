import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import * as FaIcons from 'react-icons/fa';
import './Layout.css';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const _handleLogout = async () => {
    await logout()
    navigate('/login')
  }

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
            <span className="user-name">{user ? `${user.data.firstName} ${user.data.lastName}` : 'User'}</span>
            <span className="user-role">{user?.role || 'Role'}</span>
          </div>
        </div>

        <div className="notification-icon" onClick={() => _handleLogout()}>
          <FaIcons.FaUserLock className="log-out" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;