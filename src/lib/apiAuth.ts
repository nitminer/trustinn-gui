import { NextRequest } from 'next/server';
import User from '@/lib/models/User';

/**
 * Middleware to verify user authentication and extract user from request
 * Can be used in API endpoints to ensure only authenticated users can access
 */
export async function verifyUserInRequest(request: NextRequest): Promise<{ userId: string | null; user: any | null; error: string | null }> {
  try {
    // Try to get user ID from custom header (set by frontend)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      // Try to get from cookies (backup method)
      const cookieUserId = request.cookies.get('userId')?.value;
      if (!cookieUserId) {
        return {
          userId: null,
          user: null,
          error: 'No user ID found'
        };
      }
      return {
        userId: cookieUserId,
        user: null,
        error: null
      };
    }

    // Fetch user from database to verify existence
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return {
        userId: userId,
        user: null,
        error: 'User not found'
      };
    }

    return {
      userId: userId,
      user: user,
      error: null
    };
  } catch (error) {
    return {
      userId: null,
      user: null,
      error: error instanceof Error ? error.message : 'Authentication error'
    };
  }
}

/**
 * Checks if user has access to execute tools
 * Returns true if user is premium or has remaining trials
 */
export function userHasAccess(user: any): boolean {
  return user.isPremium || (user.trialCount && user.trialCount > 0);
}

/**
 * Checks if user needs to consume a trial
 * Returns true if user is not premium (meaning they'll consume a trial)
 */
export function shouldConsumeTrial(user: any): boolean {
  return !user.isPremium;
}
