// userStorage.js

export const saveUserToStorage = (user, accessToken, refreshToken) => {
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email || '',
    role: user.role,
  };

  const reduxUserState = {
    id: user.id,
    userName: user.username,
    userEmail: user.email || '',
    role: user.role,
    isStudent: user.role === 'student',
    access_token: accessToken,
    refresh_token: refreshToken,
    isLoggedIn: true,
  };

  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('redux_user', JSON.stringify(reduxUserState));
};

export const clearUserFromStorage = () => {
  // Clear auth data
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('redux_user');

  // Clear test-related data
  localStorage.removeItem('testProgress');
  localStorage.removeItem('timeLimit');

  // Clear dynamic test data
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith('testTime-') ||
      key.startsWith('testProgress-') ||
      key.startsWith('testTimeLimit-')
    ) {
      localStorage.removeItem(key);
    }
  });

  // Clear session storage
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('testSession-') || key === 'hasSubmitted') {
      sessionStorage.removeItem(key);
    }
  });
};

export const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const reduxUser = localStorage.getItem('redux_user');

    return {
      user: user ? JSON.parse(user) : null,
      accessToken,
      refreshToken,
      reduxUser: reduxUser ? JSON.parse(reduxUser) : null,
    };
  } catch (error) {
    console.error('Error reading from storage:', error);
    return { user: null, accessToken: null, refreshToken: null, reduxUser: null };
  }
};
