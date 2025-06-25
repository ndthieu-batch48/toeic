import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AUTH_ERRORS } from '../constants/messages';
import { useReduxAlert } from '../hook/useReduxAlert';
import { useReduxUser } from '../hook/useReduxUser';
import * as UserService from '../service/UserService';
import { decodeToken, isTokenExpired } from '../utils/jwtHandler';
import {
  getAccessToken,
  getRefreshToken,
  getLocalUser,
  getLocalReduxUser,
  saveAccessToken,
  saveRefreshToken,
  saveLocalUserData,
  saveLocalReduxUser,
  clearAuthStorage,
  hasUserSession,
} from '../utils/localStorageHandler';
import { APP_LOG_CONTEXT, logAuth, logAuthError, logError } from '../utils/logger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { showError } = useReduxAlert();
  const [isInitializing, setIsInitializing] = useState(true);
  const {
    userState,
    updateReduxUser,
    updateReduxUserToken,
    resetReduxUser,
    setReduxAuthInitialized,
  } = useReduxUser();
  const refreshAccessToken = async () => {
    try {
      const data = await UserService._refreshToken();
      if (!data) return;
      const { access_token, refresh_token } = data;
      return { access_token, refresh_token };
    } catch (error) {
      logAuthError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Token refresh failed', error);
      throw error;
    }
  };

  const fetchUserDetails = async (userId, accessToken) => {
    try {
      return await UserService.getDetailsUserById(userId, accessToken);
    } catch (error) {
      logError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Failed to fetch user details', error);
      return null;
    }
  };

  // Main authentication functions
  const login = async ({ username, password }) => {
    try {
      const userResponse = await UserService.loginUser({ username, password });

      const { access_token, refresh_token, ...userDataWithoutTokens } = userResponse;
      updateReduxUser(userResponse);
      saveLocalReduxUser(userResponse);
      saveLocalUserData(userDataWithoutTokens);
      saveAccessToken(access_token);
      saveRefreshToken(refresh_token);
    } catch (error) {
      logError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Login failed', error);
      throw error;
    }
  };

  const register = async ({ username, email, password }) => {
    try {
      const res = await UserService.registerUser({ username, email, password });
      return res.message; // Follow response structure
    } catch (error) {
      logError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Register failed', error);
      throw error;
    }
  };

  const logout = () => {
    resetReduxUser();
    clearAuthStorage();
  };

  const handleAuthFailure = (message) => {
    showError(message);
    logout();
    setTimeout(() => navigate('/login'), 2000);
  };

  const initAuth = async () => {
    logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Starting authentication initialization');
    try {
      // Uncomment and use the proper authentication logic
      const savedReduxUser = getLocalReduxUser();
      if (!savedReduxUser) {
        resetReduxUser();
        setReduxAuthInitialized(true);
        logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'No authentication data found, resetting user');
        setIsInitializing(false);
        return;
      }

      // Rest of your authentication logic...
      setReduxAuthInitialized(true);
    } catch (error) {
      logAuthError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Authentication initialization', error);
      handleAuthFailure(AUTH_ERRORS.SESSION_EXPIRED);
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-initialize on mount
  useEffect(() => {
    initAuth();
  }, []);

  // Public API - removed showAlert from here
  const contextValue = {
    isInitializing,
    isAuthInitialized: userState.isAuthInitialized, // Add this
    login,
    logout,
    register,
    refreshAccessToken,
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
