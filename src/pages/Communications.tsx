import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchMessages } from '../store/slices/communicationsSlice';
import ChatComponent from '../components/communications/ChatComponent';
import '../components/common/CommonStyles.css';
import socketService from '../services/socket.service';

const Communications: React.FC = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(
    (state: RootState) => state.communications
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchMessages() as any);
    
    // Initialize socket connection when component mounts
    if (user?.data?.id && user?.token) {
      socketService.initialize(user.data.id, user.token);
    }
    
    // Clean up socket connection when component unmounts
    return () => {
      socketService.disconnect();
    };
  }, [dispatch, user]);

  const handleRefreshMessages = () => {
    dispatch(fetchMessages() as any);
  };

  return (
    <div className="communications-container">
      <div className="page-header">
        <h1>Team Chat</h1>
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading chat messages...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="chat-content">
          <ChatComponent 
            onNewMessage={handleRefreshMessages}
          />
        </div>
      )}
    </div>
  );
};

export default Communications;