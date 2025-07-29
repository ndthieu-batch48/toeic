import { useEffect, useState } from 'react';

import { logError } from '../log/logger';
import { sendResetPasswordOtp, verifyResetPasswordRequest } from '../service/AuthService';
import { createResetPasswordSession } from '../utils/localStorageUtil';

const COUNTDOWN_DURATION = 100;

export const useOtp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_DURATION);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const canResend = timeLeft === 0;

  const sendOtp = async (credential) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendResetPasswordOtp(credential);

      setIsVerified(false);
      setTimeLeft(COUNTDOWN_DURATION); // Reset countdown when sending new OTP

      // createResetPasswordSession(response.email, '');

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otpValue) => {
    try {
      setIsVerifying(true);
      setError(null);

      const response = await verifyResetPasswordRequest(otpValue, session.email);
      setIsVerified(true);

      return response;
    } catch (err) {
      setError(err.message || 'Verification failed');
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpSubmit = async (otpString) => {
    setError(null);
    const sanitizeOtp = (otp) => otp.replace(/\D/g, ''); // Thêm dòng này cho chắc kèo

    try {
      await verifyOtp(sanitizeOtp(otpString.trim()));
    } catch (err) {
      logError('OTP verification failed:', err);
    }
  };

  const resetOtp = () => {
    setIsLoading(false);
    setIsVerifying(false);
    setError(null);
    setIsVerified(false);
  };

  return {
    isLoading,
    error,
    isVerifying,
    canResend,

    // local session
    isVerified,
    timeLeft,

    sendOtp,
    resetOtp,
    handleOtpSubmit,
  };
};
