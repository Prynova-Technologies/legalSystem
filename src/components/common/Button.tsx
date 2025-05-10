import React from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

export interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Button variant - determines color scheme */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'text' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Optional click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Optional link destination if button should act as a link */
  to?: string;
  /** Additional CSS class names */
  className?: string;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button should display a loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  startIcon?: React.ReactNode;
  /** Icon to display after text */
  endIcon?: React.ReactNode;
  /** Additional props */
  [x: string]: any;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'small',
  onClick,
  to,
  className = '',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  ...rest
}) => {
  // Construct class names based on props
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // If 'to' prop is provided, render as Link component
  if (to) {
    return (
      <Link to={to} className={buttonClasses} {...rest}>
        {startIcon && <span className="btn-icon btn-icon-start">{startIcon}</span>}
        {children}
        {endIcon && <span className="btn-icon btn-icon-end">{endIcon}</span>}
      </Link>
    );
  }

  // Otherwise render as button element
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {startIcon && <span className="btn-icon btn-icon-start">{startIcon}</span>}
      {loading ? <span className="btn-spinner"></span> : children}
      {endIcon && <span className="btn-icon btn-icon-end">{endIcon}</span>}
    </button>
  );
};

export default Button;