import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

// Store OTP in memory (in production, use Redis or database with TTL)
const loginOtpStore: { [email: string]: { otp: string; expiresAt: number } } = {};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRY = '7d';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if OTP exists and is valid
    const storedOTP = loginOtpStore[normalizedEmail];

    if (!storedOTP) {
      return NextResponse.json(
        { message: 'OTP not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expiresAt) {
      delete loginOtpStore[normalizedEmail];
      return NextResponse.json(
        { message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      return NextResponse.json(
        { message: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP is valid, find user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userId: user._id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Clear OTP after successful verification
    delete loginOtpStore[normalizedEmail];

    // Create response with cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log(`User logged in with OTP: ${normalizedEmail}`);

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

export { loginOtpStore };
