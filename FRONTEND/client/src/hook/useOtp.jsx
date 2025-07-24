import { useEffect, useState } from 'react';

import { useLocalStorage } from '../hook/useLocalStorage';
import { logError } from '../log/logger';
import { sendResetPasswordOtp, verifyResetPasswordRequest } from '../service/AuthService';

const COUNTDOWN_DURATION = 100;

export const useOtp = () => {
  const [localData, setLocalData] = useLocalStorage('resetPasswordSession', {
    email: '',
    resetToken: '',
  });

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

  const sendOtp = async (email) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendResetPasswordOtp(email);

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

      const response = await verifyResetPasswordRequest(otpValue, localData.email);
      setIsVerified(true);

      setLocalData(() => ({
        email: '',
        resetToken: response.token,
      }));

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

    try {
      await verifyOtp(otpString.trim());
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
