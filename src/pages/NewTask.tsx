import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewTaskForm } from '../components/forms';

const NewTask: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate('/tasks');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>New Task</h1>
      </div>
      <NewTaskForm onCancel={handleCancel} />
    </div>
  );
};

export default NewTask;