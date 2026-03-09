import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check for token in Authorization header first, then fallback to cookie
    const authHeader = request.headers.get('authorization');
    const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'trustinn-secret-key-2026-nitminer') as any;

    // Fetch user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (err) {
    console.error('Profile error:', err);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}