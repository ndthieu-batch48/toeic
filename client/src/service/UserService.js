import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { updateUser, resetUser } from '../redux/slides/userSlide';
import { store } from '../redux/store';

export const axiosJWT = axios.create();

export const loginUser = async (data) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/login`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Login token response:', res.data);
    return res.data;
  } catch (error) {
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.message || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const registerUser = async (data) => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/register`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('No refresh token available');
      throw { status: 401, message: 'No refresh token available' };
    }
    // Kiểm tra refresh_token có hợp lệ không
    let decodedRefreshToken;
    try {
      decodedRefreshToken = jwtDecode(refreshToken);
      if (decodedRefreshToken.exp < Date.now() / 1000) {
        console.error('Refresh token expired');
        throw { status: 401, message: 'Refresh token expired' };
      }
    } catch (error) {
      console.error('Invalid refresh token:', error);
      throw { status: 401, message: 'Invalid refresh token' };
    }

    console.log('Calling refresh-token with token:', refreshToken);
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/refresh-token`,
      { token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Refresh token response:', res.data);
    console.log('Stored access_token:', res.data.access_token);
    console.log('Stored refresh_token:', res.data.refresh_token);
    localStorage.setItem('access_token', res.data.access_token);
    if (res.data.refresh_token) {
      localStorage.setItem('refresh_token', res.data.refresh_token);
    }
    return res.data;
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data?.detail || 'Failed to refresh token',
      };
    } else {
      throw { status: 500, message: 'Cannot connect to server' };
    }
  }
};

export const logoutUser = async () => {
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/log-out`);
    return res.data;
  } catch (error) {
    if (error.response) {
      throw {
        message: error.response.data?.message || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const fetchData = async (url, requireAuth = false, options = {}) => {
  const { ignoreErrorCodes = [] } = options;
  try {
    const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
    console.log('Calling API:', fullUrl);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw { status: 401, message: 'Not authenticated' };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const instance = requireAuth ? axiosJWT : axios;

    const res = await instance.get(fullUrl, { headers });
    return res.data;
  } catch (error) {
    if (!ignoreErrorCodes.includes(error.response?.status)) {
      console.error(`Error fetching ${url}:`, error);
    }

    if (error.response && error.response.status === 401 && requireAuth) {
      try {
        const data = await refreshToken();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        // Cập nhật Redux state
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
        // Thử lại yêu cầu với token mới
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.access_token}`,
        };
        const res = await axios.get(fullUrl, { headers });
        console.log('Retry response:', res.data);
        return res.data;
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
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
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.detail || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const postData = async (url, data, requireAuth = false) => {
  try {
    const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
    console.log('Calling API:', fullUrl);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw { status: 401, message: 'Not authenticated' };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    const instance = requireAuth ? axiosJWT : axios;
    const res = await instance.post(fullUrl, data, { headers });
    console.log('Response:', res.data);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(`Error posting ${url}:`, error);
    if (error.response && error.response.status === 401) {
      throw { status: 401, message: 'Not authenticated' };
    }
    if (error.response && error.response.status === 403) {
      throw {
        status: 403,
        message: 'You do not have permission to perform this action',
      };
    }
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.detail || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const deleteData = async (url, requireAuth = false) => {
  try {
    const fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
    console.log('Calling API:', fullUrl);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (requireAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw { status: 401, message: 'Not authenticated' };
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    const instance = requireAuth ? axiosJWT : axios;
    const res = await instance.delete(fullUrl, { headers });
    console.log('Response:', res.data);
    return res.data;
  } catch (error) {
    console.error(`Error deleting ${url}:`, error);
    if (error.response && error.response.status === 401) {
      throw { status: 401, message: 'Not authenticated' };
    }
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.detail || 'Đã xảy ra lỗi.',
      };
    } else {
      throw { status: 500, message: 'Không thể kết nối đến máy chủ.' };
    }
  }
};

export const getDetailsUserById = async (userId, accessToken) => {
  try {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('User details response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
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
        // Cập nhật Redux state
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

        // Xóa trạng thái và chuyển hướng
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
