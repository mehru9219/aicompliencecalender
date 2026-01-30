# Implementation Plan: Billing & Subscription

**Branch**: `010-billing-subscription` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-billing-subscription/spec.md`

## Summary

Build a complete billing system with Stripe integration for subscriptions, usage-based limits, trial management, webhook handling, and a self-service billing portal for plan upgrades and payment method management.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Stripe (Subscriptions, Checkout, Billing Portal), Convex
**Storage**: Convex (subscriptions, usage tracking)
**Testing**: Vitest (unit), Stripe test mode
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Checkout redirect < 2s, usage check < 100ms
**Constraints**: PCI compliance via Stripe, webhook reliability
**Scale/Scope**: 3 tiers (Starter, Professional, Business)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Subscription state synced via webhooks, usage tracked accurately
- [x] **Alert Reliability**: Payment failure alerts to org admins
- [x] **Clarity**: Clear plan limits, usage meters visible, upgrade prompts

Additional checks:
- [x] **Security**: Stripe handles payment data, webhook signature verification
- [x] **Code Quality**: TypeScript strict, Stripe types
- [x] **Testing**: Webhook handling tests with Stripe test events
- [x] **Performance**: Usage limits checked in-memory, cached
- [x] **External Services**: Stripe with idempotency keys, retry logic

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── billing/
│               └── page.tsx          # Billing overview
│   └── pricing/
│       └── page.tsx                  # Pricing comparison
├── api/
│   └── stripe/
│       ├── checkout/
│       │   └── route.ts              # Create checkout session
│       ├── portal/
│       │   └── route.ts              # Create billing portal session
│       └── webhook/
│           └── route.ts              # Stripe webhooks
├── components/
│   └── features/
│       └── billing/
│           ├── PlanCard.tsx
│           ├── UsageBar.tsx
│           ├── BillingHistory.tsx
│           ├── TrialBanner.tsx
│           ├── UpgradeModal.tsx
│           └── PlanComparisonTable.tsx
├── convex/
│   ├── billing.ts                    # Subscription queries/mutations
│   └── schema.ts
└── lib/
    └── stripe.ts                     # Stripe client config
```

## Plan Configuration

```typescript
const PLANS = {
  starter: {
    name: 'Starter',
    priceMonthly: 4900,
    priceYearly: 49000,
    features: {
      users: 1,
      deadlines: 25,
      storage: 1,
      emailAlerts: true,
      smsAlerts: false,
      formPreFills: 0,
    },
  },
  professional: {
    name: 'Professional',
    priceMonthly: 14900,
    priceYearly: 149000,
    features: {
      users: 5,
      deadlines: -1,
      storage: 10,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: 10,
    },
  },
  business: {
    name: 'Business',
    priceMonthly: 29900,
    priceYearly: 299000,
    features: {
      users: 15,
      deadlines: -1,
      storage: 50,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: -1,
    },
  },
};
```

## Database Schema

```typescript
// convex/schema.ts (additions)
subscriptions: defineTable({
  orgId: v.id("organizations"),
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.string(),
  stripePriceId: v.string(),
  plan: v.string(),
  billingCycle: v.string(),
  status: v.string(),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  trialEnd: v.optional(v.number()),
})
  .index("by_org", ["orgId"])
  .index("by_stripe_customer", ["stripeCustomerId"]),

usage: defineTable({
  orgId: v.id("organizations"),
  month: v.string(),
  deadlinesCreated: v.number(),
  documentsUploaded: v.number(),
  storageUsedBytes: v.number(),
  formPreFills: v.number(),
  alertsSent: v.number(),
})
  .index("by_org_month", ["orgId", "month"]),
```

## Checkout Flow

```typescript
// app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  const { orgId, priceId, billingCycle } = await req.json();
  const user = await getCurrentUser();

  let stripeCustomerId = await getStripeCustomerId(orgId);
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { orgId },
    });
    stripeCustomerId = customer.id;
    await saveStripeCustomerId(orgId, stripeCustomerId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?canceled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { orgId },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
```

## Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.orgId;

  await convex.mutation(api.billing.updateSubscription, {
    orgId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}
```

## Usage Enforcement

```typescript
// convex/billing.ts
export const checkLimit = query({
  args: {
    orgId: v.id("organizations"),
    limitType: v.string(),
  },
  handler: async (ctx, { orgId, limitType }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .first();

    if (!subscription) {
      return { allowed: true, remaining: null, limit: null };
    }

    const plan = PLANS[subscription.plan];
    const limit = plan.features[limitType];

    if (limit === -1) {
      return { allowed: true, remaining: null, limit: 'unlimited' };
    }

    const currentUsage = await getCurrentUsage(ctx, orgId, limitType);

    return {
      allowed: currentUsage < limit,
      remaining: Math.max(0, limit - currentUsage),
      limit,
      current: currentUsage,
    };
  },
});

export async function enforceLimit(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  limitType: string
) {
  const check = await ctx.runQuery(api.billing.checkLimit, { orgId, limitType });

  if (!check.allowed) {
    throw new ConvexError({
      code: 'LIMIT_EXCEEDED',
      message: `You've reached your ${limitType} limit. Please upgrade your plan.`,
      limit: check.limit,
      current: check.current,
    });
  }
}
```

## Trial Management

```typescript
// convex/billing.ts
export const getTrialStatus = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .first();

    if (!subscription) {
      const org = await ctx.db.get(orgId);
      const trialEnd = org.createdAt + 14 * 24 * 60 * 60 * 1000;
      const daysRemaining = Math.ceil((trialEnd - Date.now()) / (24*60*60*1000));

      return {
        inTrial: Date.now() < trialEnd,
        daysRemaining: Math.max(0, daysRemaining),
        trialEnd,
        expired: Date.now() >= trialEnd,
      };
    }

    if (subscription.status === 'trialing') {
      const daysRemaining = Math.ceil(
        (subscription.trialEnd - Date.now()) / (24*60*60*1000)
      );

      return {
        inTrial: true,
        daysRemaining,
        trialEnd: subscription.trialEnd,
        expired: false,
      };
    }

    return { inTrial: false, expired: false };
  },
});

// Trial expiry warnings
crons.daily(
  "trial-expiry-warnings",
  { hourUTC: 10, minuteUTC: 0 },
  internal.billing.sendTrialWarnings
);

export const sendTrialWarnings = internalAction({
  handler: async (ctx) => {
    const trialing = await ctx.runQuery(internal.billing.getTrialingOrgs);

    for (const org of trialing) {
      const daysRemaining = Math.ceil(
        (org.trialEnd - Date.now()) / (24*60*60*1000)
      );

      if ([7, 3, 1, 0].includes(daysRemaining)) {
        await sendTrialWarningEmail(org, daysRemaining);
      }
    }
  },
});
```

## Billing Portal

```typescript
// app/api/stripe/portal/route.ts
export async function POST(req: Request) {
  const { orgId } = await req.json();
  const stripeCustomerId = await getStripeCustomerId(orgId);

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

## Complexity Tracking

No constitution violations - implements proper webhook handling and payment failure notifications.
