import CircularProgress from '@mui/material/CircularProgress';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FORM_ERRORS, AUTH_SUCCESS } from '../../constants/messages';
import { useAuth } from '../../context/AuthContext';
import * as UserService from '../../service/UserService';
import './LoginPage.css';
import { showError, showSuccess } from '../../utils/showAlert';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    if (!username.trim()) {
      setError(FORM_ERRORS.REQUIRED_FIELD);
      return false;
    }
    if (!password.trim()) {
      setError(FORM_ERRORS.REQUIRED_FIELD);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await UserService.loginUser({ username, password });
      login(
        {
          id: res.id,
          username: res.username,
          email: res.email,
          role: res.role,
        },
        res.access_token,
        res.refresh_token
      );
      showSuccess(AUTH_SUCCESS.LOGIN_SUCCESS);
      navigate('/');
    } catch (error) {
      const errorMessage = error.response || error.message || error.toString();
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>LOGIN</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="login-form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? <CircularProgress size={24} /> : 'Login'}
          </button>
        </form>

        <p className="login-footer">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
