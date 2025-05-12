import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { createMessage, sendMessage, createNotification } from '../../store/slices/communicationsSlice';
import * as FaIcons from 'react-icons/fa';
import './ChatStyles.css';

interface ChatComponentProps {
  onNewMessage?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ onNewMessage }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const { messages } = useSelector((state: RootState) => state.communications);
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages to only show internal messages
  const internalMessages = messages.filter(msg => msg.type === 'internal_note');

  // Group messages by conversation (sender/recipient pair)
  const conversations = internalMessages.reduce((acc, message) => {
    const otherParty = message.sender === user?.data?.id 
      ? message.recipients[0] 
      : message.sender;
    
    if (!acc[otherParty]) {
      acc[otherParty] = [];
    }
    
    acc[otherParty].push(message);
    return acc;
  }, {} as Record<string, typeof internalMessages>);

  // Sort conversations by most recent message
  const sortedConversations = Object.entries(conversations)
    .sort(([, messagesA], [, messagesB]) => {
      const latestA = messagesA.reduce((latest, msg) => 
        new Date(msg.createdAt) > new Date(latest.createdAt) ? msg : latest, messagesA[0]);
      const latestB = messagesB.reduce((latest, msg) => 
        new Date(msg.createdAt) > new Date(latest.createdAt) ? msg : latest, messagesB[0]);
      
      return new Date(latestB.createdAt).getTime() - new Date(latestA.createdAt).getTime();
    });

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation, messages]);

  // Check for new messages and trigger notification
  useEffect(() => {
    // Check if there are new messages by comparing current count with previous count
    const currentMessageCount = internalMessages.length;
    
    if (previousMessageCount > 0 && currentMessageCount > previousMessageCount) {
      setHasNewMessages(true);
      
      // Create a notification for the new message
      const newMessages = internalMessages.slice(previousMessageCount);
      
      // Only notify for messages sent to the current user
      const messagesToUser = newMessages.filter(msg => 
        msg.recipients.includes(user?.data?.id || '') && msg.sender !== user?.data?.id
      );
      
      if (messagesToUser.length > 0) {
        // Create notification for each new message
        messagesToUser.forEach(message => {
          const senderName = getUserName(message.sender);
          
          // Create notification in Redux store
          dispatch(createNotification({
            type: 'system',
            title: 'New Message',
            message: `${senderName} sent you a message: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`,
            priority: 'medium',
            recipientId: user?.data?.id || '',
            read: false,
            actionRequired: true,
            actionUrl: `/communications`
          }) as any);
          
          // If browser notifications are supported and permitted, show a notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New Message from " + senderName, {
              body: message.content.substring(0, 60) + (message.content.length > 60 ? '...' : ''),
              icon: '/logo192.png'
            });
          }
          
          // Call the onNewMessage callback if provided
          if (onNewMessage) onNewMessage();
        });
      }
    }
    
    // Update previous message count
    setPreviousMessageCount(currentMessageCount);
  }, [internalMessages.length, dispatch, user?.data?.id, previousMessageCount, onNewMessage, internalMessages]);
  
  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser) return;
    
    const messageData = {
      type: 'internal_note' as const,
      content: newMessage,
      sender: user?.data?.id || '',
      recipients: [selectedUser],
      status: 'sent' as const,
    };
    
    dispatch(createMessage(messageData) as any)
      .then((result: any) => {
        if (result.payload) {
          dispatch(sendMessage(result.payload.id) as any);
          if (onNewMessage) onNewMessage();
        }
      });
    
    setNewMessage('');
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setActiveConversation(userId);
    
    // Mark messages from this user as read
    const userMessages = conversations[userId] || [];
    const unreadMessages = userMessages.filter(msg => 
      msg.sender === userId && (!msg.readBy || !msg.readBy.includes(user?.data?.id || ''))
    );
    
    // Update readBy for each unread message
    unreadMessages.forEach(message => {
      const updatedReadBy = message.readBy ? [...message.readBy, user?.data?.id] : [user?.data?.id];
      // In a real application, you would dispatch an action to update the message in the backend
      // For now, we're just updating the local state
      message.readBy = updatedReadBy;
    });
    
    // Reset new message notification for this conversation
    if (hasNewMessages) {
      setHasNewMessages(false);
    }
  };

  const getUserName = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    return userObj ? `${userObj.firstName} ${userObj.lastName}` : 'Unknown User';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Conversations</h3>
        </div>
        <div className="chat-users-list">
          {sortedConversations.length > 0 ? (
            sortedConversations.map(([userId, userMessages]) => {
              const latestMessage = userMessages.reduce((latest, msg) => 
                new Date(msg.createdAt) > new Date(latest.createdAt) ? msg : latest, userMessages[0]);
              const unreadCount = userMessages.filter(msg => 
                msg.sender !== user?.data?.id && (!msg.readBy || !msg.readBy.includes(user?.data?.id || ''))
              ).length;
              
              return (
                <div 
                  key={userId} 
                  className={`chat-user-item ${activeConversation === userId ? 'active' : ''}`}
                  onClick={() => handleUserSelect(userId)}
                >
                  <div className="chat-user-avatar">
                    <FaIcons.FaUserCircle />
                  </div>
                  <div className="chat-user-info">
                    <div className="chat-user-name">{getUserName(userId)}</div>
                    <div className="chat-last-message">{latestMessage.content.substring(0, 30)}{latestMessage.content.length > 30 ? '...' : ''}</div>
                  </div>
                  {unreadCount > 0 && (
                    <div className="chat-unread-badge" title={`${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}>
                      {unreadCount}
                      <span className="notification-dot"></span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="chat-empty-state">No conversations yet</div>
          )}
        </div>
      </div>
      
      <div className="chat-main">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <h3>{getUserName(activeConversation)}</h3>
            </div>
            
            <div className="chat-messages">
              {conversations[activeConversation]?.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              ).map(message => (
                <div 
                  key={message.id} 
                  className={`chat-message ${message.sender === user?.data?.id ? 'sent' : 'received'}`}
                >
                  <div className="chat-message-content">{message.content}</div>
                  <div className="chat-message-time">{formatTime(message.createdAt)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="chat-input"
              />
              <button type="submit" className="chat-send-button">
                <FaIcons.FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <FaIcons.FaComments className="chat-empty-icon" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;