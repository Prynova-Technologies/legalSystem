import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { createMessage, fetchMessages } from '../store/slices/communicationsSlice';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private token: string | null = null;

  // Initialize socket connection
  initialize(userId: string, token: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.userId = userId;
    this.token = token;

    // Connect to the Socket.IO server with authentication
    this.socket = io('http://localhost:5000', {
      auth: {
        token,
        userId,
        deviceId: this.generateDeviceId()
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.setupEventListeners();
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      // Fetch any messages that were sent while offline
      store.dispatch(fetchMessages() as any);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to chat server after ${attemptNumber} attempts`);
      // Fetch any messages that were sent while offline
      store.dispatch(fetchMessages() as any);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error.message);
    });

    // Listen for new messages
    this.socket.on('new-message', (message) => {
      console.log('New message received:', message);
      // Add message to Redux store
      store.dispatch(createMessage(message));
      // Refresh messages
      store.dispatch(fetchMessages() as any);
    });

    // Listen for message status updates
    this.socket.on('message-status-update', (update) => {
      console.log('Message status update:', update);
      // Update message status in the Redux store
      store.dispatch(fetchMessages() as any);
    });
    
    // Listen for offline messages (messages sent while user was offline)
    this.socket.on('offline-messages', (messages) => {
      console.log('Received offline messages:', messages);
      if (messages && messages.length > 0) {
        // Process each offline message
        messages.forEach((message: any) => {
          store.dispatch(createMessage(message));
        });
        // Refresh all messages
        store.dispatch(fetchMessages() as any);
      }
    });
  }

  // Send a message
  sendMessage(message: any): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('send-message', message);
  }

  // Mark message as read
  markMessageAsRead(messageId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('mark-as-read', { messageId, userId: this.userId });
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Generate a unique device ID
  private generateDeviceId(): string {
    // Check if we already have a device ID in localStorage
    let deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate a simple UUID
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;