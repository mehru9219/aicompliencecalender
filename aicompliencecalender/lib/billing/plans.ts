/**
 * Plan definitions and helpers.
 */

import type { Plan, PlanId, PlanFeatures, BillingCycle } from "@/types/billing";

// Re-export types for convenience
export type { BillingCycle };

// Stripe Price IDs - configure in Stripe Dashboard
// These are placeholders - replace with actual Stripe price IDs
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly:
      process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "price_starter_yearly",
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BIZ_MONTHLY || "price_biz_monthly",
    yearly: process.env.STRIPE_PRICE_BIZ_YEARLY || "price_biz_yearly",
  },
} as const;

// Plan definitions
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for solo practitioners and small practices",
    priceMonthly: 4900, // $49
    priceYearly: 49000, // $490 (2 months free)
    monthlyPrice: 4900, // alias for components
    yearlyPrice: 49000, // alias for components
    stripePriceIdMonthly: STRIPE_PRICE_IDS.starter.monthly,
    stripePriceIdYearly: STRIPE_PRICE_IDS.starter.yearly,
    features: {
      users: 1,
      deadlines: 25,
      storage: 1, // 1 GB
      emailAlerts: true,
      smsAlerts: false,
      formPreFills: 0,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Ideal for growing practices with multiple staff",
    priceMonthly: 14900, // $149
    priceYearly: 149000, // $1,490 (2 months free)
    monthlyPrice: 14900, // alias for components
    yearlyPrice: 149000, // alias for components
    stripePriceIdMonthly: STRIPE_PRICE_IDS.professional.monthly,
    stripePriceIdYearly: STRIPE_PRICE_IDS.professional.yearly,
    features: {
      users: 5,
      deadlines: -1, // unlimited
      storage: 10, // 10 GB
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: 10,
      prioritySupport: true,
    },
    popular: true,
  },
  business: {
    id: "business",
    name: "Business",
    description: "For multi-location practices and larger teams",
    priceMonthly: 29900, // $299
    priceYearly: 299000, // $2,990 (2 months free)
    monthlyPrice: 29900, // alias for components
    yearlyPrice: 299000, // alias for components
    stripePriceIdMonthly: STRIPE_PRICE_IDS.business.monthly,
    stripePriceIdYearly: STRIPE_PRICE_IDS.business.yearly,
    features: {
      users: 15,
      deadlines: -1, // unlimited
      storage: 50, // 50 GB
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: -1, // unlimited
      customBranding: true,
      prioritySupport: true,
      apiAccess: true,
    },
  },
};

// Array of plans for iteration
export const PLANS_ARRAY: Plan[] = [
  PLANS.starter,
  PLANS.professional,
  PLANS.business,
];

/**
 * Get plan by Stripe price ID.
 */
export function getPlanByPriceId(priceId: string): Plan | null {
  for (const plan of PLANS_ARRAY) {
    if (
      plan.stripePriceIdMonthly === priceId ||
      plan.stripePriceIdYearly === priceId
    ) {
      return plan;
    }
  }
  return null;
}

/**
 * Get plan by ID.
 */
export function getPlanById(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Determine billing cycle from price ID.
 */
export function getBillingCycleFromPriceId(
  priceId: string,
): "monthly" | "yearly" | null {
  for (const plan of PLANS_ARRAY) {
    if (plan.stripePriceIdMonthly === priceId) return "monthly";
    if (plan.stripePriceIdYearly === priceId) return "yearly";
  }
  return null;
}

/**
 * Get feature limit for a plan.
 */
export function getPlanLimit(
  planId: PlanId,
  feature: keyof PlanFeatures,
): number | boolean | undefined {
  return PLANS[planId].features[feature];
}

/**
 * Check if a limit is unlimited (-1).
 */
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

/**
 * Format price for display.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Calculate yearly savings.
 */
export function getYearlySavings(plan: Plan): number {
  return plan.priceMonthly * 12 - plan.priceYearly;
}

/**
 * Get price ID for plan and cycle.
 */
export function getPriceId(
  planId: PlanId,
  cycle: "monthly" | "yearly",
): string {
  const plan = PLANS[planId];
  return cycle === "monthly"
    ? plan.stripePriceIdMonthly
    : plan.stripePriceIdYearly;
}

/**
 * Feature display labels.
 */
export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  users: "Team members",
  deadlines: "Compliance deadlines",
  storage: "Document storage",
  emailAlerts: "Email alerts",
  smsAlerts: "SMS alerts",
  formPreFills: "AI form pre-fills/month",
  customBranding: "Custom branding",
  prioritySupport: "Priority support",
  apiAccess: "API access",
};

/**
 * Format feature value for display.
 */
export function formatFeatureValue(
  feature: keyof PlanFeatures,
  value: number | boolean,
): string {
  if (typeof value === "boolean") {
    return value ? "✓" : "—";
  }
  if (value === -1) {
    return "Unlimited";
  }
  if (feature === "storage") {
    return `${value} GB`;
  }
  return value.toString();
}

/**
 * Trial period in days.
 */
export const TRIAL_PERIOD_DAYS = 14;

/**
 * Default plan for new trial users.
 */
export const DEFAULT_TRIAL_PLAN: PlanId = "professional";
