import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { createMessage, sendMessage } from '../../store/slices/communicationsSlice';
import * as FaIcons from 'react-icons/fa';
import './ChatStyles.css';

interface InternalChatProps {
  onNewMessage?: () => void;
}

const InternalChat: React.FC<InternalChatProps> = ({ onNewMessage }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const { messages } = useSelector((state: RootState) => state.communications);
  
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
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

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUser && user?.data?.id) {
      const userMessages = conversations[selectedUser] || [];
      const unreadMessages = userMessages.filter(msg => 
        msg.sender === selectedUser && (!msg.readBy || !msg.readBy.includes(user.data?.id || ''))
      );
      
      // Update readBy for each unread message
      unreadMessages.forEach(message => {
        const updatedReadBy = message.readBy ? [...message.readBy, user.data?.id] : [user.data?.id];
        // In a real application, you would dispatch an action to update the message in the backend
        // For now, we're just updating the local state
        message.readBy = updatedReadBy;
      });
    }
  }, [selectedUser, conversations, user?.data?.id]);

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
  };

  const getUserName = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    return userObj ? `${userObj.firstName} ${userObj.lastName}` : 'Unknown User';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Team Messages</h3>
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
                    <div className="chat-unread-badge">{unreadCount}</div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="chat-empty-state">
              <p>No conversations yet</p>
            </div>
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
              ).map(message => {
                const isCurrentUser = message.sender === user?.data?.id;
                return (
                  <div 
                    key={message.id} 
                    className={`chat-message ${isCurrentUser ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..."
              />
              <button type="submit">
                <FaIcons.FaPaperPlane />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <FaIcons.FaComments className="empty-icon" />
            <h3>Select a conversation</h3>
            <p>Choose a team member to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalChat;