import { AUTH_ERRORS, HTTP_STATUS } from '../constants/messages';
import { AppError, formatAxiosError } from '../utils/errorUtil';
import { isTokenExpired, validateToken } from '../utils/jwtUtil';
import { getAccessToken, getRefreshToken, saveTokens } from '../utils/localStorageUtil';
import { axiosBase } from './axiosInstance/axiosInstance';

export const loginUser = async (data) => {
  const url = `/auth/login`;
  try {
    const res = await axiosBase.post(url, data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const registerUser = async (data) => {
  const url = '/auth/register';
  try {
    const res = await axiosBase.post(url, data);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const refreshTokenService = async (refreshToken) => {
  const url = '/auth/refresh-token';
  try {
    const res = await axiosBase.post(url, { token: refreshToken });
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const logoutUser = async () => {
  const url = '/auth/log-out';
  try {
    const res = await axiosBase.post(url);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const sendResetPasswordOtp = async (email) => {
  const url = '/auth/reset-password/otp';
  try {
    const res = await axiosBase.post(url, { request_email: email });
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const verifyResetPasswordRequest = async () => {
  const url = '/auth/reset-password/verify';
  try {
    await axiosBase.get(url);
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const res = await axiosBase.put('/auth/reset-password', {
      token: token,
      new_password: newPassword,
    });

    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

/**
 * Get a valid (non-expired) access token from storage.
 *
 * Handles token refresh fallback if needed.
 *
 * Save new tokens to local storage.
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
    throw new AppError('Get token helper', {
      status: HTTP_STATUS.NOT_FOUND,
      message: AUTH_ERRORS.TOKEN_REFRESH_NOT_FOUND,
    });
  }

  if (isTokenExpired(refreshToken)) {
    throw new AppError('Get token helper', {
      status: HTTP_STATUS.UNAUTHORIZED,
      message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
    });
  }
  return refreshToken;
};
