/**
 * Stripe client configuration.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Environment variable names for reference
export const STRIPE_ENV_VARS = {
  SECRET_KEY: "STRIPE_SECRET_KEY",
  PUBLISHABLE_KEY: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  WEBHOOK_SECRET: "STRIPE_WEBHOOK_SECRET",
} as const;
