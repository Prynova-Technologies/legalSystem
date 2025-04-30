import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { UserRole } from '../../types';
import * as FaIcons from 'react-icons/fa';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const isAdmin = user?.role === UserRole.ADMIN;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <FaIcons.FaHome /> },
    { path: '/cases', label: 'Cases', icon: <FaIcons.FaGavel /> },
    { path: '/clients', label: 'Clients', icon: <FaIcons.FaUsers /> },
    { path: '/calendar', label: 'Calendar', icon: <FaIcons.FaCalendarAlt /> },
    { path: '/tasks', label: 'Tasks', icon: <FaIcons.FaTasks /> },
    { path: '/documents', label: 'Documents', icon: <FaIcons.FaFileAlt /> },
    { path: '/communications', label: 'Communications', icon: <FaIcons.FaComments /> },
    { path: '/billing', label: 'Billing', icon: <FaIcons.FaFileInvoiceDollar /> },
    { path: '/reports', label: 'Reports', icon: <FaIcons.FaChartBar /> },
    { path: '/settings', label: 'Settings', icon: <FaIcons.FaCog /> },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Abena</h1>
          <p>Legal Case Management</p>
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
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role || 'Role'}</span>
            </div>
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;