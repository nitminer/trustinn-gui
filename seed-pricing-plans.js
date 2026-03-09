require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

// Define PricingPlan Schema
const pricingPlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
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

const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);

// Demo pricing plans data
const demoPricingPlans = [
  // ------------------ 6 MONTHS PACK ------------------
  {
    planName: 'starter',
    displayName: '6 Months Pack',
    description: 'Pay once and enjoy 6 months of continuous platform access.',
    monthlyPrice: 0,
    yearlyPrice: 120,
    trialDays: 0,
    trialExecutions: 999999,
    executionsPerMonth: 0,
    storageGB: 0,
    supportLevel: 'email',
    features: [
      { name: 'Basic Access', included: true },
      { name: 'Email Support', included: true },
      { name: 'Up to 6 Months Validity', included: true },
      { name: 'Team Sharing', included: false },
    ],
    toolsIncluded: [],
    isActive: true,
    displayOrder: 1,
    color: '#00A8E8',
    badge: null,
  },

  // ------------------ 12 MONTHS PACK ------------------
  {
    planName: 'starter',
    displayName: '12 Months Pack',
    description: 'Best value annual subscription with full access.',
    monthlyPrice: 0,
    yearlyPrice: 200,
    trialDays: 0,
    trialExecutions: 999999,
    executionsPerMonth: 0,
    storageGB: 0,
    supportLevel: 'email',
    features: [
      { name: 'Full Access for 1 Year', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Annual Pricing Discount', included: true },
      { name: 'Team Sharing', included: true },
    ],
    toolsIncluded: [],
    isActive: true,
    displayOrder: 2,
    color: '#28C76F',
    badge: 'Best Value',
  },
];

// Seed function
async function seedPricingPlans() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trustinn');
    console.log('✓ Connected to MongoDB');

    // Drop the collection to remove unique constraints
    console.log('Dropping existing collection...');
    try {
      await mongoose.connection.collection('pricingplans').drop();
      console.log('✓ Collection dropped');
    } catch (err) {
      console.log('✓ Collection does not exist or already empty');
    }

    // Insert new pricing plans
    console.log('Inserting demo pricing plans...');
    const inserted = await PricingPlan.insertMany(demoPricingPlans);
    console.log('✓ Successfully inserted', inserted.length, 'pricing plans');

    // Verify insertion
    const count = await PricingPlan.countDocuments();
    console.log('✓ Total pricing plans in database:', count);

    // Show inserted plans
    console.log('\nInserted Pricing Plans:');
    const plans = await PricingPlan.find().select('displayName monthlyPrice yearlyPrice');
    plans.forEach(plan => {
      console.log(`  - ${plan.displayName}: $${plan.monthlyPrice}/month or $${plan.yearlyPrice}/year`);
    });

    console.log('\n✓ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pricing plans:', error);
    process.exit(1);
  }
}

// Run seed
seedPricingPlans();
