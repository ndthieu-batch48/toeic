import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AUTH_ERRORS } from '../constants/messages';
import { useReduxAlert } from '../hook/useReduxAlert';
import { useReduxUser } from '../hook/useReduxUser';
import { logError, logInfo } from '../log/logger';
import * as AuthService from '../service/AuthService';
import { getValidRefreshTokenHelper } from '../service/AuthService';
import * as UserService from '../service/UserService';
import { decodeToken, isTokenExpired } from '../utils/jwtUtil';
import * as LocalStorage from '../utils/localStorageUtil';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { showError } = useReduxAlert();
  const [isInitializing, setIsInitializing] = useState(true);
  const { userState, updateReduxUser, resetReduxUser, setReduxAuthInitialized } = useReduxUser();

  const refreshAccessToken = async () => {
    try {
      const refreshToken = getValidRefreshTokenHelper();

      const tokenData = await AuthService.refreshTokenService(refreshToken);
      LocalStorage.saveTokens(tokenData.access_token, tokenData.refresh_token);
      logInfo('Auth Context', 'Access token refreshed', tokenData);
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      };
    } catch (error) {
      logError('AuthContext', 'Access token refreshed', error);
      throw error;
    }
  };

  const fetchUserDetails = async (userId, accessToken) => {
    try {
      return await UserService.getDetailsUserById(userId, accessToken);
    } catch (error) {
      logError('AuthContext', 'Fetch user details', error);
      return null;
    }
  };

  // Main authentication functions
  const login = async ({ credential, password }) => {
    const userResponse = await AuthService.loginUser({ credential, password });
    updateReduxUser(userResponse);
    LocalStorage.saveUserSession(userResponse);
  };

  const register = async ({ username, email, password }) => {
    try {
      const res = await AuthService.registerUser({ username, email, password });
      return res.message; // Follow response structure
    } catch (error) {
      logError('AuthContext', 'Register', error);
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
    logInfo('AuthContext', 'Auth initialization started');
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
        logInfo('AuthContext', 'Quick restore from saved Redux state successful');
        setIsInitializing(false);
        return;
      }

      // Check if a user session exists using utility function
      if (!LocalStorage.hasUserSession()) {
        resetReduxUser();
        setReduxAuthInitialized(true);
        logInfo('AuthContext', 'No authentication data found, resetting user');
        return;
      }

      // Read the getValidAccessTokenHelper() comments to understand the logic
      const accessToken = AuthService.getValidAccessTokenHelper();
      const refreshToken = AuthService.getValidRefreshTokenHelper();
      LocalStorage.saveAccessToken(accessToken);
      LocalStorage.saveRefreshToken(refreshToken);

      const decoded = decodeToken(accessToken);
      if (decoded?.user_id) {
        const userDetails = await fetchUserDetails(decoded.user_id, accessToken);
        if (userDetails) {
          updateReduxUser({
            id: userDetails.id,
            email: userDetails.email,
            role: userDetails.role,
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }

      setReduxAuthInitialized(true);
      logInfo('AuthContext', 'Authentication initialization successful');
    } catch (error) {
      logError('AuthContext', 'Authentication initialization', error);
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
