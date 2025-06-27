import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AUTH_ERRORS } from '../constants/messages';
import { useReduxAlert } from '../hook/useReduxAlert';
import { useReduxUser } from '../hook/useReduxUser';
import * as AuthService from '../service/AuthService';
import { getValidRefreshTokenHelper } from '../service/AuthService';
import * as UserService from '../service/UserService';
import { decodeToken, isTokenExpired } from '../utils/jwtHandler';
import * as LocalStorage from '../utils/localStorageHandler';
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
      const refreshToken = getValidRefreshTokenHelper();

      const tokenData = await AuthService.refreshTokenService(refreshToken);
      LocalStorage.saveTokens(tokenData.access_token, tokenData.refresh_token);
      logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Access token refreshed');

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      };
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
    const userResponse = await UserService.loginUser({ username, password });
    updateReduxUser(userResponse);
    LocalStorage.saveUserSession(userResponse);
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
    LocalStorage.clearAuthStorage();
  };

  const handleAuthFailure = (message) => {
    showError(message);
    logout();
    setTimeout(() => navigate('/login'), 2000);
  };

  const initAuth = async () => {
    logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Starting authentication initialization');
    setIsInitializing(true);

    try {
      // Quick restore from saved Redux state
      const savedReduxUser = LocalStorage.getLocalReduxUser();
      if (!savedReduxUser) {
        handleAuthFailure(AUTH_ERRORS.SESSION_EXPIRED);
      }

      if (
        savedReduxUser.id &&
        savedReduxUser.isLoggedIn &&
        !isTokenExpired(savedReduxUser.access_token)
      ) {
        updateReduxUser(savedReduxUser);
        setReduxAuthInitialized(true);
        logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Quick restore from saved Redux state successful');
        setIsInitializing(false);
        return;
      }

      // Check if a user session exists using utility function
      if (!LocalStorage.hasUserSession()) {
        resetReduxUser();
        setReduxAuthInitialized(true);
        logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'No authentication data found, resetting user');
        return;
      }

      // Get tokens and user data
      const accessToken = LocalStorage.getAccessToken();
      const refreshToken = LocalStorage.getRefreshToken();
      const userData = LocalStorage.getLocalUser();
      let currentAccessToken = accessToken;
      let currentRefreshToken = refreshToken;

      // Handle token refresh if needed
      const decoded = decodeToken(accessToken);
      // When refreshing tokens
      if (!decoded || isTokenExpired(accessToken)) {
        const tokens = await refreshAccessToken();
        if (tokens) {
          updateReduxUserToken(tokens.access_token, tokens.refresh_token);
          LocalStorage.saveAccessToken(tokens.access_token);
          LocalStorage.saveRefreshToken(tokens.refresh_token);
        }
      }

      // Update user state with current data
      if (userData) {
        updateReduxUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          access_token: currentAccessToken,
          refresh_token: currentRefreshToken,
        });
      }

      // Optionally fetch latest user details
      if (decoded?.user_id) {
        const userDetails = await fetchUserDetails(decoded.user_id, currentAccessToken);
        if (userDetails) {
          updateReduxUser({
            id: userDetails.id,
            username: userDetails.username,
            email: userDetails.email,
            role: userDetails.role,
            access_token: currentAccessToken,
            refresh_token: currentRefreshToken,
          });
        }
      }

      setReduxAuthInitialized(true);
      logAuth(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Authentication initialization completed successfully');
    } catch (error) {
      logAuthError(APP_LOG_CONTEXT.AUTH_CONTEXT, 'Authentication initialization', error);
      handleAuthFailure(AUTH_ERRORS.SESSION_EXPIRED);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!userState.isAuthInitialized) {
      initAuth();
    }
  }, [userState.isAuthInitialized]);

  // Public API - removed showAlert from here
  const contextValue = {
    isInitializing,
    isAuthInitialized: userState.isAuthInitialized,
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
