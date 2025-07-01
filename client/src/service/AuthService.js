import axios from 'axios';

import { AUTH_ERRORS, HTTP_STATUS } from '../constants/messages';
import { APP_LOG_CONTEXT, logAuth, logAuthError } from '../log/logger';
import { AppError, formatAxiosError } from '../utils/errorUtil';
import { isTokenExpired, validateToken } from '../utils/jwtUtil';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/localStorageUtil';

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`/login`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    logAuth(APP_LOG_CONTEXT.LOGIN, res.data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const registerUser = async (data) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/register`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    logAuth(APP_LOG_CONTEXT.REGISTER, res.data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const refreshTokenService = async (refreshToken) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/refresh-token`,
      { token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error) {
    logAuthError(APP_LOG_CONTEXT.REFRESH_TOKEN, error);
    throw new formatAxiosError(error);
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/log-out`);
    return res.data;
  } catch (error) {
    logAuthError(APP_LOG_CONTEXT.LOGOUT, error);
    throw new formatAxiosError(error);
  }
};

/**
 * Get a valid (non-expired) access token from storage
 * @returns {string} - Valid access token
 * @throws {AppError} - If token is missing or expired
 */
export const getValidAccessTokenHelper = async () => {
  let accessToken = getAccessToken();

  const isValid = accessToken && validateToken(accessToken, ['exp', 'user_id']);

  if (isValid && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  try {
    const refreshToken = getValidRefreshTokenHelper();
    const { access_token, refresh_token } = await refreshTokenService(refreshToken);
    saveTokens(access_token, refresh_token);
    return access_token;
  } catch (error) {
    throw AppError('GET ACCESS TOKEN HELPER', {
      status: error.status,
      message: error.message,
    });
  }
};

/**
 * Get a valid (non-expired) refresh token from storage
 * @returns {string} - Valid refresh token
 * @throws {AppError} - If token is missing or expired
 */
export const getValidRefreshTokenHelper = () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw AppError(APP_LOG_CONTEXT.TOKEN_HANDLER, {
      status: HTTP_STATUS.NOT_FOUND,
      message: AUTH_ERRORS.TOKEN_REFRESH_NOT_FOUND,
    });
  }

  if (isTokenExpired(refreshToken)) {
    throw AppError(APP_LOG_CONTEXT.TOKEN_HANDLER, {
      status: HTTP_STATUS.UNAUTHORIZED,
      message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
    });
  }
  return refreshToken;
};
