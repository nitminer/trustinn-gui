import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Define PricingPlan Schema
const pricingPlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    unique: true,
    enum: ['trial', 'starter', 'professional', 'enterprise']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  trialDays: {
    type: Number,
    required: true,
    default: 7
  },
  trialExecutions: {
    type: Number,
    required: true,
    default: 5
  },
  executionsPerMonth: {
    type: Number,
    required: true,
    default: 10
  },
  storageGB: {
    type: Number,
    required: true,
    default: 5
  },
  supportLevel: {
    type: String,
    enum: ['community', 'email', 'priority', '24/7'],
    default: 'community'
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    included: {
      type: Boolean,
      default: true
    }
  }],
  toolsIncluded: [{
    name: {
      type: String,
      enum: ['CBMC', 'KLEE', 'KLEEMA', 'TX', 'gMCov', 'gMutant', 'VeriSol'],
      required: true
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    required: true,
    default: 0
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  badge: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

let PricingPlan: any;

// Get MongoDB connection
async function connectDB() {
  try {
    if (mongoose.connections[0].readyState === 1) {
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustinn');
    
    if (!PricingPlan) {
      PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// GET all pricing plans (public)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error: any) {
    console.error('Error fetching pricing plans:', error.message);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch pricing plans', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// POST create new pricing plan (admin only)
export async function POST(req: NextRequest) {
  try {
    const adminToken = req.headers.get('authorization');
    
    if (!adminToken || adminToken !== 'Bearer admin-authorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();

    // Validate required fields
    if (!body.planName || !body.displayName || !body.description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: planName, displayName, description' },
        { status: 400 }
      );
    }

    const newPlan = new PricingPlan(body);
    const savedPlan = await newPlan.save();

    return NextResponse.json(
      { success: true, message: 'Pricing plan created successfully', plan: savedPlan },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create pricing plan', error: error.message },
      { status: 500 }
    );
  }
}
