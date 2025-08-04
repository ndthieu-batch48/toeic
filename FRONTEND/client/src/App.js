// src/App.js
import './../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './assets/css/reset.css';
import './assets/css/style.css';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useReduxAlert } from './hook/useReduxAlert';
import AllUserResultPage from './pages/AllUserResultPage/AllUserResultPage';
import ChatbotAI from './pages/ChatbotAI/ChatbotAI';
import FullTestPage from './pages/FullTest/FullTest';
import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import OtpPage from './pages/OtpPage/OtpPage';
import PracticeTestPage from './pages/PracticeTestPage/PracticeTestPageRefactory';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import SendResetPasswordEmailPage from './pages/ResetPasswordPage/SendResetPasswordEmailPage';
import ResultPage from './pages/ResultPage/ResultPage';
import TestDetailPage from './pages/TestDetailPage/TestDetailPage';
import TestPage from './pages/TestPage/TestPage';
import ViewDetailResult from './pages/ViewDetailResult/ViewDetailResult';
import ViewResultUserDo from './pages/ViewResultUserDo/ViewResultUserDo';

// App content component (needs to be inside AuthProvider)
const AppContent = () => {
  const { alertBox, closeAlert } = useReduxAlert();
  const { isAuthInitialized, isInitializing } = useAuth();
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Alert handling
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    closeAlert();
  };

  // Scroll handling
  const handleScroll = () => {
    setShowScrollButton(window.scrollY > 300);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading during auth initialization
  if (!isAuthInitialized || isInitializing) {
    return (
      <div className="loading-container-authen">
        <h3>Initializing authentication...</h3>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Snackbar
        open={alertBox.open}
        autoHideDuration={4000}
        onClose={handleClose}
        className="snackbar">
        <Alert
          onClose={handleClose}
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
          <Route path="/send-reset-password" element={<SendResetPasswordEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route
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
          <Route path="/tests/id/practice" element={<PracticeTestPage />} />
          {/* <Route
            path="/tests/:id/practice"
            element={
              <ProtectedRoute>
                <PracticeTestPage />
              </ProtectedRoute>
            }
          /> */}
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
        </Routes>
      </main>
      <Footer />

      <button className={`scroll-to-top ${showScrollButton ? 'show' : ''}`} onClick={scrollToTop}>
        ↑
      </button>
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
