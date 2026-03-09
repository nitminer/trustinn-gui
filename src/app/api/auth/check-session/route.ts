import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * POST /api/auth/check-session
 * Checks if user session is valid and has access to premium features
 * 
 * Security:
 * - Requires valid user ID in request body
 * - Verifies user exists in database
 * - Returns user's current trial and premium status
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId).select(
      'name email role isPremium trialCount subscription'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if subscription is still active
    const now = new Date();
    const isSubscriptionActive = 
      user.subscription?.status === 'active' && 
      user.subscription?.endDate &&
      new Date(user.subscription.endDate) > now;

    // Determine access status
    const hasAccess = user.isPremium || user.trialCount > 0;
    const accessReason = user.isPremium 
      ? 'premium' 
      : user.trialCount > 0 
        ? 'trial' 
        : 'no_access';

    return NextResponse.json({
      isValid: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        trialCount: user.trialCount,
        subscription: user.subscription
      },
      access: {
        hasAccess,
        reason: accessReason, // 'premium', 'trial', or 'no_access'
        trialCount: user.trialCount,
        subscriptionActive: isSubscriptionActive
      }
    });
  } catch (error) {
    console.error('Check session error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/check-session
 * Returns current user session info (called without requiring userId in body)
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Try to get userId from cookies or headers
    const cookies = request.cookies;
    const userId = cookies.get('userId')?.value;

    // If no userId in cookies, return unauthenticated status
    if (!userId) {
      return NextResponse.json({
        isValid: false,
        user: null,
        access: {
          hasAccess: false,
          reason: 'not_authenticated'
        }
      });
    }

    // Find user
    const user = await User.findById(userId).select(
      'name email role isPremium trialCount subscription'
    );

    if (!user) {
      return NextResponse.json({
        isValid: false,
        user: null,
        access: {
          hasAccess: false,
          reason: 'user_not_found'
        }
      });
    }

    // Check if subscription is still active
    const now = new Date();
    const isSubscriptionActive = 
      user.subscription?.status === 'active' && 
      user.subscription?.endDate &&
      new Date(user.subscription.endDate) > now;

    // Determine access status
    const hasAccess = user.isPremium || user.trialCount > 0;
    const accessReason = user.isPremium 
      ? 'premium' 
      : user.trialCount > 0 
        ? 'trial' 
        : 'no_access';

    return NextResponse.json({
      isValid: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        trialCount: user.trialCount,
        subscription: user.subscription
      },
      access: {
        hasAccess,
        reason: accessReason,
        trialCount: user.trialCount,
        subscriptionActive: isSubscriptionActive
      }
    });
  } catch (error) {
    console.error('Check session error (GET):', error);
    return NextResponse.json(
      { isValid: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
