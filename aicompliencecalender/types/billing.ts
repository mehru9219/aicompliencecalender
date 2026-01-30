/**
 * Billing and subscription types.
 */

import type { Id } from "@/convex/_generated/dataModel";

// Plan identifiers
export type PlanId = "starter" | "professional" | "business";
export type BillingCycle = "monthly" | "yearly";

// Subscription statuses from Stripe
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

// Plan feature limits (-1 = unlimited)
export interface PlanFeatures {
  users: number;
  deadlines: number;
  storage: number; // GB
  emailAlerts: boolean;
  smsAlerts: boolean;
  formPreFills: number;
  customBranding?: boolean;
  prioritySupport?: boolean;
  apiAccess?: boolean;
}

// Plan definition
export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // cents
  priceYearly: number; // cents
  // Aliases for components
  monthlyPrice: number; // cents
  yearlyPrice: number; // cents
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: PlanFeatures;
  popular?: boolean;
}

// Subscription record
export interface Subscription {
  _id: Id<"subscriptions">;
  orgId: Id<"organizations">;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
}

// Usage record
export interface Usage {
  _id: Id<"usage">;
  orgId: Id<"organizations">;
  month: string; // "YYYY-MM" format
  deadlinesCreated: number;
  documentsUploaded: number;
  storageUsedBytes: number;
  formPreFills: number;
  alertsSent: number;
}

// Limit check result
export interface LimitCheckResult {
  allowed: boolean;
  remaining: number | null;
  limit: number | "unlimited";
  current: number;
}

// Trial status
export interface TrialStatus {
  inTrial: boolean;
  daysRemaining: number;
  trialEnd: number | null;
  expired: boolean;
}

// Usage metric types
export type UsageMetric =
  | "deadlines"
  | "storage"
  | "formPreFills"
  | "users"
  | "alertsSent";

// Checkout session request
export interface CheckoutRequest {
  orgId: string;
  priceId: string;
}

// Billing portal request
export interface PortalRequest {
  orgId: string;
}
