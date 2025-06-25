import CircularProgress from '@mui/material/CircularProgress';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useReduxAlert } from '../../hook/useReduxAlert';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useReduxAlert();
  const { register } = useAuth();
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Xác nhận đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) {
      showError(emailError);
      return;
    }

    setIsLoading(true);
    try {
      await register({ username, email, password });
      showSuccess('Registration successful! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (error) {
      const errorMessage = error.message || error.toString(); //error.response ||
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const allowedDomains = ['gmail.com', 'tma.com.vn', 'yahoo.com'];
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    const emailDomain = newEmail.split('@').pop();

    if (allowedDomains.includes(emailDomain)) {
      setEmailError('');
    } else {
      setEmailError(`Email must end with one of the following: ${allowedDomains.join(', ')}`);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>REGISTER</h2>
        <form onSubmit={handleSubmit}>
          <div className="register-form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isLoading} className="register-button">
            {isLoading ? <CircularProgress size={24} /> : 'Regiter'}
          </button>
        </form>
        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
