'use client';

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';

interface SessionWarningModalProps {
  remainingMinutes: number;
  onExtendSession?: () => void;
  onLogout?: () => void;
}

/**
 * Session Warning Modal Component
 * Shows warning when user has less than 10 minutes of session remaining
 * 
 * Usage:
 * ```tsx
 * const [sessionWarning, setSessionWarning] = useState<number | null>(null);
 * 
 * useEffect(() => {
 *   const handleWarning = (event: any) => {
 *     setSessionWarning(event.detail.remainingMinutes);
 *   };
 *   
 *   window.addEventListener('sessionWarning', handleWarning);
 *   return () => window.removeEventListener('sessionWarning', handleWarning);
 * }, []);
 * 
 * return (
 *   <>
 *     {sessionWarning && (
 *       <SessionWarningModal
 *         remainingMinutes={sessionWarning}
 *         onExtendSession={() => {
 *           // Activity tracking will automatically extend session
 *           trackAction('extend_session');
 *           setSessionWarning(null);
 *         }}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */
export default function SessionWarningModal({
  remainingMinutes,
  onExtendSession,
  onLogout,
}: SessionWarningModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, [remainingMinutes]);

  if (!isVisible) return null;

  const handleExtendSession = () => {
    onExtendSession?.();
    setIsVisible(false);
  };

  const handleLogout = () => {
    onLogout?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
          <div className="flex items-start gap-4">
            <FiAlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Session Expiring Soon</h2>
              <p className="text-gray-600 text-sm mt-1">
                Your session will expire due to inactivity.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time Remaining */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FiClock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Time remaining:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {remainingMinutes}
                  <span className="text-sm ml-1">minutes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <p className="text-gray-700">
              You have been inactive for a long time. Your session will automatically log out to protect your account.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Click "Continue Session" to stay logged in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Your session will be extended for another 3 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Any activity will also extend your session</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={handleExtendSession}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Continue Session
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (remainingMinutes / 10) * 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
