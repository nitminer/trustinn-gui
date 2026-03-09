import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, Lock } from 'lucide-react';
import { NitMinerUser, redirectToNitMiner, clearSession, getStoredSessionToken } from '@/lib/jwtAuth';

interface AuthModalProps {
  isOpen: boolean;
  reason: 'no_token' | 'invalid_token' | 'session_expired' | 'no_trials' | 'unauthorized';
  message?: string;
  onClose?: () => void;
}

export function AuthModal({ isOpen, reason, message, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  const handleRedirect = () => {
    redirectToNitMiner('/login');
  };

  const handlePricing = () => {
    redirectToNitMiner('/pricing');
  };

  let title = 'Authentication Required';
  let description = message || 'Please login to continue.';
  let icon = <AlertCircle className="w-12 h-12 text-yellow-600" />;
  let buttons: { label: string; onClick: () => void; variant: 'primary' | 'secondary' }[] = [];

  switch (reason) {
    case 'no_token':
    case 'invalid_token':
      title = 'Session Not Found';
      description = 'Your session token is missing or invalid. Please login again to access TrustInn.';
      icon = <Lock className="w-12 h-12 text-red-600" />;
      buttons = [
        { label: 'Login', onClick: handleRedirect, variant: 'primary' }
      ];
      break;

    case 'session_expired':
      title = 'Session Expired';
      description = 'Your session has expired. Please login again to continue using TrustInn.';
      icon = <AlertCircle className="w-12 h-12 text-orange-600" />;
      buttons = [
        { label: 'Login Again', onClick: handleRedirect, variant: 'primary' }
      ];
      break;

    case 'no_trials':
      title = 'No Free Trials Remaining';
      description = 'You\'ve used up all your free trials. Subscribe to a premium plan to continue using TrustInn tools.';
      icon = <Zap className="w-12 h-12 text-blue-600" />;
      buttons = [
        { label: 'View Pricing Plans', onClick: handlePricing, variant: 'primary' },
        { label: 'Login Again', onClick: handleRedirect, variant: 'secondary' }
      ];
      break;

    case 'unauthorized':
      title = 'Access Denied';
      description = message || 'You do not have permission to access this resource.';
      icon = <Lock className="w-12 h-12 text-red-600" />;
      buttons = [
        { label: 'Back to Login', onClick: handleRedirect, variant: 'primary' }
      ];
      break;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          {title}
        </h2>
        
        <p className="text-gray-600 text-center mb-8">
          {description}
        </p>

        <div className="space-y-3">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                btn.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {onClose && reason === 'no_trials' && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Continue without executing
          </button>
        )}
      </div>
    </div>
  );
}

interface TrialWarningModalProps {
  isOpen: boolean;
  remainingTrials: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrialWarningModal({ isOpen, remainingTrials, onConfirm, onCancel }: TrialWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="flex justify-center mb-4">
          <Zap className="w-12 h-12 text-orange-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Confirm Execution
        </h2>
        
        <p className="text-gray-600 text-center mb-4">
          You have <span className="font-bold text-orange-600">{remainingTrials}</span> trial{remainingTrials !== 1 ? 's' : ''} remaining.
        </p>

        <p className="text-gray-600 text-center mb-8 text-sm">
          Running this tool will consume one trial. Continue with execution?
        </p>

        {remainingTrials === 1 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-6">
            <p className="text-orange-800 text-sm font-medium">
              ⚠️ This is your last free trial. After this, you'll need a premium subscription.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-2 px-4 rounded font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            Execute Tool
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 rounded font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface SessionCheckModalProps {
  isOpen: boolean;
  user: NitMinerUser;
  onClose: () => void;
  onRefresh?: (refreshedUser: NitMinerUser) => void;
}

export function SessionCheckModal({ isOpen, user, onClose, onRefresh }: SessionCheckModalProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayUser, setDisplayUser] = useState(user);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayUser(user);
      setLastUpdated(new Date());
      setSyncError(null);
    }
  }, [isOpen, user]);

  const handleRefresh = async () => {
    // Get stored token for validation
    const storedSession = getStoredSessionToken();
    if (!storedSession || !storedSession.token) {
      setSyncError('No valid session token found. Please login again.');
      console.error('[SessionCheckModal] No valid token to refresh');
      return;
    }
    
    // Validate token format (JWT should have 3 parts: header.payload.signature)
    const token = storedSession.token.trim();
    const tokenParts = token.split('.');
    
    if (tokenParts.length !== 3) {
      setSyncError('Session token is malformed. Please login again.');
      console.error('[SessionCheckModal] Invalid token format:', {
        parts: tokenParts.length,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...'
      });
      return;
    }
    
    setRefreshing(true);
    setSyncError(null);
    try {
      console.log('[SessionCheckModal] Syncing session with backend...');
      
      // Use validate-nitminer-token endpoint for full sync with backend
      const response = await fetch('/api/auth/validate-nitminer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[SessionCheckModal] Token validation refresh successful:', {
          email: data.user?.email,
          trialCount: data.user?.trialCount,
          isPremium: data.user?.isPremium
        });
        
        if (data.user) {
          setDisplayUser(data.user);
          setLastUpdated(new Date());
          setSyncError(null);
          // Pass refreshed user data to parent component
          if (onRefresh) onRefresh(data.user);
        }
      } else {
        let errorMessage = 'Failed to sync session data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.reason || errorMessage;
        } catch {
          // If response is not JSON, use default message
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        setSyncError(errorMessage);
        console.error('[SessionCheckModal] Token validation failed:', {
          message: errorMessage,
          status: response.status,
          tokenValid: tokenParts.length === 3
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error while syncing data';
      setSyncError(errorMessage);
      console.error('[SessionCheckModal] Failed to refresh user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const last = lastUpdated ? lastUpdated.toLocaleTimeString() : 'Unknown';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Session Information
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Refresh user data"
          >
            {refreshing ? '⟳' : '🔄'}
          </button>
        </div>
        
        {syncError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
            <p className="text-red-700 font-medium">Sync Error</p>
            <p className="text-red-600 text-xs mt-1">{syncError}</p>
          </div>
        )}
        
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Name</p>
            <p className="text-gray-900 font-medium">{displayUser.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Email</p>
            <p className="text-gray-900 font-medium">{displayUser.email || 'N/A'}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-gray-600 text-sm">Account Status</p>
            {displayUser.isPremium ? (
              <p className="text-green-600 font-bold">✓ Premium Active</p>
            ) : (
              <p className="text-blue-600 font-bold">Trials Remaining: {displayUser.trialCount || 0}</p>
            )}
          </div>
          <div className="pt-2 text-xs text-gray-500">
            Last updated: {last}
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 py-2 px-4 rounded font-medium transition-colors bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 border border-green-200"
          >
            {refreshing ? 'Syncing...' : '↻ Sync Data'}
          </button>
          <button
            onClick={() => {
              clearSession?.();
              onClose();
              window.location.href = window.location.pathname;
            }}
            className="flex-1 py-2 px-4 rounded font-medium transition-colors bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
          >
            Switch Account
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
