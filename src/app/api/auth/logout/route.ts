import { NextRequest, NextResponse } from 'next/server';
import TokenBlacklist from '@/lib/models/TokenBlacklist';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

/**
 * POST /api/auth/logout
 * Revokes/blacklists the user's JWT token
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[logout] Starting logout procedure...');
    
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log('[logout] MongoDB connected');

    // Decode token to extract exp and user info
    let decoded: any;
    try {
      decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Token decode failed' },
        { status: 400 }
      );
    }

    const payload = decoded.payload;
    const userId = payload.id;
    const email = payload.email;
    const expiresAt = new Date(payload.exp * 1000); // Convert Unix timestamp to Date

    // Add token to blacklist
    console.log('[logout] Adding token to blacklist...');
    try {
      await TokenBlacklist.create({
        token,
        userId,
        email,
        expiresAt,
        reason: 'user_logout',
      });
      console.log('[logout] Token blacklisted successfully');
    } catch (blacklistError: any) {
      // If token already exists in blacklist, that's fine
      if (blacklistError.code === 11000) {
        console.log('[logout] Token already blacklisted');
      } else {
        throw blacklistError;
      }
    }

    // Increment tokenVersion to invalidate all existing tokens
    console.log('[logout] Incrementing tokenVersion to invalidate all existing tokens...');
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { tokenVersion: 1 } },
        { new: true }
      );
      console.log('[logout] Token version incremented:', {
        userId,
        newTokenVersion: user?.tokenVersion
      });
    } catch (versionError) {
      console.error('[logout] Failed to increment tokenVersion:', versionError);
      // Don't fail logout if version update fails - token is already blacklisted
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully logged out'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[logout] Logout error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Logout failed',
        details: errorMsg 
      },
      { status: 500 }
    );
  }
}
