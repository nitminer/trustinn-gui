import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface OTPModalProps {
  isOpen: boolean;
  email: string;
  userId: string;
  onVerified: () => void;
  onClose?: () => void;
}

export function OTPVerificationModal({ isOpen, email, userId, onVerified, onClose }: OTPModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setResendDisabled(false);
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const sendOTPOnOpen = async () => {
      console.log('[OTPModal] Sending OTP automatically on modal open...');
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            userId
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('[OTPModal] Failed to send OTP:', data.message);
          setError(data.message || 'Failed to send OTP. Please try again.');
          setLoading(false);
          return;
        }

        console.log('[OTPModal] OTP sent successfully!');
        setOtp('');
        setTimeLeft(600);
        setResendCooldown(0);
        setResendDisabled(false);
        setLoading(false);
      } catch (error) {
        console.error('[OTPModal] Error sending OTP:', error);
        setError(error instanceof Error ? error.message : 'Failed to send OTP');
        setLoading(false);
      }
    };

    sendOTPOnOpen();
  }, [isOpen, email, userId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError(null);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          userId
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to verify OTP');
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      console.log('[OTPModal] Email verified successfully');
      
      // Call the callback after a short delay
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error) {
      console.error('[OTPModal] Verification error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      // Reset for new OTP
      setOtp('');
      setTimeLeft(600);
      setResendCooldown(60);
      setResendDisabled(true);
      console.log('[OTPModal] OTP resent successfully');
    } catch (error) {
      console.error('[OTPModal] Resend error:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend OTP');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 md:p-8">
        {success ? (
          // Success state
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now access all TrustInn tools.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Verify Your Email</h2>
              <p className="text-gray-600 text-sm">
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Timer */}
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                Code expires in: <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
              </p>
              {timeLeft < 60 && (
                <p className="text-xs text-red-500 mt-1">⚠️ Your code is about to expire</p>
              )}
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleInputChange}
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-3 text-center text-2xl font-bold letter-spacing-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                style={{ letterSpacing: '0.5em' }}
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-3"
            >
              {loading && <Loader className="w-5 h-5 animate-spin" />}
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResendOTP}
                disabled={resendDisabled || loading}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendDisabled ? (
                  <>Resend in {resendCooldown}s</>
                ) : (
                  <>Resend OTP</>
                )}
              </button>
            </div>

            {/* Security Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                🔒 Your email verification is secure and encrypted. Never share your OTP with anyone.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
