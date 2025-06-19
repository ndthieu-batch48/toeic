import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { updateUser, resetUser, setAuthInitialized, setAlertBox } from '../redux/slides/userSlide';
import * as UserService from '../service/UserService';
import { saveUserToStorage, clearUserFromStorage } from '../utils/userStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);
  const [isInitializing, setIsInitializing] = useState(true);

  // Token utilities
  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  };

  const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    return !decoded || decoded.exp < Date.now() / 1000;
  };

  // Authentication API calls
  const refreshAccessToken = async () => {
    try {
      const data = await UserService.refreshToken();

      // Update localStorage
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Update Redux state
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserState = {
        id: userData.id,
        userName: userData.username,
        userEmail: userData.email,
        role: userData.role,
        isStudent: userData.role === 'student',
        access_token: data.access_token,
        refresh_token: data.refresh_token || localStorage.getItem('refresh_token'),
        isLoggedIn: true,
      };

      dispatch(updateUser(updatedUserState));

      // Update redux_user in localStorage
      localStorage.setItem('redux_user', JSON.stringify(updatedUserState));

      showAlert('Token has been successfully refreshed.', false);
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      handleAuthFailure('Login session expired. Please log in again.');
      throw error;
    }
  };

  const fetchUserDetails = async (userId, accessToken) => {
    try {
      return await UserService.getDetailsUserById(userId, accessToken);
    } catch (error) {
      console.warn('Failed to fetch user details:', error);
      return null;
    }
  };

  // State management utilities
  const updateUserState = (userData, accessToken, refreshToken) => {
    const userState = {
      id: userData.id,
      userName: userData.username,
      userEmail: userData.email || '',
      role: userData.role,
      isStudent: userData.role === 'student',
      access_token: accessToken,
      refresh_token: refreshToken,
      isLoggedIn: true,
    };

    dispatch(updateUser(userState));
    saveUserToStorage(userData, accessToken, refreshToken);
  };

  const showAlert = (message, isError = false) => {
    dispatch(
      setAlertBox({
        open: true,
        error: isError,
        msg: message,
      })
    );
  };

  const handleAuthFailure = (message) => {
    showAlert(message, true);
    logout();
    setTimeout(() => navigate('/login'), 2000);
  };

  // Main authentication functions
  const login = (userInfo, access_token, refresh_token) => {
    updateUserState(userInfo, access_token, refresh_token);
    navigate('/');
  };

  const logout = () => {
    dispatch(resetUser());
    clearUserFromStorage();
    navigate('/login');
  };

  const initAuth = async () => {
    console.log('Starting authentication initialization');
    setIsInitializing(true);

    try {
      // Quick restore from saved Redux state
      const savedReduxUser = localStorage.getItem('redux_user');
      if (savedReduxUser) {
        const reduxUser = JSON.parse(savedReduxUser);
        if (reduxUser.id && reduxUser.isLoggedIn && !isTokenExpired(reduxUser.access_token)) {
          dispatch(updateUser(reduxUser));
          dispatch(setAuthInitialized(true));
          return;
        }
      }

      // Check for authentication data
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userData = localStorage.getItem('user');

      if (!accessToken || !refreshToken || !userData) {
        dispatch(resetUser());
        dispatch(setAuthInitialized(true));
        return;
      }

      // Handle token refresh if needed
      let currentAccessToken = accessToken;
      const decoded = decodeToken(accessToken);

      if (!decoded || isTokenExpired(accessToken)) {
        console.log('Token expired, refreshing...');
        currentAccessToken = await refreshAccessToken();
      }

      // Update user state
      const user = JSON.parse(userData);
      updateUserState(user, currentAccessToken, refreshToken);

      // Optionally fetch latest user details
      if (decoded?.user_id) {
        const userDetails = await fetchUserDetails(decoded.user_id, currentAccessToken);
        if (userDetails) {
          updateUserState(userDetails, currentAccessToken, refreshToken);
        }
      }

      dispatch(setAuthInitialized(true));
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      handleAuthFailure('Session expired. Please log in again.');
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Public API
  const contextValue = {
    // User state
    user: {
      id: userState.id,
      username: userState.userName,
      email: userState.userEmail,
      role: userState.role,
    },
    isLoggedIn: userState.isLoggedIn,
    isAuthInitialized: userState.isAuthInitialized,
    isInitializing,

    // Auth functions
    login,
    logout,
    refreshAccessToken,

    // Utility functions
    decodeToken,
    isTokenExpired,
    showAlert,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
