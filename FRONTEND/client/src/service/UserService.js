import { extractAxiosError } from '../utils/errorUtil';
import { axiosJWT, axiosBase } from './axiosInstance/axiosInstance';

export const fetchData = async (url, requireAuth = false, options = {}) => {
  try {
    const instance = requireAuth === true ? axiosJWT : axiosBase;
    const res = await instance.get(url);
    return res.data;
  } catch (error) {
    throw new Error(extractAxiosError(error));
  }
};

export const postData = async (url, data, requireAuth = false) => {
  try {
    const instance = requireAuth ? axiosJWT : axiosBase;
    const res = await instance.post(url, data);
    return { success: true, data: res.data };
  } catch (error) {
    throw new Error(extractAxiosError(error));
  }
};

export const deleteData = async (url, requireAuth = false) => {
  try {
    const instance = requireAuth ? axiosJWT : axiosBase;
    const res = await instance.delete(url);
    return res.data;
  } catch (error) {
    throw new Error(extractAxiosError(error));
  }
};

export const getDetailsUserById = async (userId) => {
  const url = `/users/${userId}`;
  try {
    const res = await axiosJWT.get(url);
    return res.data;
  } catch (error) {
    throw new Error(extractAxiosError(error));
  }
};
