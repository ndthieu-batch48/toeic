import { useDispatch, useSelector } from 'react-redux';

import { updateUser, resetUser, setAuthInitialized } from '../redux/slices/userSlice';

export const useReduxUser = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);

  const updateReduxUser = (userData) => {
    try {
      const userState = {
        id: userData.id,
        userName: userData.username,
        userEmail: userData.email || '',
        role: userData.role,
        isStudent: userData.role === 'student',
        access_token: userData.access_token,
        refresh_token: userData.refresh_token,
        isLoggedIn: true,
      };
      dispatch(updateUser(userState));
      return true;
    } catch (err) {
      console.error('Failed to update user state:', err);
      return false;
    }
  };

  const updateReduxUserToken = (accessToken, refreshToken) => {
    const updatedUserState = {
      ...userState, // Update existing user with new token
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    dispatch(updateUser(updatedUserState));
  };

  const setReduxAuthInitialized = (status) => {
    dispatch(setAuthInitialized(status));
  };

  const resetReduxUser = () => {
    dispatch(resetUser());
  };

  return {
    userState,
    updateReduxUser,
    updateReduxUserToken,
    resetReduxUser,
    setReduxAuthInitialized,
  };
};
