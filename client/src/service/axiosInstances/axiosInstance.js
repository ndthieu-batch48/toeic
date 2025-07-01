import axios from 'axios';

import { resetUser } from '../../redux/slides/userSlide';
import { store } from '../../redux/store';
import { clearAuthStorage } from '../../utils/localStorageUtil';
import { getValidAccessTokenHelper } from '../AuthService';

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
      console.error('Interceptor token error:', error);

      clearAuthStorage();
      store.dispatch(resetUser());
      window.location.replace('/login');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Interceptor request error:', error);
    return Promise.reject(error);
  }
);
