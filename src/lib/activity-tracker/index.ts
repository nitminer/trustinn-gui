/**
 * Activity Tracker - Tracks user activities and manages session timeouts
 * Features:
 * - Tracks page views and user actions
 * - Monitors inactivity and logs out after 3 hours
 * - Sends periodic heartbeats to server
 * - Uses IndexedDB for local caching (fast access)
 */

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 1 * 60 * 1000; // Every 1 minute

interface ActivityData {
  action: string;
  page?: string;
  details?: any;
  device?: string;
  browser?: string;
  os?: string;
  sessionId?: string;
  timestamp?: string;
}

interface StoredActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
  page?: string;
}

class ActivityTracker {
  private lastActivityTime: number = Date.now();
  private sessionId: string = '';
  private userId: string = '';
  private isInitialized: boolean = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private inactivityCheckTimer: NodeJS.Timeout | null = null;
  private db: IDBDatabase | null = null;
  private listeners: Array<(reason: string) => void> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB for fast, offline activity storage
   */
  private async initializeDatabase(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ActivityTrackerDB', 1);

      request.onerror = () => {
        console.error('IndexedDB initialization failed');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sessionInfo')) {
          db.createObjectStore('sessionInfo', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store activity in IndexedDB
   */
  private async storeActivityLocally(activity: StoredActivity): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(['activities'], 'readwrite');
        const store = transaction.objectStore('activities');
        store.add(activity);
        transaction.oncomplete = () => resolve();
      } catch (error) {
        console.error('Error storing activity locally:', error);
        resolve();
      }
    });
  }

  /**
   * Get browser and OS info
   */
  private getDeviceInfo(): {
    device: string;
    browser: string;
    os: string;
  } {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
      device = 'Mobile';
    }

    // Detect browser
    if (/Edge|Edg/.test(ua)) browser = 'Edge';
    else if (/Chrome/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';

    // Detect OS
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

    return { device, browser, os };
  }

  /**
   * Initialize activity tracker for a user
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    this.userId = userId;
    this.isInitialized = true;

    // Listen to user activity events
    this.setupActivityListeners();

    // Start heartbeat (periodic activity tracking)
    this.startHeartbeat();

    // Start inactivity check
    this.startInactivityCheck();

    console.log('[ActivityTracker] Initialized for user:', userId);
  }

  /**
   * Setup global activity listeners
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      this.updateActivity('user_action');
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track page navigation
    if ('history' in window) {
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        originalPushState.apply(window.history, args);
        this.updateActivity('page_navigation', {
          page: window.location.pathname,
        });
        return null;
      };
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      await this.sendActivityToServer('heartbeat', {
        page: window.location.pathname,
        url: window.location.href,
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Check for inactivity and logout if needed
   */
  private startInactivityCheck(): void {
    this.inactivityCheckTimer = setInterval(async () => {
      const inactiveMs = Date.now() - this.lastActivityTime;
      const inactiveMinutes = Math.floor(inactiveMs / (1000 * 60));

      // Warn at 2 hours 50 minutes
      if (inactiveMs > 2.83 * 60 * 60 * 1000 && inactiveMs < 2.85 * 60 * 60 * 1000) {
        this.notifySessionWarning(inactiveMinutes);
      }

      // Logout at 3 hours
      if (inactiveMs > INACTIVITY_TIMEOUT_MS) {
        console.warn('[ActivityTracker] Session expired due to inactivity');
        await this.logout('inactivity');
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);
  }

  /**
   * Update last activity time and send to server
   */
  async updateActivity(
    action: string,
    details?: any,
    page?: string
  ): Promise<void> {
    this.lastActivityTime = Date.now();

    const activity: StoredActivity = {
      id: `${Date.now()}_${Math.random()}`,
      userId: this.userId,
      action,
      timestamp: Date.now(),
      page: page || window.location.pathname,
    };

    // Store locally
    await this.storeActivityLocally(activity);

    // Only send to server on certain actions (not every keystroke)
    if (['page_view', 'api_call', 'tool_execution', 'logout'].includes(action)) {
      await this.sendActivityToServer(action, details, page);
    }
  }

  /**
   * Send activity to server
   */
  private async sendActivityToServer(
    action: string,
    details?: any,
    page?: string
  ): Promise<void> {
    try {
      const { device, browser, os } = this.getDeviceInfo();

      const response = await fetch('/api/activity/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          page: page || window.location.pathname,
          details,
          sessionId: this.sessionId,
          device,
          browser,
          os,
        }),
      });

      if (!response.ok) {
        console.error('Failed to track activity on server');
        return;
      }

      const result = await response.json();

      // Check if session expired on server
      if (result.sessionExpired) {
        console.warn('[ActivityTracker] Session expired on server');
        await this.logout('inactivity');
      }
    } catch (error) {
      console.error('Error sending activity to server:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageName?: string): Promise<void> {
    await this.updateActivity('page_view', {
      page: pageName || window.location.pathname,
      title: document.title,
    });
  }

  /**
   * Track specific action
   */
  async trackAction(
    action: string,
    details?: any,
    page?: string
  ): Promise<void> {
    await this.updateActivity(action, details, page);
  }

  /**
   * Get current session info
   */
  async getSessionInfo(): Promise<{
    isActive: boolean;
    inactiveMinutes: number;
    sessionDuration: number;
  }> {
    try {
      const response = await fetch('/api/activity/track', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting session info:', error);
    }

    return {
      isActive: true,
      inactiveMinutes: 0,
      sessionDuration: 0,
    };
  }

  /**
   * Logout user
   */
  async logout(reason: string = 'user_initiated'): Promise<void> {
    // Track logout
    await this.updateActivity('logout', {
      reason,
      sessionId: this.sessionId,
    });

    // Clear timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.inactivityCheckTimer) clearInterval(this.inactivityCheckTimer);

    // Notify listeners
    this.notifySessionExpired();

    // Redirect to login
    window.location.href = '/login?reason=' + reason;
  }

  /**
   * Add session expiration listener
   */
  onSessionExpired(callback: (reason: string) => void): () => void {
    const listener = callback;
    this.listeners.push(listener as any);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify session expired
   */
  private notifySessionExpired(): void {
    this.listeners.forEach((callback) => {
      callback('inactivity');
    });
  }

  /**
   * Notify session warning (1 hour before expiry)
   */
  private notifySessionWarning(remainingMinutes: number): void {
    const event = new CustomEvent('sessionWarning', {
      detail: { remainingMinutes },
    });
    window.dispatchEvent(event);
  }

  /**
   * Destroy tracker
   */
  destroy(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.inactivityCheckTimer) clearInterval(this.inactivityCheckTimer);
    this.isInitialized = false;
  }
}

// Create singleton instance
export const activityTracker = new ActivityTracker();

export default ActivityTracker;
