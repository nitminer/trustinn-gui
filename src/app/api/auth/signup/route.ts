import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { firstName, lastName, email, phone, password, confirmPassword, termsAccepted } = await request.json();

    // 1️⃣ Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // 2️⃣ Password match check
    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // 3️⃣ Password length check
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 4️⃣ Terms accepted
    if (!termsAccepted) {
      return NextResponse.json(
        { message: 'You must accept the Terms and Conditions' },
        { status: 400 }
      );
    }

    // 5️⃣ Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 6️⃣ Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // 7️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8️⃣ Create user directly (no OTP required for demo team)
    const user = new User({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      isEmailVerified: true, // Auto-verify for demo team
      noOfTrails: 5,
      hasPremium: false
    });

    await user.save();

    console.log('User created directly (OTP skipped):', email);

    return NextResponse.json(
      { message: 'Signup successful! You can now login.', userId: user._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Server error during signup' },
      { status: 500 }
    );
  }
}