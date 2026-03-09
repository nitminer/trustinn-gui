'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { activityTracker } from '@/lib/activity-tracker';

interface UseActivityTrackingProps {
  enabled?: boolean;
  onSessionExpired?: (reason: string) => void;
  onSessionWarning?: (remainingMinutes: number) => void;
}

/**
 * Hook for tracking user activity and managing session timeout
 * 
 * Usage:
 * ```tsx
 * const { isSessionActive, trackAction } = useActivityTracking({
 *   onSessionExpired: (reason) => {
 *     console.log('Session expired:', reason);
 *   },
 *   onSessionWarning: (minutes) => {
 *     console.log('Session expiring in:', minutes, 'minutes');
 *   }
 * });
 * ```
 */
export function useActivityTracking({
  enabled = true,
  onSessionExpired,
  onSessionWarning,
}: UseActivityTrackingProps = {}) {
  const { data: session } = useSession();
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [inactiveMinutes, setInactiveMinutes] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize activity tracker
  useEffect(() => {
    if (!enabled || !session?.user?.id) return;

    const initialize = async () => {
      await activityTracker.initialize(session.user.id!);
      
      // Subscribe to session expiration
      unsubscribeRef.current = activityTracker.onSessionExpired(() => {
        setIsSessionActive(false);
        onSessionExpired?.('inactivity');
      });

      // Subscribe to session warning
      window.addEventListener('sessionWarning', (event: any) => {
        onSessionWarning?.(event.detail.remainingMinutes);
      });

      // Track initial page view
      await activityTracker.trackPageView();
    };

    initialize();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      window.removeEventListener('sessionWarning', () => {});
    };
  }, [session?.user?.id, enabled, onSessionExpired, onSessionWarning]);

  // Update inactive minutes periodically
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(async () => {
      const sessionInfo = await activityTracker.getSessionInfo();
      setInactiveMinutes(sessionInfo.inactiveMinutes);
      setIsSessionActive(sessionInfo.isActive);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Track action callback
  const trackAction = useCallback(
    async (action: string, details?: any, page?: string) => {
      await activityTracker.trackAction(action, details, page);
    },
    []
  );

  // Track page view callback
  const trackPageView = useCallback(async (pageName?: string) => {
    await activityTracker.trackPageView(pageName);
  }, []);

  // Get session info
  const getSessionInfo = useCallback(async () => {
    return await activityTracker.getSessionInfo();
  }, []);

  return {
    isSessionActive,
    inactiveMinutes,
    trackAction,
    trackPageView,
    getSessionInfo,
  };
}

export default useActivityTracking;
