import { APP_LOG_CONTEXT, logError } from '../log/logger';
import { formatAxiosError } from '../utils/errorUtil';
import { axiosJWT, axiosBase } from './axiosInstance/axiosInstance';

export const fetchData = async (url, requireAuth = false, options = {}) => {
  const { ignoreErrorCodes = [] } = options;
  try {
    const instance = requireAuth ? axiosJWT : axiosBase;
    const res = await instance.get(url);
    return res.data;
  } catch (error) {
    if (!ignoreErrorCodes.includes(error.response?.status)) {
      logError(APP_LOG_CONTEXT.USER_GET, url, error);
    }

    throw formatAxiosError(error);
  }
};

export const postData = async (url, data, requireAuth = false) => {
  try {
    const instance = requireAuth ? axiosJWT : axiosBase;
    const res = await instance.post(url, data);
    return { success: true, data: res.data };
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const deleteData = async (url, requireAuth = false) => {
  try {
    const instance = requireAuth ? axiosJWT : axiosBase;
    const res = await instance.delete(url);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};

export const getDetailsUserById = async (userId) => {
  const url = `/users/${userId}`;
  try {
    const res = await axiosJWT.get(url);
    return res.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
};
