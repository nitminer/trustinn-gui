import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

/**
 * POST /api/auth/verify-otp
 * Verifies OTP sent to user's email for email verification
 * 
 * Security:
 * - Validates OTP format and expiration
 * - Marks email as verified on success
 * - Clears OTP from database after verification
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[verify-otp] Starting OTP verification...');
    
    const { email, otp, userId } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find user by email or userId
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user && userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      console.warn('[verify-otp] User not found:', email);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      console.log('[verify-otp] User already verified:', email);
      return NextResponse.json({
        message: 'Email already verified',
        isVerified: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        }
      });
    }

    // Check if OTP exists
    if (!user.otpCode) {
      console.warn('[verify-otp] No OTP found for user:', email);
      return NextResponse.json(
        { message: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      console.warn('[verify-otp] OTP expired for user:', email);
      
      // Clear expired OTP
      user.otpCode = null;
      user.otpExpiresAt = null;
      await user.save();
      
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP matches (case-insensitive)
    if (user.otpCode !== otp.trim()) {
      console.warn('[verify-otp] Invalid OTP provided for user:', email);
      return NextResponse.json(
        { message: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // OTP is valid - mark email as verified
    console.log('[verify-otp] OTP verified successfully for user:', email);
    user.isEmailVerified = true;
    user.otpCode = null; // Clear OTP
    user.otpExpiresAt = null;
    await user.save();

    console.log('[verify-otp] User email verified and OTP cleared:', {
      email: user.email,
      userId: user._id
    });

    return NextResponse.json({
      message: 'Email verified successfully',
      isVerified: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('[verify-otp] Unhandled error:', error);
    return NextResponse.json(
      { 
        message: 'Server error during OTP verification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}