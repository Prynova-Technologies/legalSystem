import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import { RootState } from '../store';
import authService from '../services/authService';
import './Login.css';

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data before submitting
      if (!formData.email || !formData.password) {
        return; // Form validation will handle this
      }
      
      // Use the real login from authSlice which now uses authService
      const resultAction = await dispatch(login({
        email: formData.email,
        password: formData.password,
      }) as any);
      
      // Check if login was successful
      if (login.fulfilled.match(resultAction)) {
        // If remember me is checked, we could set a longer expiry for the token
        // or store additional info in localStorage
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        navigate('/');
      }
      // If login failed, the error will be handled by the auth slice
      // and displayed in the UI via the error state
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  
  // Check if user is already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ABENA</h1>
          <p>Legal Case Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Sign In</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-group-inline">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="button" 
            className="login-button" 
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;