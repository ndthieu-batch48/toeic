import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '../../context/AuthContext';
import * as UserService from '../../service/UserService';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
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
      window.alert('Login Success');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Login fault:', error);
      window.alert(error.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>LOGIN</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? <CircularProgress size={24} /> : 'Login'}
          </button>
        </form>
        <p className="login-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
