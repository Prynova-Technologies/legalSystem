import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { UserRole } from '../../types';
import * as FaIcons from 'react-icons/fa';
import './Layout.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const isAdmin = user?.role === UserRole.ADMIN;

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