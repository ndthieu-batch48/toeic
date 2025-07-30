import { useEffect, useState } from 'react';

import { logError } from '../log/logger';
import { sendOtpRequest, verifyOtpRequest } from '../service/AuthService';
import { getOtpSession, updateOtpSession } from '../utils/localStorageUtil';

const COUNTDOWN_DURATION = 60;

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

  const sendOtp = async ({ credential_value, credential_type, purpose }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendOtpRequest({ credential_value, credential_type, purpose });

      setIsVerified(false);
      setTimeLeft(COUNTDOWN_DURATION); // Reset countdown when sending new OTP

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
      const otpSession = getOtpSession();
      const response = await verifyOtpRequest(otpValue, otpSession.purpose);
      updateOtpSession({ token: response.token });
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
