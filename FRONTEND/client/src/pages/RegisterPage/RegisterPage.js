import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ALLOWED_DOMAINS } from '../../constants/allowedDomains';
import { AUTH_SUCCESS } from '../../constants/messages';
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
      showSuccess(AUTH_SUCCESS.REGISTER_SUCCESS);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const allowedDomains = [ALLOWED_DOMAINS.GMAIL, ALLOWED_DOMAINS.YAHOO, ALLOWED_DOMAINS.TMA];
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
            <label>User name</label>
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
