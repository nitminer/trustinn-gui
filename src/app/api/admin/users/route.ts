import { NextRequest, NextResponse } from 'next/server';

// Connect to MongoDB
let mongoose: any = null;
let User: any = null;
let Subscription: any = null;

async function connectDB() {
  if (mongoose && mongoose.connections[0].readyState === 1) {
    return;
  }

  try {
    const mongooseModule = await import('mongoose');
    mongoose = mongooseModule;

    if (!mongoose.connections[0] || mongoose.connections[0].readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustinn');
    }

    // Define models if not already defined
    if (!User) {
      const userSchema = new mongoose.Schema({
        firstName: String,
        lastName: String,
        email: { type: String, unique: true, required: true },
        password: String,
        phone: String,
        plan: { type: String, default: 'Basic' },
        status: { type: String, default: 'Active' },
        hasPremium: { type: Boolean, default: false },
        premiumToken: String,
        trialExceeded: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        termsAccepted: Boolean,
      });
      User = mongoose.models.User || mongoose.model('User', userSchema);
    }

    if (!Subscription) {
      const subscriptionSchema = new mongoose.Schema({
        email: { type: String, index: true },
        userId: mongoose.Schema.Types.ObjectId,
        plan: String,
        amountPaid: Number,
        currency: String,
        startDate: Date,
        endDate: Date,
        isActive: { type: Boolean, default: true },
        autoRenew: { type: Boolean, default: true },
        paymentId: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      });
      Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

// Verify admin middleware
function verifyAdminToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // For now, we'll just verify the token exists
    // In production, verify the JWT token and check admin email
    // This is a simplified check - you should use proper JWT verification
    return { valid: true, token };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

// GET all users
export async function GET(req: NextRequest) {
  try {
    // Verify admin token
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({}, { password: 0 }).lean();

    // Add premium status to each user
    const usersWithStatus = await Promise.all(
      users.map(async (user: any) => {
        // Check both Subscription model and User's hasPremium flag
        const subscription = await Subscription?.findOne({
          userId: user._id,
          isActive: true,  // Changed from status: 'active' to isActive: true
        }).lean();
        
        // Also check user's hasPremium flag for redundancy
        const isPremium = !!subscription || user.hasPremium;
        
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          createdAt: user.createdAt,
          isPremium: isPremium,
          currentPlan: subscription?.plan || user.plan || (isPremium ? 'Premium' : 'Free'),
        };
      })
    );

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(req: NextRequest) {
  try {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// POST new user
export async function POST(req: NextRequest) {
  try {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, password } = body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password (simplified - use bcrypt in production)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      termsAccepted: true,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT update user
export async function PUT(req: NextRequest) {
  try {
    const auth = verifyAdminToken(req);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const body = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(userId, body, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
