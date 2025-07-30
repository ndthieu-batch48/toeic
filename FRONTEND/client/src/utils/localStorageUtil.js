import { logError } from '../log/logger';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user',
  REDUX_USER: 'redux_user',
  OTP_SERVICE_SESSION: 'otp_session',
};

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value is null
 * @returns {any} Retrieved value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    logError('Storage Utils', `Failed to get ${key}`, error);
    return defaultValue;
  }
};

/**
 * Safely set item to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logError('Storage Utils', `Failed to set ${key}`, error);
    return false;
  }
};

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logError('Storage Utils', `Failed to remove ${key}`, error);
    return false;
  }
};

/**
 * Get parsed JSON from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed object or default value
 */
export const getStorageJSON = (key, defaultValue = {}) => {
  try {
    const item = getStorageItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logError('Storage Utils', `Failed to parse JSON for ${key}`, error);
    return defaultValue;
  }
};

/**
 * Set JSON object to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Object to stringify and store
 * @returns {boolean} Success status
 */
export const setStorageJSON = (key, value) => {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch (error) {
    logError('Storage Utils', `Failed to stringify JSON for ${key}`, error);
    return false;
  }
};

// Token-specific storage functions
export const getAccessToken = () => getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
export const getLocalUser = () => getStorageJSON(STORAGE_KEYS.USER_DATA);
export const getLocalReduxUser = () => getStorageJSON(STORAGE_KEYS.REDUX_USER);

export const saveAccessToken = (token) => setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token);
export const saveRefreshToken = (token) => setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, token);
export const saveLocalUserData = (userData) => setStorageJSON(STORAGE_KEYS.USER_DATA, userData);
export const saveLocalReduxUser = (userState) => setStorageJSON(STORAGE_KEYS.REDUX_USER, userState);

/**
 * Set tokens to storage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token (optional)
 * @returns {boolean} Success status
 */
export const saveTokens = (accessToken, refreshToken = null) => {
  const accessSuccess = saveAccessToken(accessToken);
  const refreshSuccess = refreshToken ? saveRefreshToken(refreshToken) : true;
  return accessSuccess && refreshSuccess;
};

/**
 * Get all tokens from storage
 * @returns {object} Object containing both tokens
 */
export const getTokens = () => ({
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
});

/**
 * Clear all authentication data from storage
 * @returns {boolean} Success status
 */
export const clearAuthStorage = () => {
  const results = [
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN),
    removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN),
    removeStorageItem(STORAGE_KEYS.USER_DATA),
    removeStorageItem(STORAGE_KEYS.REDUX_USER),
  ];
  removeTestData();

  return results.every((result) => result === true);
};

/**
 * Save complete user session to storage
 * @param {object} userData - Complete user response WITH tokens
 * @returns {boolean} Success status
 */
export const saveUserSession = (userData) => {
  const { access_token, refresh_token, ...userDataWithoutTokens } = userData;

  const reduxUserState = {
    id: userData.id,
    userName: userData.username,
    userEmail: userData.email || '',
    role: userData.role,
    isStudent: userData.role === 'student',
    access_token: access_token,
    refresh_token: refresh_token,
    isLoggedIn: true,
  };

  const results = [
    saveLocalUserData(userDataWithoutTokens),
    saveTokens(access_token, refresh_token),
    saveLocalReduxUser(reduxUserState),
  ];

  return results.every((result) => result === true);
};

/**
 * Check if user session exists in storage
 * @returns {boolean} True if session data exists
 */
export const hasUserSession = () => {
  const { accessToken, refreshToken } = getTokens();
  const userData = getLocalUser();

  return !!(accessToken && refreshToken && userData && Object.keys(userData).length > 0);
};

export const removeTestData = () => {
  // Clear test-related data
  localStorage.removeItem('testProgress');
  localStorage.removeItem('timeLimit');

  // Clear dynamic test data
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith('testTime-') ||
      key.startsWith('testProgress-') ||
      key.startsWith('testTimeLimit-')
    ) {
      localStorage.removeItem(key);
    }
  });

  // Clear session storage
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('testSession-') || key === 'hasSubmitted') {
      sessionStorage.removeItem(key);
    }
  });
};

export const createOtpSession = ({
  credential_value = '',
  credential_type = '',
  purpose = '',
  token = '',
}) => {
  setStorageJSON(STORAGE_KEYS.OTP_SERVICE_SESSION, {
    credential_value,
    credential_type,
    purpose,
    token,
  });
};

export const getOtpSession = () => {
  const otpSession = getStorageJSON(STORAGE_KEYS.OTP_SERVICE_SESSION, {
    credential_value: '',
    credential_type: '',
    purpose: '',
    token: '',
  });
  return otpSession;
};

export const updateOtpSession = (updates = {}) => {
  const currentSession = getOtpSession();

  const updatedSession = {
    ...currentSession,
    ...updates,
  };

  setStorageJSON(STORAGE_KEYS.OTP_SERVICE_SESSION, updatedSession);
};

export const clearOtpSession = () => {
  sessionStorage.removeItem(STORAGE_KEYS.OTP_SERVICE_SESSION);
};
