import axios from 'axios';

import { HTTP_STATUS, AUTH_ERRORS } from '../constants/messages';
import { HttpCustomError, UnexpectedCustomError } from '../utils/errorHandler';
import { logAPI, logAPIError, APP_LOG_CONTEXT } from '../utils/logger';

export const fetchDataFromApi = async (url, requireAuth = false) => {
  const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw UnexpectedCustomError(APP_LOG_CONTEXT.GET, {
          code: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.UNAUTHORIZED_ACCESS,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await axios.get(fullUrl, { headers });
    logAPI(APP_LOG_CONTEXT.GET, url, res.status, res.data);
    return res.data;
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.GET, url, error);
    throw HttpCustomError(APP_LOG_CONTEXT.GET, error);
  }
};

export const postData = async (url, data, requireAuth = false) => {
  const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw UnexpectedCustomError(APP_LOG_CONTEXT.POST, {
          code: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.UNAUTHORIZED_ACCESS,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await axios.post(fullUrl, data, { headers });
    logAPI(APP_LOG_CONTEXT.POST, url, res.status, res.data);
    return { success: true, data: res.data };
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.POST, url, error);
    throw HttpCustomError(error);
  }
};

export const deleteData = async (url, requireAuth = false) => {
  const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw UnexpectedCustomError(APP_LOG_CONTEXT.POST, {
          code: HTTP_STATUS.UNAUTHORIZED,
          message: AUTH_ERRORS.UNAUTHORIZED_ACCESS,
        });
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await axios.delete(fullUrl, { headers });
    logAPI(APP_LOG_CONTEXT.DELETE, url, res.status, res.data);
    return res.data;
  } catch (error) {
    logAPIError(APP_LOG_CONTEXT.DELETE, url, error);
    throw HttpCustomError(error);
  }
};
