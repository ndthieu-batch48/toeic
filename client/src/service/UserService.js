import axios from 'axios';

import { AUTH_ERRORS, HTTP_STATUS } from '../constants/messages';
import { AppError, formatAxiosError } from '../utils/errorHandler';
import { APP_LOG_CONTEXT, logAPI, logAPIError } from '../utils/logger';
import { refreshTokenService } from './AuthService';
import { axiosJWT } from './axiosInstance';

export const fetchData = async (url, requireAuth = false, options = {}) => {
  const { ignoreErrorCodes = [] } = options;
  const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw AppError(APP_LOG_CONTEXT.USER_GET, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const instance = requireAuth ? axiosJWT : axios;
    const res = await instance.get(fullUrl, { headers });
    logAPI(APP_LOG_CONTEXT.USER_GET, url, res.status, res.data);
    return res.data;
  } catch (error) {
    if (!ignoreErrorCodes.includes(error.response?.status)) {
      logAPIError(APP_LOG_CONTEXT.USER_GET, url, error);
    }

    // Handle token refresh for 401 errors with auth
    if (error.response && error.response.status === HTTP_STATUS.UNAUTHORIZED && requireAuth) {
      try {
        const data = await refreshTokenService();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        // // Update Redux state
        // const userData = JSON.parse(localStorage.getItem('user') || '{}');
        // store.dispatch(
        //   updateUser({
        //     id: userData.id,
        //     userName: userData.username,
        //     userEmail: userData.email,
        //     role: userData.role,
        //     isStudent: userData.role === 'student',
        //     access_token: data.access_token,
        //     refresh_token: data.refresh_token || localStorage.getItem('refresh_token'),
        //     isLoggedIn: true,
        //   })
        // );

        // Retry request with new token
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.access_token}`,
        };
        const res = await axios.get(fullUrl, { headers });
        console.log('Retry response:', res.data);
        return res.data;
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);

        // Clear auth state and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('redux_user');
        // store.dispatch(resetUser());

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

        throw new formatAxiosError(refreshError);
      }
    }
    throw new formatAxiosError(error);
  }
};

export const postData = async (url, data, requireAuth = false) => {
  try {
    const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw AppError(APP_LOG_CONTEXT.USER_POST, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const instance = requireAuth ? axiosJWT : axios;
    const res = await instance.post(fullUrl, data, { headers });
    logAPI(APP_LOG_CONTEXT.USER_POST, url, res.status, res.data);
    return { success: true, data: res.data };
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.USER_POST, url, error);
    throw new formatAxiosError(error);
  }
};

export const deleteData = async (url, requireAuth = false) => {
  try {
    const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw AppError(APP_LOG_CONTEXT.USER_DELETE, {
          status: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const instance = requireAuth ? axiosJWT : axios;
    const res = await instance.delete(fullUrl, { headers });
    logAPI(APP_LOG_CONTEXT.USER_DELETE, url, res.status, res.data);
    return res.data;
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.USER_DELETE, url, error);
    throw new formatAxiosError(error);
  }
};

export const getDetailsUserById = async (userId) => {
  const url = `/users/${userId}`;
  try {
    const res = await axiosJWT.get(url);
    logAPI(APP_LOG_CONTEXT.USER_GET_DETAIL, `users/${userId}`, res.status, res.data);
    return res.data;
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.USER_GET_DETAIL, `users/${userId}`, error);
    throw new formatAxiosError(error);
  }
};
