// src/App.js
import React, { useEffect, useState } from 'react';
import './assets/css/reset.css';
import './assets/css/style.css';

import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AllUserResultPage from './pages/AllUserResultPage/AllUserResultPage';
import FullTestPage from './pages/FullTest/FullTest';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import PracticeTestPage from './pages/PracticeTestPage/PracticeTestPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ResultPage from './pages/ResultPage/ResultPage';
import TestDetailPage from './pages/TestDetailPage/TestDetailPage';
import TestPage from './pages/TestPage/TestPage';
import './App.css';
import ViewDetailResult from './pages/ViewDetailResult/ViewDetailResult';
import ViewResultUserDo from './pages/ViewResultUserDo/ViewResultUserDo';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import './../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { jwtDecode } from 'jwt-decode';

import { resetUser, setAuthInitialized, updateUser, setAlertBox } from './redux/slides/userSlide';
import * as UserService from './service/UserService';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import ChatbotAI from './pages/ChatbotAI/ChatbotAI';

function App() {
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);

  const [showLoading, setShowLoading] = useState(false);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const alertBox = userState.alertBox;

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    dispatch(
      setAlertBox({
        open: false,
        msg: '',
        error: false,
      })
    );
  };

  // Xử lý cuộn trang
  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm giải mã token
  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  };

  // Hàm làm mới token
  const refreshAccessToken = async () => {
    try {
      const data = await UserService.refreshToken();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      // Cập nhật Redux state
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      dispatch(
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
      dispatch(
        setAlertBox({
          open: true,
          error: false,
          msg: 'Token has been successfully refreshed.',
        })
      );
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      dispatch(
        setAlertBox({
          open: true,
          error: true,
          msg: 'Login session expired. Please log in again.',
        })
      );
      throw error;
    }
  };

  // Hàm lấy chi tiết người dùng từ API
  const fetchUserDetails = async (userId, accessToken) => {
    try {
      const res = await UserService.getDetailsUserById(userId, accessToken);
      return res;
    } catch (error) {
      console.warn('Failed to fetch user details:', error);
      return null;
    }
  };

  // Hàm cập nhật Redux và localStorage
  const updateUserState = (userData, accessToken, refreshToken) => {
    const userState = {
      id: userData.id,
      userName: userData.username,
      userEmail: userData.email || '',
      role: userData.role,
      isStudent: userData.role === 'student',
      access_token: accessToken,
      refresh_token: refreshToken,
      isLoggedIn: true,
    };
    dispatch(updateUser(userState));
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email || '',
        role: userData.role,
      })
    );
    localStorage.setItem('redux_user', JSON.stringify(userState)); // Lưu Redux state
  };

  // Hàm xử lý đăng xuất khi xác thực thất bại
  const handleAuthFailure = (message) => {
    dispatch(
      setAlertBox({
        open: true,
        error: true,
        msg: message,
      })
    );
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('redux_user');
    dispatch(resetUser());
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  // Hàm khởi tạo xác thực
  const initAuth = async () => {
    console.log('Starting initAuth');
    setShowLoading(true);

    try {
      // Check redux_user in localStorage
      const savedReduxUser = localStorage.getItem('redux_user');
      if (savedReduxUser) {
        const reduxUser = JSON.parse(savedReduxUser);
        if (reduxUser.id && reduxUser.isLoggedIn) {
          dispatch(updateUser(reduxUser));
          dispatch(setAuthInitialized(true));
          return;
        }
      }

      // Check tokens and user data
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userData = localStorage.getItem('user');

      if (!accessToken || !refreshToken || !userData) {
        dispatch(resetUser());
        dispatch(setAuthInitialized(true));
        return;
      }

      let newAccessToken = accessToken;
      const decoded = decodeToken(accessToken);

      if (!decoded || decoded.exp < Date.now() / 1000) {
        console.log('Token expired, attempting to refresh');
        newAccessToken = await refreshAccessToken();
      }

      const user = JSON.parse(userData);
      updateUserState(user, newAccessToken, refreshToken);

      // Fetch user details (optional)
      const userDetails = await fetchUserDetails(decoded.user_id, newAccessToken);
      if (userDetails) {
        updateUserState(userDetails, newAccessToken, refreshToken);
      }

      dispatch(setAuthInitialized(true));
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      handleAuthFailure('Session expired. Please log in again.');
    } finally {
      setShowLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, [dispatch]);

  if (!userState.isAuthInitialized) {
    return (
      <div className="loading-container-authen">
        <h3>Initializing authentication...</h3>
      </div>
    );
  }
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Snackbar
            open={alertBox.open}
            autoHideDuration={4000}
            onClose={handleClose}
            className="snackbar">
            <Alert
              onClose={handleClose}
              // autoHideDuration={4000}
              severity={alertBox.error === false ? 'success' : 'error'}
              variant="filled"
              sx={{
                width: '100%',
                fontSize: '1.6rem',
                fontFamily: 'Poppins',
                fontWeight: '400',
              }}>
              {alertBox.msg}
            </Alert>
          </Snackbar>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dd" element={<NotFoundPage />} />
              <Route path="/chat-ai" element={<ChatbotAI />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route
                exact={true}
                path="/detailtest/:id"
                element={
                  <ProtectedRoute>
                    <TestDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fulltest/:id"
                element={
                  <ProtectedRoute>
                    <FullTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tests/:id/practice"
                element={
                  <ProtectedRoute>
                    <PracticeTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:id/result/:resultId"
                element={
                  <ProtectedRoute>
                    <ResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/viewdetailanswer/:id"
                element={
                  <ProtectedRoute>
                    <ViewDetailResult />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/viewallresult"
                element={
                  <ProtectedRoute>
                    <AllUserResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:id/result/:resultId/details"
                element={
                  <ProtectedRoute>
                    <ViewResultUserDo />
                  </ProtectedRoute>
                }
              />
              {/* Add more routes as you build other pages */}
            </Routes>
          </main>
          <Footer />
          <button
            className={`scroll-to-top ${showScrollButton ? 'show' : ''}`}
            onClick={scrollToTop}>
            ↑
          </button>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
