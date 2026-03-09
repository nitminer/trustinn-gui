'use client';

import React from 'react';

interface TrialExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function TrialExceededModal({
  isOpen,
  onClose,
  onUpgrade
}: TrialExceededModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Trial Period Ended
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-2">
          You've used all your free trial executions (5 runs).
        </p>
        <p className="text-gray-600 text-center mb-6">
          To continue using TrustInn tools, please upgrade to a premium plan.
        </p>

        {/* Features List */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Upgrade to Premium & Get:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Unlimited tool executions
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Advanced features & analytics
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Priority support
            </li>
            <li className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Early access to new tools
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
          >
            Upgrade Now
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          30-day money-back guarantee on all plans
        </p>
      </div>
    </div>
  );
}
