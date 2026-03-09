import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentReceiptEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, receiptHTML, firstName } = await request.json();

    if (!email || !receiptHTML) {
      return NextResponse.json(
        { message: 'Email and receipt HTML are required' },
        { status: 400 }
      );
    }

    // Send receipt email
    const emailSent = await sendPaymentReceiptEmail(
      email,
      firstName || 'User',
      receiptHTML
    );

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Receipt sent to email successfully'
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to send receipt email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending receipt:', error);
    return NextResponse.json(
      { message: 'Failed to send receipt' },
      { status: 500 }
    );
  }
}
