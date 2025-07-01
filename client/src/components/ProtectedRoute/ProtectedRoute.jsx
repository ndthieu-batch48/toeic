import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user);
  useEffect(() => {
    if (!user.isAuthInitialized) {
      const timeout = setTimeout(() => {
        window.location.href = '/login';
      }, 5000); // Timeout sau 5 giây
      return () => clearTimeout(timeout);
    }
  }, [user.isAuthInitialized]);

  if (!user.isAuthInitialized) {
    return (
      <div className="loading-container-authen">
        <h3>Checking authentication...</h3>
      </div>
    );
  }

  if (!user.isLoggedIn || !user.id) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
