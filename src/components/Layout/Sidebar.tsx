import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { UserRole } from '../../types';
import * as FaIcons from 'react-icons/fa';
import './Sidebar.css';
import './Layout.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { messages } = useSelector((state: RootState) => state.communications);
  
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  const isAdmin = user?.role === UserRole.ADMIN;
  
  // Calculate unread message count
  useEffect(() => {
    if (user && messages.length > 0) {
      // Filter for internal messages sent to the current user that haven't been read
      const unreadMessages = messages.filter(msg => 
        msg.type === 'internal_note' && 
        msg.recipients.includes(user.data?.id || '') && 
        msg.sender !== user.data?.id && 
        (!msg.readBy || !msg.readBy.includes(user.data?.id || ''))
      );
      
      setUnreadMessageCount(unreadMessages.length);
    }
  }, [messages, user]);

  const menuItems = [
    { path: '/', label: 'DASHBOARD', icon: <FaIcons.FaHome /> },
    { path: '/cases', label: 'CASES', icon: <FaIcons.FaGavel /> },
    { path: '/clients', label: 'CLIENTS', icon: <FaIcons.FaUsers /> },
    { path: '/tasks', label: 'TASKS', icon: <FaIcons.FaTasks /> },
    { path: '/documents', label: 'DOCUMENTS', icon: <FaIcons.FaFileAlt /> },
    { path: '/communications', label: 'COMMUNICATIONS', icon: <FaIcons.FaComments /> },
    { path: '/billing', label: 'BILLING', icon: <FaIcons.FaFileInvoiceDollar /> },
    { path: '/reports', label: 'REPORTS', icon: <FaIcons.FaChartBar /> },
    { path: '/settings', label: 'SETTINGS', icon: <FaIcons.FaCog /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ABENA</h1>
        <p>LEGAL CASE MANAGEMENT</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <FaIcons.FaUserCircle className="user-avatar" />
          <div className="user-details">
            <span className="user-name">{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
            <span className="user-role">{user?.role || 'Role'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;