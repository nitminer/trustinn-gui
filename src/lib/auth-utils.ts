/**
 * Verify user status based on JWT token from cookies
 * Checks premium status and trial availability
 * Falls back to localStorage if endpoint not available
 */
export async function verifyUserStatus() {
  try {
    const response = await fetch('/api/auth/verify-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid or expired
        localStorage.clear();
        window.location.href = '/login';
        return null;
      }
      
      // If endpoint returns 404 or other error, try to use localStorage data as fallback
      console.warn('Verify status endpoint error:', response.status);
      const token = localStorage.getItem('authToken');
      const userEmail = localStorage.getItem('userEmail');
      
      if (token && userEmail) {
        // User has token in localStorage, assume they're authenticated
        // Use default values for premium and trails
        return {
          authenticated: true,
          email: userEmail,
          hasPremium: localStorage.getItem('hasPremium') === 'true',
          noOfTrails: parseInt(localStorage.getItem('noOfTrails') || '5'),
          trialExceeded: localStorage.getItem('trialExceeded') === 'true'
        };
      }
      
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying user status:', error);
    
    // Fallback to localStorage if fetch fails
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userEmail) {
      return {
        authenticated: true,
        email: userEmail,
        hasPremium: localStorage.getItem('hasPremium') === 'true',
        noOfTrails: parseInt(localStorage.getItem('noOfTrails') || '5'),
        trialExceeded: localStorage.getItem('trialExceeded') === 'true'
      };
    }
    
    return null;
  }
}

/**
 * Check if user can execute tools
 * Returns object with canExecute flag and reason if not
 */
export async function checkExecutionPermission() {
  // First check if user has a token in localStorage (basic auth check)
  const token = localStorage.getItem('authToken');
  const userEmail = localStorage.getItem('userEmail');
  
  if (!token || !userEmail) {
    return {
      canExecute: false,
      reason: 'NOT_AUTHENTICATED',
      message: 'Please log in to continue'
    };
  }

  // Get detailed status (may be from API or fallback from localStorage)
  const status = await verifyUserStatus();

  if (!status) {
    // If status endpoint fails but user has token, allow execution
    // This handles cases where verify-status endpoint is unavailable
    return {
      canExecute: true,
      hasPremium: localStorage.getItem('hasPremium') === 'true',
      noOfTrails: parseInt(localStorage.getItem('noOfTrails') || '5'),
      message: 'Executing with cached credentials'
    };
  }

  // Premium users can always execute
  if (status.hasPremium) {
    return {
      canExecute: true,
      hasPremium: true,
      noOfTrails: status.noOfTrails
    };
  }

  // Check if trial exceeded
  if (status.trialExceeded || status.noOfTrails <= 0) {
    return {
      canExecute: false,
      reason: 'TRIAL_EXCEEDED',
      message: 'Trial period ended. Please upgrade to premium.',
      hasPremium: false,
      noOfTrails: 0
    };
  }

  // Free trial user with remaining trails
  return {
    canExecute: true,
    hasPremium: false,
    noOfTrails: status.noOfTrails,
    message: `${status.noOfTrails} trial(s) remaining`
  };
}

/**
 * Get current user info from token
 */
export async function getCurrentUser() {
  return await verifyUserStatus();
}
