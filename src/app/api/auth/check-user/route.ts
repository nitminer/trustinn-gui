import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required', exists: false },
        { status: 400 }
      );
    }

    // Check if user exists by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      return NextResponse.json(
        { message: 'User found', exists: true, user: { id: user._id, email: user.email } },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'User not found', exists: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { message: 'An error occurred', exists: false },
      { status: 500 }
    );
  }
}
