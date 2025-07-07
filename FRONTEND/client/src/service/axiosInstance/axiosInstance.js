import axios from 'axios';

import { resetUser } from '../../redux/slices/userSlice';
import { store } from '../../redux/store';
import { clearAuthStorage } from '../../utils/localStorageUtil';
import { getValidAccessTokenHelper } from '../AuthService';

export const axiosBase = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosJWT = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
axiosJWT.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await getValidAccessTokenHelper();
      config.headers['Authorization'] = `Bearer ${accessToken}`;
      return config;
    } catch (error) {
      clearAuthStorage();
      store.dispatch(resetUser());
      window.location.replace('/login');
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);
