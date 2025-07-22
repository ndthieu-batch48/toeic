import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useReduxAlert } from '../../hook/useReduxAlert';
import { resetPassword } from '../../service/AuthService';

const ResetPasswordPage = () => {
  const email = useSelector((state) => state.otp.email);
  const navigate = useNavigate();

  const { showSuccess, showError } = useReduxAlert();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!email) {
      showError('Session expired. Please start the password reset process again.');
      navigate('/send-reset-password');
    }
  }, [email, navigate, showError]);

  if (!email) {
    navigate('/send-reset-password');
    return null;
  }

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
      const res = await resetPassword(email, newPassword);
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

  return (
    <div
      className="container-fluid d-flex align-items-center justify-content-center bg-light"
      style={{ minHeight: '70vh' }}>
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <div
                className="container d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: '300px' }}>
                <h2 className="mb-3">🔐 Reset Your Password</h2>

                <form onSubmit={handleSubmit} className="w-100">
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="form-label w-100">
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
                      disabled={submitting}
                      style={{
                        height: '3.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label w-100 mb-3">
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
                      disabled={submitting}
                      style={{
                        height: '3.5rem',
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </div>

                  <div className="d-flex justify-content-center mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary py-3 px-4 fs-5 w-100"
                      disabled={submitting}
                      style={{ borderRadius: '0.5rem' }}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
