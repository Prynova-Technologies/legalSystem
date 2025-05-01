import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  updateSecuritySettings,
  toggleTwoFactorAuth,
  fetchAuditLogs
} from '../store/slices/securitySlice';
import { UserRole } from '../types';
import { Tabs, Button, StatusBadge, DataTable } from '../components/common';
import * as FaIcons from 'react-icons/fa';
import '../components/common/CommonStyles.css';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const { securitySettings, twoFactorEnabled, dataEncryptionEnabled, isLoading, error } = 
    useSelector((state: RootState) => state.security);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState('security');
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90
  });
  const [sessionTimeout, setSessionTimeout] = useState(30); // minutes
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  useEffect(() => {
    // Instead of fetchSecuritySettings, we'll use the existing security settings from the state
    // If we needed to fetch them, we would create a new thunk in the securitySlice
  }, [dispatch]);

  useEffect(() => {
    if (securitySettings) {
      setPasswordPolicy(securitySettings.passwordPolicy);
      setSessionTimeout(securitySettings.sessionTimeout);
      setMaxLoginAttempts(securitySettings.maxLoginAttempts);
    }
  }, [securitySettings]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handlePasswordPolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPasswordPolicy({
      ...passwordPolicy,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    });
  };

  const handleSessionTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionTimeout(parseInt(e.target.value));
  };

  const handleMaxLoginAttemptsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxLoginAttempts(parseInt(e.target.value));
  };

  const handleSavePasswordPolicy = () => {
    dispatch(updateSecuritySettings({ passwordPolicy }) as any);
  };

  const handleSaveSessionTimeout = () => {
    dispatch(updateSecuritySettings({ sessionTimeout }) as any);
  };

  const handleSaveMaxLoginAttempts = () => {
    dispatch(updateSecuritySettings({ maxLoginAttempts }) as any);
  };

  const handleToggleTwoFactor = () => {
    dispatch(toggleTwoFactorAuth(!twoFactorEnabled) as any);
  };

  const handleToggleDataEncryption = () => {
    // Use updateSecuritySettings instead of toggleDataEncryption
    dispatch(updateSecuritySettings({ dataEncryptionEnabled: !dataEncryptionEnabled }) as any);
  };

  const renderSecurityTab = () => (
    <div className="settings-section">
      <h2>Security Settings</h2>
      
      <div className="settings-card">
        <h3>Password Policy</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Minimum Password Length</label>
            <input 
              type="number" 
              name="minLength" 
              value={passwordPolicy.minLength} 
              onChange={handlePasswordPolicyChange} 
              min="6" 
              max="20" 
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="requireUppercase" 
                checked={passwordPolicy.requireUppercase} 
                onChange={handlePasswordPolicyChange} 
              />
              Require Uppercase Letters
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="requireLowercase" 
                checked={passwordPolicy.requireLowercase} 
                onChange={handlePasswordPolicyChange} 
              />
              Require Lowercase Letters
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="requireNumbers" 
                checked={passwordPolicy.requireNumbers} 
                onChange={handlePasswordPolicyChange} 
              />
              Require Numbers
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="requireSpecialChars" 
                checked={passwordPolicy.requireSpecialChars} 
                onChange={handlePasswordPolicyChange} 
              />
              Require Special Characters
            </label>
          </div>
          
          <div className="form-group">
            <label>Password Expiry (days)</label>
            <input 
              type="number" 
              name="expiryDays" 
              value={passwordPolicy.expiryDays} 
              onChange={handlePasswordPolicyChange} 
              min="0" 
              max="365" 
            />
            <span className="form-hint">Set to 0 for no expiry</span>
          </div>
          
          <Button variant="primary" onClick={handleSavePasswordPolicy}>
            Save Password Policy
          </Button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Session Settings</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Session Timeout (minutes)</label>
            <input 
              type="number" 
              value={sessionTimeout} 
              onChange={handleSessionTimeoutChange} 
              min="5" 
              max="240" 
            />
          </div>
          
          <Button variant="primary" onClick={handleSaveSessionTimeout}>
            Save Session Timeout
          </Button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Login Security</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Maximum Login Attempts</label>
            <input 
              type="number" 
              value={maxLoginAttempts} 
              onChange={handleMaxLoginAttemptsChange} 
              min="1" 
              max="10" 
            />
          </div>
          
          <Button variant="primary" onClick={handleSaveMaxLoginAttempts}>
            Save Login Attempts
          </Button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Two-Factor Authentication</h3>
        <div className="settings-form">
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={twoFactorEnabled} 
                onChange={handleToggleTwoFactor} 
              />
              Enable Two-Factor Authentication
            </label>
            <span className="form-hint">Adds an extra layer of security to your account</span>
          </div>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Data Encryption</h3>
        <div className="settings-form">
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={dataEncryptionEnabled} 
                onChange={handleToggleDataEncryption} 
              />
              Enable Data Encryption
            </label>
            <span className="form-hint">Encrypts sensitive client and case data</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagementTab = () => (
    <div className="settings-section">
      <h2>User Management</h2>
      
      <div className="settings-card">
        <h3>User Roles & Permissions</h3>
        <DataTable
          columns={[
            { header: 'Role', accessor: 'role' },
            { header: 'Description', accessor: 'description' },
            { header: 'Access Level', accessor: 'accessLevel' }
          ]}
          data={[
            {
              role: 'Administrator',
              description: 'Full system access with ability to manage users and settings',
              accessLevel: 'Full Access'
            },
            {
              role: 'Lawyer',
              description: 'Can manage cases, clients, documents, and billing',
              accessLevel: 'High Access'
            },
            {
              role: 'Paralegal',
              description: 'Can view cases and clients, manage documents',
              accessLevel: 'Medium Access'
            },
            {
              role: 'Assistant',
              description: 'Limited access to cases and documents',
              accessLevel: 'Low Access'
            },
            {
              role: 'Client',
              description: 'Can only view their own cases and documents',
              accessLevel: 'Restricted Access'
            }
          ]}
          striped={true}
          bordered={true}
        />
        
        <div className="action-buttons">
          <Button variant="primary">Manage Users</Button>
          <Button variant="secondary">Edit Permissions</Button>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="settings-section">
      <h2>System Settings</h2>
      
      <div className="settings-card">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">System Version</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Backup</span>
            <span className="info-value">Never</span>
          </div>
          <div className="info-item">
            <span className="info-label">Database Size</span>
            <span className="info-value">0 MB</span>
          </div>
          <div className="info-item">
            <span className="info-label">Storage Usage</span>
            <span className="info-value">0 MB / 1 GB</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <Button variant="primary">Backup System</Button>
          <Button variant="secondary">System Logs</Button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Integrations</h3>
        <div className="integrations-list">
          <div className="integration-item">
            <div className="integration-info">
              <h4>Email Integration</h4>
              <p>Connect your email service to send notifications and client communications</p>
            </div>
            <div className="integration-status">
              <span className="status-badge status-disabled">Not Connected</span>
              <Button variant="secondary" size="small">Configure</Button>
            </div>
          </div>
          
          <div className="integration-item">
            <div className="integration-info">
              <h4>Calendar Integration</h4>
              <p>Sync with external calendar services</p>
            </div>
            <div className="integration-status">
              <span className="status-badge status-disabled">Not Connected</span>
              <Button variant="secondary" size="small">Configure</Button>
            </div>
          </div>
          
          <div className="integration-item">
            <div className="integration-info">
              <h4>Document Storage</h4>
              <p>Connect to cloud storage providers</p>
            </div>
            <div className="integration-status">
              <span className="status-badge status-disabled">Not Connected</span>
              <Button variant="secondary" size="small">Configure</Button>
            </div>
          </div>
          
          <div className="integration-item">
            <div className="integration-info">
              <h4>Payment Gateway</h4>
              <p>Connect payment processors for client billing</p>
            </div>
            <div className="integration-status">
              <span className="status-badge status-disabled">Not Connected</span>
              <Button variant="secondary" size="small">Configure</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="settings-section">
      <h2>User Preferences</h2>
      
      <div className="settings-card">
        <h3>Display Settings</h3>
        <div className="settings-form">
          <div className="form-group">
            <label>Theme</label>
            <select defaultValue="light">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Date Format</label>
            <select defaultValue="mm/dd/yyyy">
              <option value="mm/dd/yyyy">MM/DD/YYYY</option>
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Time Format</label>
            <select defaultValue="12h">
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
          
          <Button variant="primary">Save Preferences</Button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Notification Settings</h3>
        <div className="settings-form">
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" defaultChecked />
              Email Notifications
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" defaultChecked />
              In-App Notifications
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" defaultChecked />
              Task Reminders
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" defaultChecked />
              Calendar Event Alerts
            </label>
          </div>
          
          <Button variant="primary">Save Notification Settings</Button>
        </div>
      </div>
    </div>
  );

  // Only show certain tabs based on user role
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="settings-container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">Loading settings...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="settings-layout">
          <div className="settings-tabs-container">
            <Tabs
              tabs={[
                { id: 'security', label: 'Security', icon: <FaIcons.FaShieldAlt /> },
                ...(isAdmin ? [{ id: 'user-management', label: 'User Management', icon: <FaIcons.FaUsers /> }] : []),
                ...(isAdmin ? [{ id: 'system', label: 'System', icon: <FaIcons.FaCogs /> }] : []),
                { id: 'preferences', label: 'Preferences', icon: <FaIcons.FaUserCog /> }
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="default"
            />
          </div>
          <div className="settings-content">
            <div className="tab-content">
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'user-management' && isAdmin && renderUserManagementTab()}
              {activeTab === 'system' && isAdmin && renderSystemTab()}
              {activeTab === 'preferences' && renderPreferencesTab()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;