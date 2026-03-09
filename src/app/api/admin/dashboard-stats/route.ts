import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Subscription from '@/lib/models/Subscription';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if it's a demo admin token
    if (token === 'admin-authorized') {
      console.log('Using demo admin authentication');
      // Allow demo admin access
    } else {
      // Verify JWT token for real admin users
      let decoded: any;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'trustinn-secret-key-2026-nitminer'
        );
      } catch (err) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const user = await User.findById(decoded.id);
      const adminEmails = ['admin@trustinn.com', 'rajeshbyreddy95@gmail.com', 'admin@nitminer.com'];
      
      if (!user || !adminEmails.includes(user.email)) {
        return NextResponse.json(
          { message: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Get all payments with user data
    console.log('Fetching payments from database...');
    let payments: any[] = [];
    
    try {
      payments = await Payment.find()
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();
      console.log('Payments found:', payments.length);
      if (payments.length > 0) {
        console.log('First payment:', payments[0]);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      payments = [];
    }

    // Calculate statistics with safe defaults
    const totalPayments = payments.length || 0;
    const successfulPayments = (payments.filter(p => p.status === 'completed') || []).length;
    const pendingPayments = (payments.filter(p => p.status === 'pending') || []).length;
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ hasPremium: true });

    // Calculate revenue by day (last 7 days)
    const revenueByDay: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = payments
        .filter(p => {
          const pDate = new Date(p.createdAt);
          return pDate >= date && pDate < nextDate && p.status === 'completed';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      revenueByDay.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }

    // Payment methods distribution
    const paymentsByMethod: any[] = [];
    const methodCounts: { [key: string]: number } = {};

    payments.forEach(p => {
      methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
    });

    Object.entries(methodCounts).forEach(([method, count]) => {
      paymentsByMethod.push({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        count: count
      });
    });

    // Populate user details for payments
    const enrichedPayments = payments.map(p => ({
      ...p,
      user: {
        firstName: p.userId?.firstName || 'Unknown',
        lastName: p.userId?.lastName || 'User'
      }
    }));

    return NextResponse.json({
      totalRevenue,
      totalPayments,
      successfulPayments,
      pendingPayments,
      totalUsers,
      premiumUsers,
      payments: enrichedPayments,
      revenueByDay,
      paymentsByMethod
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
