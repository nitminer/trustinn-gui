import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * POST /api/auth/get-trial-count
 * Fetches user's trial count from database by email
 * 
 * Security:
 * - Only returns trial count and premium status
 * - Always fetches fresh from database
 * - No caching
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[get-trial-count] Fetching trial count from database...');
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.warn('[get-trial-count] User not found:', email);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[get-trial-count] Trial count fetched:', {
      email: user.email,
      trialCount: user.trialCount,
      isPremium: user.isPremium
    });

    return NextResponse.json({
      message: 'Trial count fetched successfully',
      email: user.email,
      trialCount: user.trialCount,
      isPremium: user.isPremium,
      isEmailVerified: user.isEmailVerified
    });
  } catch (error) {
    console.error('[get-trial-count] Error:', error);
    return NextResponse.json(
      { 
        message: 'Server error fetching trial count',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
