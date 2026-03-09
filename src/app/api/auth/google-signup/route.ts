import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { googleId, firstName, lastName, email, profileImage } = await request.json();

    // Validate required fields
    if (!googleId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Missing required fields from Google' },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, generate token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      const response = NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            hasPremium: user.hasPremium,
            noOfTrails: user.noOfTrails,
          },
        },
        { status: 200 }
      );

      // Set httpOnly cookie
      response.cookies.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // Create new user with Google credentials
    // Generate a random password for Google users (they won't use it)
    const randomPassword = Math.random().toString(36).slice(-12);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: '+1-000-000-0000', // Placeholder phone for Google users (can be updated later)
      password: randomPassword,
      termsAccepted: true, // Assume terms accepted for social login
      hasPremium: false,
      noOfTrails: 5,
      trialExceeded: false,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      {
        message: 'Account created and login successful',
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          hasPremium: newUser.hasPremium,
          noOfTrails: newUser.noOfTrails,
        },
      },
      { status: 201 }
    );

    // Set httpOnly cookie
    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Google signup error:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
