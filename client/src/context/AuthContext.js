import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { updateUser, resetUser } from '../redux/slides/userSlide';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);

  const login = (userInfo, access_token, refresh_token) => {
    dispatch(
      updateUser({
        id: userInfo.id,
        userName: userInfo.username,
        userEmail: userInfo.email,
        role: userInfo.role,
        isStudent: userInfo.role === 'student',
        access_token,
        refresh_token,
        isLoggedIn: true,
      })
    );
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
      })
    );
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    navigate('/');
  };

  const logout = () => {
    dispatch(resetUser());
    // Xóa tất cả dữ liệu liên quan trong localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('redux_user');
    // Tùy chọn: Xóa các mục liên quan đến bài kiểm tra
    localStorage.removeItem('testProgress');
    localStorage.removeItem('timeLimit');
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('testTime-') ||
        key.startsWith('testProgress-') ||
        key.startsWith('testTimeLimit-')
      ) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('testSession-') || key === 'hasSubmitted') {
        sessionStorage.removeItem(key);
      }
    });

    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user: {
          id: userState.id,
          username: userState.userName,
          email: userState.userEmail,
          role: userState.role,
        },
        isLoggedIn: userState.isLoggedIn,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
