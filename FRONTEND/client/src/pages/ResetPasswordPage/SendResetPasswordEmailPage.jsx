import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useOtp } from '../../hook/useOtp';
import { useReduxAlert } from '../../hook/useReduxAlert';
import { createOtpSession } from '../../utils/localStorageUtil';

const SendResetPasswordEmailPage = () => {
  const navigate = useNavigate();

  const { showError, showSuccess } = useReduxAlert();
  const { sendOtp, isLoading, error: otpError } = useOtp();

  const [error, setError] = useState('');
  const [credential, setCredential] = useState('');

  const validateForm = () => {
    if (!credential) {
      setError('Please enter your email or username');
      return false;
    }

    const isEmail = credential.includes('@');

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credential)) {
        setError('Please enter a valid email address');
        return false;
      }
      return 'email';
    }

    return 'email'; // Set credential_type email for both cases

    //TODO: Implement phone credential logic
    // const isPhone = /^\d{9,11}$/.test(credential);
    // if (isPhone) {
    //   return 'phone';
    // }
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCredential(value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const credential_type = validateForm();
    if (!credential_type) return;

    const response = await sendOtp({
      credential_value: credential,
      credential_type,
      purpose: 'reset_password',
    });
    createOtpSession({
      credential_value: credential,
      credential_type,
      purpose: 'reset_password',
      token: '',
    });

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
              <h2 className="card-title text-center mb-3">Reset Your Password</h2>
              <p className="text-center text-muted mb-4">
                We’ll send a verification code if the <strong>Email</strong> or{' '}
                <strong>Username</strong> matches an existing account.
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
                    placeholder="Email or Username"
                    value={credential}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    style={{ fontSize: '1.25rem', padding: '15px' }}
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
                    'Send Verification Code'
                  )}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                <small className="text-muted">
                  Already have your password? <Link to="/login">Back to Login</Link>
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
