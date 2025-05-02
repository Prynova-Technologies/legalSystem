import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewClientForm } from '../components/forms';

const NewClient: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate('/clients');
  };

  return (
    <div>
      <div className="page-header">
        <h1>New Client</h1>
      </div>
      <NewClientForm onCancel={handleCancel} />
    </div>
  );
};

export default NewClient;