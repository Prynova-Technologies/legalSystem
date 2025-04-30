import React, { useState } from 'react';
import './CommonStyles.css';
import * as FaIcons from 'react-icons/fa';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  showLabel?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  label,
  placeholder = 'Select date',
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  minDate,
  maxDate,
  showLabel = true,
}) => {
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    
    // Format as YYYY-MM-DD for input[type="date"]
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      onChange(newDate);
    }
  };

  return (
    <div className={`form-group ${className}`}>
      {showLabel && label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="date-picker-container">
        <input
          type="date"
          id={id}
          name={name}
          value={formatDateForInput(selectedDate)}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className="date-picker-input"
          min={minDate ? formatDateForInput(minDate) : undefined}
          max={maxDate ? formatDateForInput(maxDate) : undefined}
          required={required}
        />
        <span className="date-picker-icon">
          <FaIcons.FaCalendarAlt />
        </span>
      </div>
    </div>
  );
};

export default DatePicker;