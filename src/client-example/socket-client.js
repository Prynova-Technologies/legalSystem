/**
 * Example client-side implementation for Socket.IO integration
 * This demonstrates how to connect to the server and handle real-time device tracking events
 */

// Import Socket.IO client library
// In a real frontend project, you would use: import { io } from 'socket.io-client';

const connectToSocket = (token, userId, deviceId) => {
  // Connect to the Socket.IO server with authentication
  const socket = io('http://localhost:5000', {
    auth: {
      token,      // JWT token for authentication
      userId,     // User ID for tracking
      deviceId    // Current device ID
    }
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    
    // Request active sessions immediately after connection
    socket.emit('get-active-sessions');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  // Device tracking events
  socket.on('active-sessions', (sessions) => {
    console.log('Active sessions:', sessions);
    
    // Update UI with active sessions
    updateSessionsUI(sessions);
  });

  socket.on('new-device-login', (data) => {
    console.log('New device login detected:', data);
    
    // Show notification to user
    showNotification('New Login', `New login detected from ${data.deviceInfo.deviceType || 'unknown device'} at ${new Date(data.timestamp).toLocaleString()}`);
    
    // Refresh sessions list
    socket.emit('get-active-sessions');
  });

  socket.on('session-ended', (data) => {
    console.log('Session ended:', data);
    
    // Refresh sessions list
    socket.emit('get-active-sessions');
  });

  socket.on('sessions-ended', (data) => {
    console.log('Multiple sessions ended:', data);
    
    // Show notification to user
    showNotification('Sessions Ended', data.message);
    
    // Refresh sessions list
    socket.emit('get-active-sessions');
  });

  socket.on('suspicious-activity', (data) => {
    console.log('Suspicious activity detected:', data);
    
    // Show critical security notification
    showSecurityAlert('Security Alert', 
      `Suspicious login activity detected from ${data.details.uniqueIPs} different locations. ` +
      'Please review your active sessions and secure your account if needed.');
  });

  return socket;
};

// Example UI update functions
const updateSessionsUI = (sessions) => {
  const sessionsContainer = document.getElementById('active-sessions');
  if (!sessionsContainer) return;
  
  sessionsContainer.innerHTML = '';
  
  if (sessions.length === 0) {
    sessionsContainer.innerHTML = '<p>No active sessions</p>';
    return;
  }
  
  sessions.forEach(session => {
    const sessionElement = document.createElement('div');
    sessionElement.className = 'session-item';
    
    const deviceInfo = session.deviceInfo;
    const lastActive = new Date(session.lastActive).toLocaleString();
    
    sessionElement.innerHTML = `
      <div class="device-info">
        <strong>${deviceInfo.deviceType || 'Unknown device'}</strong>
        <span>${deviceInfo.browser || ''} on ${deviceInfo.os || 'unknown OS'}</span>
      </div>
      <div class="session-details">
        <span>IP: ${deviceInfo.ip}</span>
        <span>Last active: ${lastActive}</span>
      </div>
      <button class="end-session-btn" data-device-id="${deviceInfo.deviceId}">End Session</button>
    `;
    
    sessionsContainer.appendChild(sessionElement);
  });
  
  // Add event listeners to end session buttons
  document.querySelectorAll('.end-session-btn').forEach(button => {
    button.addEventListener('click', () => {
      const deviceId = button.getAttribute('data-device-id');
      endSession(deviceId);
    });
  });
};

const showNotification = (title, message) => {
  // In a real app, you would use a proper notification system
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <h4>${title}</h4>
    <p>${message}</p>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
};

const showSecurityAlert = (title, message) => {
  // In a real app, you would use a more prominent alert system
  const alert = document.createElement('div');
  alert.className = 'security-alert';
  alert.innerHTML = `
    <h4>${title}</h4>
    <p>${message}</p>
    <button id="review-sessions-btn">Review Sessions</button>
    <button id="dismiss-alert-btn">Dismiss</button>
  `;
  
  document.body.appendChild(alert);
  
  // Add event listeners
  document.getElementById('review-sessions-btn').addEventListener('click', () => {
    // Navigate to sessions page or open sessions modal
    alert.remove();
    // Example: window.location.href = '/account/sessions';
  });
  
  document.getElementById('dismiss-alert-btn').addEventListener('click', () => {
    alert.remove();
  });
};

// Example function to end a session
const endSession = async (deviceId) => {
  try {
    const response = await fetch('/api/device-sessions/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Function to get stored auth token
      },
      body: JSON.stringify({ deviceId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Session ended successfully');
      // The socket will receive a session-ended event and update the UI
    } else {
      console.error('Failed to end session:', data.message);
    }
  } catch (error) {
    console.error('Error ending session:', error);
  }
};

// Example function to end all other sessions
const endAllOtherSessions = async () => {
  try {
    const response = await fetch('/api/device-sessions/end-all-other', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Function to get stored auth token
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('All other sessions ended successfully');
      // The socket will receive a sessions-ended event and update the UI
    } else {
      console.error('Failed to end other sessions:', data.message);
    }
  } catch (error) {
    console.error('Error ending other sessions:', error);
  }
};

// Helper function to get auth token
const getAuthToken = () => {
  // In a real app, you would retrieve this from localStorage, cookies, etc.
  return localStorage.getItem('authToken');
};

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = getAuthToken();
  const userId = localStorage.getItem('userId');
  const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
  
  if (token && userId) {
    // Connect to socket server
    const socket = connectToSocket(token, userId, deviceId);
    
    // Store socket instance for later use
    window.appSocket = socket;
    
    // Set up UI event listeners
    const endAllBtn = document.getElementById('end-all-sessions-btn');
    if (endAllBtn) {
      endAllBtn.addEventListener('click', endAllOtherSessions);
    }
  }
});

// Generate a simple device ID if none exists
const generateDeviceId = () => {
  const deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
};