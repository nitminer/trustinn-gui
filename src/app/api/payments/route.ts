import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Subscription from '@/lib/models/Subscription';
import User from '@/lib/models/User';

// GET - Fetch payment by transaction ID
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const email = searchParams.get('email');

    let query: any = {};
    if (transactionId) {
      query.transactionId = transactionId;
    }
    if (email) {
      query.email = email.toLowerCase();
    }

    if (!transactionId && !email) {
      return NextResponse.json(
        { message: 'transactionId or email parameter is required' },
        { status: 400 }
      );
    }

    const payments = await Payment.find(query);

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { message: 'Payments not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new payment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const {
      email,
      userId,
      subscriptionId,
      amount,
      currency,
      paymentMethod,
      transactionId,
      description,
      plan,
      billingPeriod,
      metadata
    } = await request.json();

    // Validate required fields
    if (!email || !amount || !paymentMethod || !transactionId || !plan) {
      return NextResponse.json(
        { message: 'Email, amount, paymentMethod, transactionId, and plan are required' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return NextResponse.json(
        { message: 'Payment with this transaction ID already exists' },
        { status: 409 }
      );
    }

    // Create payment
    const payment = new Payment({
      email: email.toLowerCase(),
      userId,
      subscriptionId,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      status: 'completed',
      transactionId,
      description,
      plan,
      billingPeriod: billingPeriod || 'monthly',
      metadata: metadata || {}
    });

    await payment.save();

    return NextResponse.json(
      {
        message: 'Payment recorded successfully',
        payment
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - Update payment status
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const { transactionId, status } = await request.json();

    if (!transactionId || !status) {
      return NextResponse.json(
        { message: 'transactionId and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    const payment = await Payment.findOneAndUpdate(
      { transactionId },
      { status },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment (for refunds)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { message: 'transactionId parameter is required' },
        { status: 400 }
      );
    }

    const payment = await Payment.findOneAndDelete({ transactionId });

    if (!payment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
