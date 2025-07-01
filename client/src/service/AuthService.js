import { AUTH_ERRORS, HTTP_STATUS } from '../constants/messages';
import { APP_LOG_CONTEXT } from '../log/logger';
import { AppError, formatAxiosError } from '../utils/errorUtil';
import { isTokenExpired, validateToken } from '../utils/jwtUtil';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/localStorageUtil';
import { axiosBase } from './axiosInstance/axiosInstance';

export const loginUser = async (data) => {
  const url = `/login`;
  try {
    const res = await axiosBase.post(url, data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const registerUser = async (data) => {
  const url = '/register';
  try {
    const res = await axiosBase.post(url, data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const refreshTokenService = async (refreshToken) => {
  const url = '/refresh-token';
  try {
    const res = await axiosBase.post(url, { token: refreshToken });
    return res.data;
  } catch (error) {
    throw new formatAxiosError(error);
  }
};

export const logoutUser = async () => {
  const url = '/log-out';
  try {
    const res = await axiosBase.post(url);
    return res.data;
  } catch (error) {
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
    throw new AppError('GET ACCESS TOKEN HELPER', {
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
    throw new AppError(APP_LOG_CONTEXT.TOKEN_HANDLER, {
      status: HTTP_STATUS.NOT_FOUND,
      message: AUTH_ERRORS.TOKEN_REFRESH_NOT_FOUND,
    });
  }

  if (isTokenExpired(refreshToken)) {
    throw new AppError(APP_LOG_CONTEXT.TOKEN_HANDLER, {
      status: HTTP_STATUS.UNAUTHORIZED,
      message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
    });
  }
  return refreshToken;
};
