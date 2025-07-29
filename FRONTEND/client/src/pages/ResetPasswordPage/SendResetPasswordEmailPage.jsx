import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useOtp } from '../../hook/useOtp';
import { useReduxAlert } from '../../hook/useReduxAlert';

const SendResetPasswordEmailPage = () => {
  const navigate = useNavigate();

  const { showError, showSuccess } = useReduxAlert();
  const { sendOtp, isLoading, error: otpError } = useOtp();

  const [error, setError] = useState('');
  const [credential, setCredential] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!credential) {
      setError('Email or username is required');
      return false;
    }

    const isEmail = credential.includes('@');
    if (isEmail && !validateEmail(credential)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setCredential(value);

    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const response = await sendOtp(credential);
    if (otpError) {
      setError(otpError);
      showError(otpError);
    } else if (response) {
      showSuccess(response.message);
      navigate('/otp');
    }
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
                {(error || otpError) && (
                  <div className="alert alert-danger" role="alert">
                    {error || otpError}
                  </div>
                )}

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter your Email or User name"
                    value={credential}
                    onChange={handleEmailChange}
                    disabled={isLoading}
                    required
                    style={{ fontSize: '1.5rem', padding: '15px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
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
