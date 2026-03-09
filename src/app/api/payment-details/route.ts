import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4040';

// GET payment details
export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/payment-details`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch payment details' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment details', error: error.message },
      { status: 500 }
    );
  }
}

// PUT update payment details (admin only)
export async function PUT(req: NextRequest) {
  try {
    const adminToken = req.headers.get('authorization');

    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const response = await fetch(`${API_BASE}/api/payment-details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': adminToken
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to update payment details' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating payment details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment details', error: error.message },
      { status: 500 }
    );
  }
}
