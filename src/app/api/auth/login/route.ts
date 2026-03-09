import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    // 1️⃣ Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3️⃣ Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4️⃣ Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        hasPremium: user.hasPremium,
        noOfTrails: user.noOfTrails,
        trialExceeded: user.trialExceeded
      },
      process.env.JWT_SECRET || 'trustinn-secret-key-2026-nitminer',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', email);

    // 5️⃣ Set cookie using Next.js cookies API
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    // 6️⃣ Return response
    return NextResponse.json(
      {
        message: 'Login successful',
        token: token,
        deviceId: user._id.toString(),
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          hasPremium: user.hasPremium,
          noOfTrails: user.noOfTrails,
          trialExceeded: user.trialExceeded
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}