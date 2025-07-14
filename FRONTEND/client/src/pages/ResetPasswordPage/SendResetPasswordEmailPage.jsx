import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useReduxAlert } from '../../hook/useReduxAlert';
import { sendResetPasswordRequest } from '../../service/AuthService';

const SendResetPasswordEmailPage = () => {
  const { showSuccess, showError } = useReduxAlert();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!email) {
      setError('Please enter your email');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await sendResetPasswordRequest(email);
      setEmailSent(true);
      setTimeLeft(120);
      setCanResend(false);
      showSuccess(response.message);
    } catch (error) {
      console.error('Error sending reset email:', error);
      setError('Failed to send reset email. Please try again.');
      showError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!validateForm()) return;

    setIsResending(true);
    setError('');

    try {
      const response = await sendResetPasswordRequest(email);
      setTimeLeft(120);
      setCanResend(false);
      showSuccess(response.message);
    } catch (error) {
      console.error('Error resending reset email:', error);
      setError('Failed to resend reset email. Please try again.');
      showError('Failed to resend reset email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (error) setError('');
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-3">RESET PASSWORD</h2>
              <p className="text-center text-muted mb-4">
                Enter your email address and we&apos;ll send you a link to reset your password
              </p>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {emailSent && (
                  <div className="alert alert-success" role="alert">
                    <strong>Email sent!</strong> Check your inbox for the reset link.
                  </div>
                )}

                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isLoading || isResending}
                    required
                    style={{ fontSize: '1.5rem', padding: '15px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isResending}
                  className="btn btn-primary w-100 py-3 mb-3 fs-5">
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} className="me-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </button>

                {emailSent && (
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={!canResend || isResending}
                      className="btn btn-outline-danger btn-sm">
                      {isResending ? (
                        <>
                          <CircularProgress size={16} className="me-1" />
                          Resending...
                        </>
                      ) : (
                        'Resend Email'
                      )}
                    </button>
                    <small className="text-danger">
                      {canResend
                        ? "Didn't receive the email?"
                        : `Resend in ${formatTime(timeLeft)}`}
                    </small>
                  </div>
                )}
              </form>

              <p className="text-center mt-3 mb-0">
                <small className="text-muted">
                  Remember your password? <Link to="/login">Back to Login</Link>
                </small>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendResetPasswordEmailPage;
