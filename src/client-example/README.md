# Real-Time Device Tracking with Socket.IO

This implementation adds real-time communication capabilities to the law firm management system, focusing on device tracking and session management. It allows for instant notifications about device logins, session changes, and suspicious activities.

## Features

- Real-time device session tracking
- Instant notifications for new device logins
- Real-time updates when sessions are ended
- Alerts for suspicious login activities
- Secure socket connections with authentication

## Implementation Details

### Backend Components

1. **Socket Service (`socket.service.ts`)**
   - Initializes Socket.IO server
   - Handles authentication and connection management
   - Tracks user connections across multiple devices
   - Provides methods for emitting events to specific users or all users

2. **Device Tracking Service (`deviceTracking.service.ts`)**
   - Enhanced with real-time notification capabilities
   - Emits events when new devices connect
   - Notifies users when sessions are ended
   - Detects and alerts about suspicious login activities

3. **Device Session Controller (`deviceSession.controller.ts`)**
   - Integrated with Socket.IO for real-time updates
   - Provides REST API endpoints for session management
   - Emits socket events when sessions change

### Frontend Example

The `client-example` directory contains a demonstration of how to implement the client-side of this real-time communication:

- `socket-client.js`: JavaScript implementation for connecting to the Socket.IO server and handling events
- `index.html`: Example UI for displaying active sessions and notifications

## How to Use

### Server Setup

The Socket.IO server is automatically initialized when the Express application starts. No additional configuration is needed.

### Client Integration

1. Include the Socket.IO client library in your frontend application:

```html
<script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
```

2. Connect to the Socket.IO server with authentication:

```javascript
const socket = io('http://your-server-url', {
  auth: {
    token: 'your-jwt-token',
    userId: 'user-id',
    deviceId: 'device-id'
  }
});
```

3. Listen for real-time events:

```javascript
// New device login
socket.on('new-device-login', (data) => {
  console.log('New device login detected:', data);
  // Show notification to user
});

// Session ended
socket.on('session-ended', (data) => {
  console.log('Session ended:', data);
  // Update UI
});

// Suspicious activity
socket.on('suspicious-activity', (data) => {
  console.log('Suspicious activity detected:', data);
  // Show security alert
});
```

## Security Considerations

- Socket connections are authenticated using JWT tokens
- Device information is validated on connection
- Suspicious login detection helps identify potential security threats
- Users are notified in real-time about new device logins

## Testing

You can test the real-time functionality using the example client implementation:

1. Start the server: `npm run dev`
2. Open the example client: `src/client-example/index.html`
3. The example includes simulations of various events for demonstration purposes

## Future Enhancements

- Add support for real-time chat between users
- Implement real-time notifications for case updates
- Add real-time document collaboration features
- Enhance suspicious activity detection with machine learning