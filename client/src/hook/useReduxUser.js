import { useDispatch, useSelector } from 'react-redux';

import { updateUser, resetUser, setAuthInitialized } from '../redux/slides/userSlide';

export const useReduxUser = () => {
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);

  const updateReduxUser = (userData) => {
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
