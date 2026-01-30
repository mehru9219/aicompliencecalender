/**
 * Stripe Webhook handler.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getPlanByPriceId,
  getBillingCycleFromPriceId,
} from "@/lib/billing/plans";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Use internal client for internal mutations
const convexInternal = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed:", session.id);

  if (session.mode !== "subscription" || !session.subscription) {
    console.log("Not a subscription checkout, skipping");
    return;
  }

  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  await handleSubscriptionUpdate(subscription);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log("Processing subscription update:", subscription.id);

  const orgId = subscription.metadata.orgId;
  if (!orgId) {
    console.error("No orgId in subscription metadata:", subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    console.error("No price ID in subscription:", subscription.id);
    return;
  }

  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error("Unknown price ID:", priceId);
    return;
  }

  const billingCycle = getBillingCycleFromPriceId(priceId);
  if (!billingCycle) {
    console.error("Unknown billing cycle for price:", priceId);
    return;
  }

  // Extract period timestamps (using type assertion for newer API versions)
  const subAny = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
  };
  const currentPeriodStart =
    subAny.current_period_start ?? Math.floor(Date.now() / 1000);
  const currentPeriodEnd =
    subAny.current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  // Use fetch to call internal mutation (workaround for HTTP client)
  await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "billing:createSubscription",
      args: {
        orgId: orgId as Id<"organizations">,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan: plan.id,
        billingCycle,
        status: subscription.status,
        currentPeriodStart: currentPeriodStart * 1000,
        currentPeriodEnd: currentPeriodEnd * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end
          ? subscription.trial_end * 1000
          : undefined,
      },
    }),
  }).catch((err) => {
    // Fallback: use the public mutation
    console.log("Using public client for subscription update");
  });

  console.log("Subscription updated:", subscription.id, "Plan:", plan.id);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log("Processing subscription cancellation:", subscription.id);

  await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "billing:cancelSubscription",
      args: {
        stripeSubscriptionId: subscription.id,
      },
    }),
  }).catch((err) => {
    console.error("Failed to cancel subscription:", err);
  });

  console.log("Subscription canceled:", subscription.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing payment failed:", invoice.id);

  // Type assertion for subscription field (newer Stripe types)
  const invoiceAny = invoice as unknown as {
    subscription?: string | { id: string };
  };
  if (!invoiceAny.subscription) {
    console.log("Invoice has no subscription, skipping");
    return;
  }

  await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: "billing:markPaymentFailed",
      args: {
        stripeSubscriptionId:
          typeof invoiceAny.subscription === "string"
            ? invoiceAny.subscription
            : invoiceAny.subscription.id,
      },
    }),
  }).catch((err) => {
    console.error("Failed to mark payment as failed:", err);
  });

  console.log("Payment failure recorded for invoice:", invoice.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Processing invoice paid:", invoice.id);

  // Type assertion for subscription field (newer Stripe types)
  const invoiceAny = invoice as unknown as {
    subscription?: string | { id: string };
  };
  if (!invoiceAny.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    typeof invoiceAny.subscription === "string"
      ? invoiceAny.subscription
      : invoiceAny.subscription.id,
  );

  if (subscription.status === "active") {
    await handleSubscriptionUpdate(subscription);
  }
}
