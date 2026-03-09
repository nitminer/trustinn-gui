import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';
import { Types } from 'mongoose';

/**
 * POST /api/auth/me
 * Returns current user data from database
 * 
 * Security:
 * - Requires user ID
 * - Fetches fresh data from DB
 * - No sensitive data in response
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[GET /api/auth/me] Starting user fetch');
    await dbConnect();
    console.log('[GET /api/auth/me] Database connected');

    const { userId } = await request.json();
    console.log('[GET /api/auth/me] Received userId:', userId ? 'present' : 'missing');

    if (!userId) {
      console.warn('[GET /api/auth/me] No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      console.warn('[GET /api/auth/me] Invalid ObjectId format:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user from database
    console.log('[GET /api/auth/me] Querying user from database with userId:', userId);
    const user = await User.findById(userId).select(
      'name email role isPremium trialCount subscription settings isEmailVerified'
    );

    if (!user) {
      console.warn('[GET /api/auth/me] User not found in database:', userId);
      return NextResponse.json(
        { error: 'User not found', userId },
        { status: 404 }
      );
    }

    console.log('[GET /api/auth/me] User found, returning data:', {
      email: user.email,
      id: user._id,
      trialCount: user.trialCount,
      isPremium: user.isPremium
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        mongoId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        trialCount: user.trialCount,
        isEmailVerified: user.isEmailVerified,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('[GET /api/auth/me] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[GET /api/auth/me] Error details:', errorMsg);
    
    return NextResponse.json(
      { 
        error: 'Server error',
        details: errorMsg
      },
      { status: 500 }
    );
  }
}
