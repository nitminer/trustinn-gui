import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

// Use Node.js runtime for Razorpay integration
export const runtime = 'nodejs';

let razorpay: Razorpay | null = null;

function initializeRazorpay() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing');
      return null;
    }

    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpay;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, plan, amount, duration = 1, durationUnit = 'years' } = await request.json();

    if (!email || !plan) {
      return NextResponse.json(
        { message: 'Email and plan are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has premium
    if (user.hasPremium) {
      return NextResponse.json(
        { message: 'User already has premium access' },
        { status: 400 }
      );
    }

    // Initialize Razorpay
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      return NextResponse.json(
        { message: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amount || 99900, // Amount in paise (999.00 INR)
      currency: 'INR',
      receipt: `ord_${Date.now().toString().slice(-10)}`, // Max 40 chars: "ord_" + last 10 digits of timestamp
      notes: {
        email: email.toLowerCase(),
        userId: user._id.toString(),
        plan: plan,
        duration: duration,
        durationUnit: durationUnit
      }
    };

    console.log('Creating Razorpay order with options:', orderOptions);
    const order = await razorpayInstance.orders.create(orderOptions);
    console.log('Order created:', order);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      duration: duration,
      durationUnit: durationUnit,
      message: 'Order created successfully'
    });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    
    let errorMessage = 'Failed to initiate payment';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
