import axios from 'axios';

const params = {
  headers: {
    'Content-Type': 'application/json', // Adjust the content type as needed
  },
};

export const fetchDataFromApi = async (url, requireAuth = false) => {
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
    const res = await axios.get(fullUrl, { headers });
    console.log('Response:', res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
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
    const res = await axios.post(fullUrl, data, { headers });
    console.log('Response:', res.data);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(`Error posting ${url}:`, error);
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
    const res = await axios.delete(fullUrl, { headers });
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
