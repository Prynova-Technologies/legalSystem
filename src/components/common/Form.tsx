import React, { useState } from 'react';
import { Button } from './index';
import './CommonStyles.css';

export type FormField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'checkbox' | 'number' | 'multiselect' | 'tags';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  multiple?: boolean;
  disabled?: boolean;
  defaultValue?: any;
  conditional?: { field: string; value: any };
};

export type FormSection = {
  title: string;
  fields: FormField[];
};

interface DataFormProps {
  title: string;
  sections: FormSection[];
  onSubmit: (formData: Record<string, any>) => void;
  onCancel?: () => void;
  initialData?: Record<string, any>;
  submitButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  onChange?: Record<string, (value: any) => void>;
}

const DataForm: React.FC<DataFormProps> = ({
  title,
  sections,
  onSubmit,
  onCancel,
  initialData = {},
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  isLoading = false,
  onChange = {}
}) => {
  // Initialize form data with initial values or empty values
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {};
    
    sections?.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'date') {
          if (initialData !== null && initialData[field.id] !== undefined && initialData[field.id] !== null) {
            // Format date string to yyyy-MM-dd if it's a date string or Date object
            const dateValue = initialData[field.id];
            if (dateValue instanceof Date || (typeof dateValue === 'string' && !isNaN(Date.parse(dateValue)))) {
              data[field.id] = new Date(dateValue).toISOString().split('T')[0];
            } else {
              data[field.id] = dateValue;
            }
          } else {
            // Default to today's date in yyyy-MM-dd format
            data[field.id] = new Date().toISOString().split('T')[0];
          }
        } else {
          data[field.id] = initialData && initialData[field.id] !== undefined && initialData[field.id] !== null ? initialData[field.id] : '';
        }
      });
    });
    
    return data;
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when field is changed
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  const handleMultiSelectChange = (fieldId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    handleChange(fieldId, selectedOptions);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        // Check required fields
        if (field.required && !formData[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }
        
        // Run custom validation if provided
        if (field.validation && formData[field.id]) {
          const validationError = field.validation(formData[field.id]);
          if (validationError) {
            newErrors[field.id] = validationError;
          }
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const { id, label, type, placeholder, required, options, disabled, conditional } = field;
    
    // Check if this field should be conditionally shown
    if (conditional && formData[conditional.field] !== conditional.value) {
      return null;
    }
    
    const value = formData[id];
    const error = errors[id];
    
    switch (type) {
      case 'textarea':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <textarea
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={placeholder}
              className={`form-textarea ${error ? 'form-input-error' : ''}`}
              required={required}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'select':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <select
              id={id}
              value={field.multiple ? (Array.isArray(value) ? value : []) : value}
              onChange={(e) => field.multiple ? handleMultiSelectChange(id, e) : handleChange(id, e.target.value)}
              className={`form-select ${error ? 'form-input-error' : ''}`}
              required={required}
              multiple={field.multiple}
              size={field.multiple ? Math.min(options?.length || 5, 5) : undefined}
            >
              {!field.multiple && <option value="">Select {label}</option>}
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.multiple && <div className="form-help-text">Hold Ctrl/Cmd to select multiple options</div>}
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="checkbox-group" key={id} id={`${id}-group`}>
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                checked={value === undefined ? !!field.defaultValue : !!value}
                onChange={(e) => {
                  handleChange(id, e.target.checked)

                  if(field.onChange) {
                    onChange(!value)
                  }
                }}
                className="form-checkbox"
                disabled={disabled}
              />
              {label}
            </label>
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'date':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            {/* {console.log(value)} */}
            <input
              type="date"
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              required={required}
              disabled={disabled}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'datetime-local':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <input
              type="datetime-local"
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              required={required}
              disabled={disabled}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'number':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <input
              type="number"
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={placeholder}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              required={required}
              disabled={disabled}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'tags':
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <div className="tags-input-container">
              <input
                type="text"
                id={`${id}-input`}
                placeholder={placeholder || 'Type and press Enter to add'}
                className={`form-input ${error ? 'form-input-error' : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const newTag = e.currentTarget.value.trim();
                    const currentTags = Array.isArray(value) ? value : value ? value.split(',') : [];
                    if (!currentTags.includes(newTag)) {
                      handleChange(id, [...currentTags, newTag]);
                    }
                    e.currentTarget.value = '';
                  }
                }}
                disabled={disabled}
              />
              <div className="tags-container">
                {(Array.isArray(value) ? value : value ? value.split(',') : []).map((tag, i) => (
                  <div key={i} className="tag">
                    {tag}
                    <button 
                      type="button" 
                      className="tag-remove" 
                      onClick={() => {
                        const currentTags = Array.isArray(value) ? value : value.split(',');
                        handleChange(id, currentTags.filter((_, index) => index !== i));
                      }}
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>
        );
        
      case 'text':
      default:
        return (
          <div className="form-group" key={id} id={`${id}-group`}>
            <label htmlFor={id}>{label}{required && <span className="required-mark">*</span>}</label>
            <input
              type="text"
              id={id}
              value={value}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={placeholder}
              className={`form-input ${error ? 'form-input-error' : ''}`}
              required={required}
              disabled={disabled}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
        );
    }
  };

  return (
    <div className="data-form-container">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit} className="data-form">
        {sections.map((section, index) => (
          <div key={index} className="form-section">
            <h3 className="form-section-title">{section.title}</h3>
            <div className="form-section-content">
              {section.fields.map(field => renderField(field))}
            </div>
          </div>
        ))}
        
        <div className="form-actions">
          {onCancel && (
            <Button 
              variant="secondary" 
              onClick={onCancel} 
              disabled={isLoading}
            >
              {cancelButtonText}
            </Button>
          )}
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : submitButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DataForm;