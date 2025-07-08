import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SendOTPPage = () => {
  // const navigate = useNavigate();
  // const { showSuccess, showError } = useReduxAlert();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

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

  const validateForm = () => {
    if (!pin.trim() || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('Please enter a valid 6-digit PIN');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setIsLoading(true);
    // API call logic here
    setIsLoading(false);
  };

  const handleResendPin = async () => {
    setIsResending(true);
    // API call logic here
    setTimeLeft(120);
    setCanResend(false);
    setIsResending(false);
  };

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
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
                Enter the 6-digit PIN sent to your email address
              </p>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">6-Digit PIN</label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={handlePinChange}
                    disabled={isLoading}
                    maxLength={6}
                    style={{ letterSpacing: '0.2em', fontFamily: 'monospace' }}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={!canResend || isResending}
                    className="btn btn-secondary btn-sm">
                    {isResending ? <CircularProgress size={16} /> : 'Resend PIN'}
                  </button>
                  <small className="text-muted">
                    {canResend ? 'Ready to resend' : `Resend in ${formatTime(timeLeft)}`}
                  </small>
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary w-100">
                  {isLoading ? <CircularProgress size={24} /> : 'Verify PIN'}
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

export default SendOTPPage;
