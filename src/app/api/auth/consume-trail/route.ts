import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * POST /api/auth/consume-trail
 * Consumes one trial for a user and updates their trial count
 * 
 * Security:
 * - Requires user ID or email
 * - Only consumes trial if user is not premium
 * - Validates user exists
 * - Returns updated user data from database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[consume-trail] Starting trial consumption...');
    
    await dbConnect();

    const { userId, email } = await request.json();

    if (!userId && !email) {
      console.warn('[consume-trail] Neither userId nor email provided');
      return NextResponse.json(
        { message: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Find user by ID or email
    let user;
    if (userId) {
      user = await User.findById(userId);
      console.log('[consume-trail] User lookup by ID:', userId, user ? 'found' : 'not found');
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      console.log('[consume-trail] User lookup by email:', email, user ? 'found' : 'not found');
    }
    
    if (!user) {
      console.warn('[consume-trail] User not found');
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[consume-trail] User found:', {
      email: user.email,
      currentTrials: user.trialCount,
      isPremium: user.isPremium
    });

    // If user has premium, don't consume trial
    if (user.isPremium) {
      console.log('[consume-trail] User is premium - no trial consumed');
      return NextResponse.json({
        message: 'Premium user - no trials consumed',
        trialConsumed: false,
        trialCount: user.trialCount,
        isPremium: true
      });
    }

    // Check if trials are already exhausted
    if (user.trialCount <= 0) {
      console.warn('[consume-trail] Trials exhausted for user:', user.email);
      return NextResponse.json(
        {
          message: 'No trials remaining. Please subscribe to continue.',
          trialConsumed: false,
          trialCount: 0,
          trialExhausted: true
        },
        { status: 403 }
      );
    }

    // Decrement trial count
    const previousCount = user.trialCount;
    user.trialCount = Math.max(0, user.trialCount - 1);
    await user.save();

    console.log('[consume-trail] Trial consumed successfully:', {
      email: user.email,
      previousCount,
      newCount: user.trialCount
    });

    return NextResponse.json({
      message: 'Trial consumed successfully',
      trialConsumed: true,
      trialCount: user.trialCount,
      trialExhausted: user.trialCount === 0,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        trialCount: user.trialCount
      }
    });
  } catch (error) {
    console.error('[consume-trail] Error:', error);
    return NextResponse.json(
      { 
        message: 'Server error during trial consumption',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
