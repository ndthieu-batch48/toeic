import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useReduxAlert } from '../../hook/useReduxAlert';
import { resetPassword } from '../../service/AuthService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { showSuccess, showError } = useReduxAlert();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      showError('Invalid or missing reset token');
      navigate('/send-reset-password');
    }
  }, [token, navigate, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await resetPassword(token, newPassword);
      showSuccess(res.message || 'Password reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      showError(error.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          Invalid or missing reset token. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: '480px' }}>
        <div className="card-body p-4">
          <h3 className="mb-4 text-center">🔐 Reset Your Password</h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                id="newPassword"
                placeholder="Enter new password (min 6 characters)"
                required
                minLength="6"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                placeholder="Re-enter new password"
                required
                minLength="6"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
