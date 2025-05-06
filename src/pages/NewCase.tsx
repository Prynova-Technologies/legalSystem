import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewCaseForm } from '../components/forms';

const NewCase: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCancel = () => {
    navigate('/cases');
  };

  return (
    <div className="page-container">
      <NewCaseForm onCancel={handleCancel} />
    </div>
  );
};

export default NewCase;