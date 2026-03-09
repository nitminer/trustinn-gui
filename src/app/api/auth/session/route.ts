import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

/**
 * GET /api/auth/session
 * Returns current session information
 * 
 * This endpoint provides session status for TrustInn application
 * It can be called with optional userId parameter to get session details
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: You can extract userId from headers, cookies, or query params
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          message: 'No active session'
        },
        { status: 200 }
      );
    }

    await dbConnect();

    // Get user session data
    const user = await User.findById(userId).select(
      'name email role isPremium trialCount subscription isEmailVerified'
    );

    if (!user) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          message: 'User not found'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
          trialCount: user.trialCount,
          isEmailVerified: user.isEmailVerified,
          subscription: user.subscription
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/auth/session] Error:', error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: 'Failed to retrieve session'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/session
 * Validates and returns session information
 * 
 * Request body:
 * {
 *   "userId": "user_id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          message: 'User ID required'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId).select(
      'name email role isPremium trialCount subscription isEmailVerified'
    );

    if (!user) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          message: 'User session invalid'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
          trialCount: user.trialCount,
          isEmailVerified: user.isEmailVerified,
          subscription: user.subscription
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/auth/session] Error:', error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: 'Failed to validate session'
      },
      { status: 500 }
    );
  }
}
