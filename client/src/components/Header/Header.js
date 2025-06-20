import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaBars } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import './Header.css';
import Logo from '../../assets/logo-removebg-preview.png';
import { useAuth } from '../../context/AuthContext';
import { setIsTestPage } from '../../redux/slides/userSlide';
import { logInfo } from '../../utils/logger';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const user = useSelector((state) => state.user); // Lấy toàn bộ user object
  const { logout } = useAuth();

  useEffect(() => {
    logInfo('Header', 'Current redux state', user);
    if (location.pathname.includes('/fulltest') || location.pathname.includes('/practice')) {
      dispatch(setIsTestPage(true));
    } else {
      dispatch(setIsTestPage(false));
    }
  }, [location, dispatch, user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 5);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Xử lý tự động đóng menu sau 3 giây
  useEffect(() => {
    let timeoutId;
    if (isMenuOpen && !isSmallScreen) {
      timeoutId = setTimeout(() => {
        setIsMenuOpen(false);
      }, 3000); // Đóng sau 3 giây
    }
    return () => clearTimeout(timeoutId); // Hủy timeout khi isMenuOpen hoặc isSmallScreen thay đổi
  }, [isMenuOpen, isSmallScreen]);

  // Xử lý đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleAlert = (url) => {
    const confirm = window.confirm('Exit may not be saved!');
    if (confirm && url !== 'logout') {
      navigate(url);
      dispatch(setIsTestPage(false));
    } else if (confirm && url === 'logout') {
      logout();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`header ${isScrolled ? 'small' : 'large'}`}>
      <div className="logo" onClick={() => (user.isTestPage ? handleAlert('/') : navigate('/'))}>
        <img src={Logo} alt="Logo" />
      </div>

      <nav>
        {!isSmallScreen && (
          <>
            <a
              onClick={() => (user.isTestPage ? handleAlert('/') : navigate('/'))}
              className={isActive('/') ? 'active' : ''}>
              Home
            </a>
            <a
              onClick={() => (user.isTestPage ? handleAlert('/test') : navigate('/test'))}
              className={isActive('/test') ? 'active' : ''}>
              Tests
            </a>
          </>
        )}

        <div className="user-menu" ref={menuRef}>
          {user.isLoggedIn ? (
            <>
              {isSmallScreen ? (
                <FaBars className="hamburger-icon" size={30} onClick={toggleMenu} />
              ) : (
                <FaUserCircle className="user-icon" size={30} onClick={toggleMenu} />
              )}

              {isSmallScreen && (
                <>
                  <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                    <div className="sidebar-content">
                      <div className="user-header">
                        <FaUserCircle className="user-icon-sidebar" size={40} />
                        <h1>Hello, {user.userName || 'User'}</h1>
                      </div>
                      <hr />
                      <a
                        href="#"
                        onClick={() => (user.isTestPage ? handleAlert('/') : navigate('/'))}
                        className={isActive('/') ? 'active' : ''}>
                        Home
                      </a>
                      <a
                        href="#"
                        onClick={() => (user.isTestPage ? handleAlert('/test') : navigate('/test'))}
                        className={isActive('/test') ? 'active' : ''}>
                        Test
                      </a>
                      <a
                        onClick={() =>
                          user.isTestPage
                            ? handleAlert('/viewallresult')
                            : navigate('/viewallresult')
                        }>
                        History
                      </a>
                      <a
                        href="#"
                        onClick={() => (user.isTestPage ? handleAlert('logout') : logout())}>
                        Log out
                      </a>
                    </div>
                  </div>
                  {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}
                </>
              )}

              {!isSmallScreen && isMenuOpen && (
                <div className="custom-dropdown-menu">
                  <h1>Hello, {user.userName || 'User'}</h1>
                  <a
                    href="#"
                    onClick={() =>
                      user.isTestPage ? handleAlert('/viewallresult') : navigate('/viewallresult')
                    }>
                    History
                  </a>
                  <a href="#" onClick={() => (user.isTestPage ? handleAlert('logout') : logout())}>
                    Logout
                  </a>
                </div>
              )}
            </>
          ) : (
            <a
              onClick={() => (user.isTestPage ? handleAlert('/login') : navigate('/login'))}
              className="login-link">
              Login
            </a>
          )}
        </div>
      </nav>
    </header>
    // </div>
  );
};

export default Header;
