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
