import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header OR from httpOnly cookie
    const authHeader = request.headers.get('authorization');
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // If no token in header, try to get from cookies
    if (!token) {
      token = request.cookies.get('authToken')?.value || null;
    }

    const { deviceId } = await request.json();

    // Validate input
    if (!token || !deviceId) {
      return NextResponse.json(
        { message: 'Token and deviceId required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'trustinn-secret-key-2026-nitminer'
    ) as any;

    // Return validation result
    return NextResponse.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email
      }
    });
  } catch (err) {
    console.error('Token validation error:', err);
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}