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

// GET single pricing plan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const plan = await PricingPlan.findById(id).lean();

    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'Pricing plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan
    });
  } catch (error: any) {
    console.error('Error fetching pricing plan:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing plan', error: error.message },
      { status: 500 }
    );
  }
}

// PUT update pricing plan (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = req.headers.get('authorization');
    
    if (!adminToken || adminToken !== 'Bearer admin-authorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    delete body._id; // Prevent _id from being updated
    delete body.planName; // Prevent planName from being updated

    const updatedPlan = await PricingPlan.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, message: 'Pricing plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing plan updated successfully',
      plan: updatedPlan
    });
  } catch (error: any) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update pricing plan', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE pricing plan (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = req.headers.get('authorization');
    
    if (!adminToken || adminToken !== 'Bearer admin-authorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const deletedPlan = await PricingPlan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return NextResponse.json(
        { success: false, message: 'Pricing plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing plan deleted successfully',
      plan: deletedPlan
    });
  } catch (error: any) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete pricing plan', error: error.message },
      { status: 500 }
    );
  }
}


