import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useReduxAlert } from '../../hook/useReduxAlert';
import { resetPassword } from '../../service/AuthService';
import { getOtpSession, clearOtpSession } from '../../utils/localStorageUtil';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useReduxAlert();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);

  const otpSession = useMemo(() => getOtpSession(), []);

  useEffect(() => {
    if (!otpSession.token) {
      navigate('/send-reset-password', { replace: true });
    }
  }, [otpSession, navigate]);

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
      const res = await resetPassword(otpSession.token, newPassword);
      showSuccess(res.message || 'Password reset successfully');
      clearOtpSession();
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (error) {
      showError(error.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setIsShowPassword((prev) => !prev);
  };

  const toggleShowConfirmPassword = () => {
    setIsShowConfirmPassword((prev) => !prev);
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
                    <div className="position-relative">
                      <input
                        type={isShowPassword ? 'text' : 'password'}
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
                          paddingRight: '3rem',
                        }}
                      />
                      <button
                        type="button"
                        className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                        onClick={toggleShowPassword}
                        disabled={submitting}
                        style={{
                          right: '0.5rem',
                          zIndex: 10,
                        }}>
                        {isShowPassword ? (
                          <i className="bi bi-eye-slash fs-5"></i>
                        ) : (
                          <i className="bi bi-eye fs-5"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label w-100 mb-3">
                      Confirm New Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={isShowConfirmPassword ? 'text' : 'password'}
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
                          paddingRight: '3rem',
                        }}
                      />
                      <button
                        type="button"
                        className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                        onClick={toggleShowConfirmPassword}
                        disabled={submitting}
                        style={{
                          right: '0.5rem',
                          zIndex: 10,
                        }}>
                        {isShowConfirmPassword ? (
                          <i className="bi bi-eye-slash fs-5"></i>
                        ) : (
                          <i className="bi bi-eye fs-5"></i>
                        )}
                      </button>
                    </div>
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
