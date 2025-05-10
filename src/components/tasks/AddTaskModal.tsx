import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Modal } from '../common';
import { addCaseTaskAsync, fetchCases } from '../../store/slices/casesSlice';
import { createTask } from '../../store/slices/tasksSlice';
import FormStyles from '../forms/FormStyles.css'
import { useLocation } from 'react-router-dom';
import './TaskStyles.css';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onTaskAdded?: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, caseId, onTaskAdded }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const { cases } = useSelector((state: RootState) => state.cases);
  const location = useLocation();
  
  // Check if we're on the Tasks page (no caseId provided)
  const isTasksPage = !caseId && location.pathname.includes('/tasks');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [] as string[],
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    billable: true,
    notes: '',
    caseId: ''
  });
  
  // For case search functionality
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (isTasksPage) {
      // Fetch cases when modal is opened on Tasks page
      dispatch(fetchCases() as any);
    }
  }, [isOpen, isTasksPage, dispatch]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: [] as string[],
      priority: 'medium',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      billable: true,
      notes: '',
      caseId: ''
    });
    setCaseSearchTerm('');
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else if (name === 'assignedTo' && type === 'select-multiple') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
      setFormData({
        ...formData,
        assignedTo: selectedOptions
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle case search input change
  const handleCaseSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaseSearchTerm(e.target.value);
  };
  
  // Handle case selection
  const handleCaseSelect = (caseId: string) => {
    setFormData({
      ...formData,
      caseId
    });
    setCaseSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Task title is required');
      return;
    }

    if (!formData.description) {
      setError('Task description is required');
      return;
    }

    if (formData.assignedTo.length === 0) {
      setError('Please assign this task to at least one user');
      return;
    }

    if (!formData.dueDate) {
      setError('Due date is required');
      return;
    }
    
    if (isTasksPage && !formData.caseId) {
      setError('Please select a case for this task');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const taskData = {
        title: formData.title,
        description: formData.description,
        ...(caseId ? { caseId } : {}),
        ...(isTasksPage && formData.caseId ? { caseId: formData.caseId } : {}),
        assignedTo: formData.assignedTo,
        assignedBy: user?.data?._id || '',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        dueDate: new Date(formData.dueDate).toISOString(),
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        billable: formData.billable,
        notes: formData.notes || undefined
      };

      if (caseId) {
        await dispatch(addCaseTaskAsync({ caseId, taskData }) as any);
      } else if (isTasksPage && formData.caseId) {
        await dispatch(addCaseTaskAsync({ caseId: formData.caseId, taskData }) as any);
      } else {
        await dispatch(createTask(taskData) as any);
      }
      
      if (onTaskAdded) {
        onTaskAdded();
      }
      
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <>
      <button 
        type="button" 
        className="btn btn-outline" 
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Task"
      footer={modalFooter}
      size="medium"
    >
      <form className="form-container">
        {error && <div className="error-message">{error}</div>}
        
        {isTasksPage && (
          <div className="form-group">
            <label htmlFor="caseSearch">Select Case *</label>
            <div className="case-search-container">
              <input
                type="text"
                id="caseSearch"
                placeholder="Search for a case..."
                value={caseSearchTerm}
                onChange={handleCaseSearchChange}
                className="case-search-input"
              />
              {caseSearchTerm && (
                <div className="case-search-results">
                  {cases
                    .filter(c => 
                      c.title.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
                      c.caseNumber.toLowerCase().includes(caseSearchTerm.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(c => (
                      <div 
                        key={c.id} 
                        className="case-search-item"
                        onClick={() => handleCaseSelect(c.id)}
                      >
                        {c.caseNumber}: {c.title}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            {formData.caseId && (
              <div className="selected-case">
                Selected: {cases.find(c => c.id === formData.caseId)?.title || 'Unknown Case'}
              </div>
            )}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="assignedTo">Assigned To * (Hold Ctrl/Cmd to select multiple)</label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            required
            multiple
            size={4}
            className="multi-select"
          >
            {users && users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dueDate">Due Date *</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="estimatedHours">Estimated Hours</label>
          <input
            type="number"
            id="estimatedHours"
            name="estimatedHours"
            value={formData.estimatedHours}
            onChange={handleChange}
            min="0"
            step="0.5"
          />
        </div>
        
        <div style={{display: 'flex', flexDirection: 'row', marginBottom: 10, fontWeight: 500, color: '#4a5568', fontSize: '0.9rem'}}>
          <input
            type="checkbox"
            id="billable"
            name="billable"
            checked={formData.billable}
            onChange={handleChange}
          />
          <label htmlFor="billable">Billable</label>
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;