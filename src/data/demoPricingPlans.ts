export interface Feature {
  name: string;
  included: boolean;
}

export interface Tool {
  name: string;
  available: boolean;
}

export interface PricingPlan {
  _id?: string;
  planName: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  trialExecutions: number;
  executionsPerMonth: number;
  storageGB: number;
  supportLevel: 'community' | 'email' | 'priority' | '24/7';
  features: Feature[];
  toolsIncluded: Tool[];
  isActive: boolean;
  displayOrder: number;
  color: string;
  badge: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const demoPricingPlans: PricingPlan[] = [
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
  }
];
