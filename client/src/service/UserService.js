import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { HTTP_STATUS, AUTH_ERRORS } from '../constants/messages';
import { updateUser, resetUser } from '../redux/slides/userSlide';
import { store } from '../redux/store';
import { HttpCustomError, UnexpectedCustomError } from '../utils/errorHandler';
import { logAPI, logAuth, logAuthError, APP_LOG_CONTEXT, logAPIError } from '../utils/logger';

export const axiosJWT = axios.create();

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/login`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    logAuth(APP_LOG_CONTEXT.LOGIN, res.data);
    return res.data;
  } catch (error) {
    const formattedError = new HttpCustomError(APP_LOG_CONTEXT.LOGIN, error);
    logAuthError(APP_LOG_CONTEXT.LOGIN, formattedError);
    throw formattedError;
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
    logAuthError(APP_LOG_CONTEXT.REGISTER, error);
    throw new HttpCustomError(APP_LOG_CONTEXT.REGISTER, error);
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw UnexpectedCustomError(APP_LOG_CONTEXT.REFRESH_TOKEN, {
        code: HTTP_STATUS.NOT_FOUND,
        message: AUTH_ERRORS.TOKEN_REFRESH_NOT_FOUND,
      });
    }

    // Validate refresh token
    let decodedRefreshToken;
    try {
      decodedRefreshToken = jwtDecode(refreshToken);
      if (decodedRefreshToken.exp < Date.now() / 1000) {
        throw UnexpectedCustomError(APP_LOG_CONTEXT.REFRESH_TOKEN, {
          code: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.TOKEN_REFRESH_EXPIRED,
        });
      }
    } catch (error) {
      logAuthError(APP_LOG_CONTEXT.REFRESH_TOKEN, error);
      throw new HttpCustomError(APP_LOG_CONTEXT.REFRESH_TOKEN, error);
    }

    logAuth(APP_LOG_CONTEXT.REFRESH_TOKEN, { newToken: refreshToken });
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/refresh-token`,
      { token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    logAuth(APP_LOG_CONTEXT.REFRESH_TOKEN, { newTokenResponse: res.data });
    localStorage.setItem('access_token', res.data.access_token);
    if (res.data.refresh_token) {
      localStorage.setItem('refresh_token', res.data.refresh_token);
    }
    return res.data;
  } catch (error) {
    logAuthError(APP_LOG_CONTEXT.REFRESH_TOKEN, error);
    throw new HttpCustomError(APP_LOG_CONTEXT.REFRESH_TOKEN, error);
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/log-out`);
    return res.data;
  } catch (error) {
    logAuthError(APP_LOG_CONTEXT.LOGOUT, error);
    throw new HttpCustomError(APP_LOG_CONTEXT.LOGOUT, error);
  }
};

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
        throw UnexpectedCustomError(APP_LOG_CONTEXT.USER_GET, {
          code: HTTP_STATUS.UNAUTHORIZED,
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
        const data = await refreshToken();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        // Update Redux state
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        store.dispatch(
          updateUser({
            id: userData.id,
            userName: userData.username,
            userEmail: userData.email,
            role: userData.role,
            isStudent: userData.role === 'student',
            access_token: data.access_token,
            refresh_token: data.refresh_token || localStorage.getItem('refresh_token'),
            isLoggedIn: true,
          })
        );

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
        store.dispatch(resetUser());

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

        throw refreshError;
      }
    }

    // If it's already a structured error, throw it
    if (error.status && error.message) {
      throw error;
    }

    throw new HttpCustomError(error);
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
        throw UnexpectedCustomError(APP_LOG_CONTEXT.USER_POST, {
          code: HTTP_STATUS.UNAUTHORIZED,
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
    throw new HttpCustomError(error);
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
        throw UnexpectedCustomError(APP_LOG_CONTEXT.USER_DELETE, {
          code: HTTP_STATUS.UNAUTHORIZED,
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
    throw new HttpCustomError(error);
  }
};

export const getDetailsUserById = async (userId, accessToken) => {
  try {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    logAPI(APP_LOG_CONTEXT.USER_GET_DETAIL, `users/${userId}`, res.status, res.data);
    return res.data;
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.USER_GET_DETAIL, `users/${userId}`, error);
    throw new HttpCustomError(error);
  }
};

axiosJWT.interceptors.request.use(
  async (config) => {
    let storageData = localStorage.getItem('access_token');
    let decoded = {};

    if (storageData) {
      try {
        decoded = jwtDecode(storageData);
      } catch (error) {
        console.error('Invalid token:', error);
        storageData = null;
      }
    }

    if (!storageData || !decoded || decoded.exp < Date.now() / 1000) {
      console.log('Token expired or invalid, attempting to refresh');
      try {
        const data = await refreshToken();
        storageData = data.access_token;
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        // Update Redux state
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        store.dispatch(
          updateUser({
            id: userData.id,
            userName: userData.username,
            userEmail: userData.email,
            role: userData.role,
            isStudent: userData.role === 'student',
            access_token: data.access_token,
            refresh_token: data.refresh_token || localStorage.getItem('refresh_token'),
            isLoggedIn: true,
          })
        );
      } catch (error) {
        console.error('Failed to refresh token:', error);

        // Clear auth state and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('redux_user');
        store.dispatch(resetUser());

        window.location.replace('/login');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);

        throw error;
      }
    }

    config.headers['Authorization'] = `Bearer ${storageData}`;
    return config;
  },
  (error) => {
    console.error('Interceptor request error:', error);
    return Promise.reject(error);
  }
);
