import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AUTH_SUCCESS, FORM_ERRORS } from '../../constants/messages';
import { useAuth } from '../../context/AuthContext';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { clearOtpSession } from '../../utils/localStorageUtil';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useReduxAlert();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);

  // Email validation regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!credential.trim()) {
      setError(FORM_ERRORS.REQUIRED_FIELD);
      return false;
    }

    if (!password.trim()) {
      setError(FORM_ERRORS.REQUIRED_FIELD);
      return false;
    }

    const isEmail = credential.includes('@');
    if (isEmail && !isValidEmail(credential)) {
      setError('Please enter a valid email address');
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
      const loginData = {
        credential: credential,
        password: password,
      };

      await login(loginData);
      showSuccess(AUTH_SUCCESS.LOGIN_SUCCESS);
      navigate('/');
    } catch (error) {
      setError(error.message);
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setIsShowPassword((prev) => !prev);
  };

  const handleForgotPassword = () => {
    clearOtpSession();
    navigate('/send-reset-password');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>LOGIN</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="login-form-group">
            <label>User name or Email</label>
            <input
              type="text"
              placeholder="Enter your User name or Email"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input
                type={isShowPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleShowPassword}
                disabled={isLoading}>
                {isShowPassword ? (
                  <i className="bi bi-eye-slash"></i>
                ) : (
                  <i className="bi bi-eye"></i>
                )}
              </button>
            </div>
          </div>

          <p className="login-footer">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="btn btn-link p-0"
              style={{
                fontSize: '1.25rem',
                fontWeight: '500',
                textDecoration: 'underline',
                color: '#4a2c8a',
              }}>
              Forgot password?
            </button>
          </p>

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
