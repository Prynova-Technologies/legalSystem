import React from 'react';
import './CommonStyles.css';

interface ToggleProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label = '',
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`toggle-container ${className}`}>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
      {label && <span className="toggle-label">{label}</span>}
    </div>
  );
};

export default Toggle;