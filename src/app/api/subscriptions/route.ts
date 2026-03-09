import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Subscription from '@/lib/models/Subscription';

// GET - Fetch subscription by email
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { email, userId, plan, amountPaid, endDate, currency } = await request.json();

    // Validate input
    if (!email || !plan || !amountPaid || !endDate) {
      return NextResponse.json(
        { message: 'Email, plan, amount, and endDate are required' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ email: email.toLowerCase() });
    if (existingSubscription) {
      return NextResponse.json(
        { message: 'Subscription already exists for this email' },
        { status: 409 }
      );
    }

    // Create subscription
    const subscription = new Subscription({
      email: email.toLowerCase(),
      userId,
      plan,
      amountPaid,
      endDate,
      currency: currency || 'USD',
      isActive: true,
      startDate: new Date()
    });

    await subscription.save();

    // Update user to set hasPremium to true
    await User.updateOne(
      { email: email.toLowerCase() },
      { hasPremium: true }
    );

    return NextResponse.json(
      {
        message: 'Subscription created successfully',
        subscription
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - Update subscription
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const { email, plan, amountPaid, endDate, isActive } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        ...(plan && { plan }),
        ...(amountPaid && { amountPaid }),
        ...(endDate && { endDate }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    );

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subscription
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOneAndDelete({ email: email.toLowerCase() });

    if (!subscription) {
      return NextResponse.json(
        { message: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update user to set hasPremium to false
    await User.updateOne(
      { email: email.toLowerCase() },
      { hasPremium: false }
    );

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
