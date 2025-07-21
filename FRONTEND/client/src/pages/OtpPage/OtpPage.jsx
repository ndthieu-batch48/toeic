import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useOtp } from '../../hook/useOtp';
import { useReduxAlert } from '../../hook/useReduxAlert';

const OtpPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useReduxAlert();

  const {
    isLoading,
    canResend,
    error,
    isVerified,
    isVerifying,
    timeLeft,
    sendOtp,
    resetOtp,
    handleOtpSubmit,
  } = useOtp();

  const [otpInput, setOtpInput] = useState(Array(6).fill(''));
  const [isOtpComplete, setIsOtpComplete] = useState(false);

  useEffect(() => {
    if (isVerified) {
      setTimeout(() => navigate('/reset-password'), 1000);
    }
  }, [isVerified, navigate]);

  // Gộp logic update input + trạng thái complete
  const updateOtpInput = (newInput) => {
    setOtpInput(newInput);
    const isComplete = newInput.every((digit) => digit !== '');
    setIsOtpComplete(isComplete);

    if (isComplete) {
      handleOtpSubmit(newInput.join(''));
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpInput];
    newOtp[index] = value;
    updateOtpInput(newOtp);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;
    const digits = pasted.slice(0, 6).split('');
    updateOtpInput(digits);
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    const res = await sendOtp();
    if (res?.message) {
      showSuccess(res.message);
      resetOtp();
      updateOtpInput(Array(6).fill(''));
    } else {
      showError(error || 'Resend failed');
    }
  };

  const handleInputChange = (index, value, e) => {
    handleOtpChange(index, value);
    if (value && index < 5) {
      const nextInput = e.target.parentNode.children[index + 1];
      if (nextInput) nextInput.focus();
    } else if (value && index === 5) {
      e.target.blur();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevInput = e.target.parentNode.children[index - 1];
      if (prevInput) prevInput.focus();
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
                style={{ height: '200px' }}>
                <h2 className="mb-4">Enter OTP</h2>

                <form>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        className={`form-control text-center ${error ? 'border-danger' : isVerified ? 'border-success' : ''}`}
                        maxLength="1"
                        value={otpInput[index]}
                        onChange={(e) => handleInputChange(index, e.target.value, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={isVerifying || isVerified}
                        style={{
                          width: '4rem',
                          height: '4rem',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          borderRadius: '0',
                        }}
                      />
                    ))}
                  </div>

                  {isOtpComplete && !isVerifying && !isVerified && (
                    <div className="text-center mb-3">
                      <p className="text-warning">⏳ Verifying OTP...</p>
                    </div>
                  )}

                  {error && <div className="alert alert-danger text-center mb-3">{error}</div>}

                  {isVerifying && (
                    <div className="text-center mb-3">
                      <div className="spinner-border text-primary" role="status" />
                      <p className="mt-2 text-muted">Verifying OTP...</p>
                    </div>
                  )}

                  <div className="d-flex justify-content-center mb-3">
                    <button
                      type="submit"
                      onClick={handleResendOtp}
                      disabled={isLoading || !canResend}
                      className="btn btn-primary py-3 px-4 fs-5">
                      {canResend ? "Didn't receive the email?" : `Resend in ${timeLeft}s`}
                    </button>
                  </div>
                </form>

                {isVerified && (
                  <div className="text-success text-center mt-3">
                    ✅ OTP Verified! Redirecting...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
