import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { logError } from '../log/logger';
import { sendResetPasswordOtp, verifyResetPasswordRequest } from '../service/AuthService';

export const useOtp = () => {
  const email = useSelector((state) => state.otp.email);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const sendOtp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await sendResetPasswordOtp(email);
      setTimeLeft(120);
      setCanResend(false);
      resetOtp();
      return response;
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otpValue) => {
    try {
      setIsVerifying(true);
      setError(null);

      const response = await verifyResetPasswordRequest(otpValue, email);
      setIsVerified(true);

      return response;
    } catch (err) {
      setError(err.message || 'Verification failed');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpSubmit = async (otpString) => {
    setOtp(otpString);
    setError(null);

    try {
      await verifyOtp(otpString);
    } catch (err) {
      logError('OTP verification failed:', err);
    }
  };

  const resetOtp = () => {
    setOtp('');
    setIsVerified(false);
    setIsVerifying(false);
    setError(null);
  };

  return {
    otp,
    isLoading,
    canResend,
    error,
    isVerified,
    isVerifying,
    timeLeft,
    sendOtp,
    resetOtp,
    handleOtpSubmit,
  };
};

export default useOtp;
