import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header OR from httpOnly cookie
    const authHeader = request.headers.get('Authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no token in header, get from httpOnly cookie
    if (!token) {
      token = request.cookies.get('authToken')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: 'No token provided', authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'trustinn-secret-key-2026-nitminer'
    );

    // Connect to database
    await dbConnect();

    // Fetch fresh user data from database using id from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found', authenticated: false },
        { status: 404 }
      );
    }

    // Return premium and trial status
    return NextResponse.json({
      authenticated: true,
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      hasPremium: user.hasPremium,
      noOfTrails: user.noOfTrails,
      trialExceeded: user.trialExceeded
    });
  } catch (error: any) {
    console.error('Verify status error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: 'Invalid token', authenticated: false },
        { status: 401 }
      );
    }

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { message: 'Token expired', authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Server error', authenticated: false },
      { status: 500 }
    );
  }
}
