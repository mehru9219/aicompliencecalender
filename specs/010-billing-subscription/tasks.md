# Tasks: Billing & Subscription

**Feature**: 010-billing-subscription | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build subscription billing with Stripe integration, usage-based limits, trial management, and self-service billing portal. Financial operations require careful handling and webhook reliability.

---

## Phase 1: Stripe Setup

### Task 1.1: Configure Stripe Products and Prices
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: None

**Description**: Set up Stripe products, prices, and webhooks.

**Files to create/modify**:
- `src/lib/stripe.ts`
- `.env.example`

**Acceptance Criteria**:
- [X] Install: stripe
- [X] Create Stripe client with API key
- [X] Environment variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY
- [X] Create products in Stripe Dashboard:
  - Starter: $49/mo, $490/yr
  - Professional: $149/mo, $1,490/yr
  - Business: $299/mo, $2,990/yr
- [X] Document price IDs in config

**Constitution Checklist**:
- [X] Secrets in environment variables (Security)

---

### Task 1.2: Define Billing Schema
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.1

**Description**: Create Convex schema for subscriptions and usage.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `subscriptions` table: orgId, stripeCustomerId, stripeSubscriptionId, stripePriceId, plan, billingCycle, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, trialEnd
- [X] `usage` table: orgId, month, deadlinesCreated, documentsUploaded, storageUsedBytes, formPreFills, alertsSent
- [X] Indexes: `by_org`, `by_stripe_customer`

**Constitution Checklist**:
- [X] Usage tracked accurately (Data Integrity)

---

### Task 1.3: Create Plan Configuration
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 1.1

**Description**: Create plan definitions with features and limits.

**Files to create/modify**:
- `src/lib/billing/plans.ts`
- `src/types/billing.ts`

**Acceptance Criteria**:
- [X] `PLANS` constant with all plan details
- [X] Features per plan: users, deadlines, storage, emailAlerts, smsAlerts, formPreFills
- [X] -1 represents unlimited
- [X] Plan type definitions
- [X] Helper: `getPlanByPriceId(priceId)`

---

## Phase 2: Checkout Flow

### Task 2.1: Create Checkout Session Endpoint
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2, 1.3

**Description**: Create API endpoint for initiating checkout.

**Files to create/modify**:
- `src/app/api/stripe/checkout/route.ts`
- `convex/billing.ts`

**Acceptance Criteria**:
- [X] POST endpoint accepts: orgId, priceId
- [X] Gets or creates Stripe customer
- [X] Saves customer ID to Convex if new
- [X] Creates checkout session with:
  - 14-day trial
  - Success/cancel URLs
  - Promotion codes allowed
  - Metadata with orgId
- [X] Returns session URL

**Constitution Checklist**:
- [X] Customer ID persisted (Data Integrity)

---

### Task 2.2: Create Billing Portal Endpoint
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 2.1

**Description**: Create endpoint for Stripe billing portal.

**Files to create/modify**:
- `src/app/api/stripe/portal/route.ts`

**Acceptance Criteria**:
- [X] POST endpoint accepts: orgId
- [X] Gets Stripe customer ID
- [X] Creates billing portal session
- [X] Returns portal URL

---

## Phase 3: Webhook Handling

### Task 3.1: Create Webhook Endpoint
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 1.2

**Description**: Create endpoint for Stripe webhooks.

**Files to create/modify**:
- `src/app/api/stripe/webhook/route.ts`

**Acceptance Criteria**:
- [X] POST endpoint
- [X] Verifies webhook signature
- [X] Returns 400 on invalid signature
- [X] Handles events:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_failed
  - invoice.paid
- [X] Returns 200 on success

**Constitution Checklist**:
- [X] Webhook signature verified (Security)

---

### Task 3.2: Implement Subscription Update Handler
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 3.1

**Description**: Handle subscription state changes.

**Files to create/modify**:
- `src/app/api/stripe/webhook/route.ts`
- `convex/billing.ts`

**Acceptance Criteria**:
- [X] `handleSubscriptionUpdate(subscription)`:
  - Extracts orgId from metadata
  - Updates subscription record in Convex
  - Updates: status, priceId, period dates, cancelAtPeriodEnd
- [X] `handleCheckoutComplete(session)`:
  - Creates subscription record
  - Links to org

**Constitution Checklist**:
- [X] Subscription state synced (Data Integrity)

---

### Task 3.3: Implement Payment Failure Handler
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 3.1

**Description**: Handle payment failures.

**Files to create/modify**:
- `src/app/api/stripe/webhook/route.ts`
- `convex/billing.ts`

**Acceptance Criteria**:
- [X] `handlePaymentFailed(invoice)`:
  - Updates subscription status to 'past_due'
  - Sends email notification to org owner
  - Creates in-app notification
  - Logs the failure

**Constitution Checklist**:
- [X] Payment failure alerts (Alert Reliability)
- [X] Clear notification to user (Clarity)

---

## Phase 4: Usage Limits

### Task 4.1: Implement Usage Tracking
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Track usage metrics per org per month.

**Files to create/modify**:
- `convex/billing.ts`
- `convex/deadlines.ts` (add tracking)
- `convex/documents.ts` (add tracking)
- `convex/forms.ts` (add tracking)

**Acceptance Criteria**:
- [X] `incrementUsage(orgId, metric)` internal mutation
- [X] `getCurrentUsage(orgId, metric)` query
- [X] Metrics: deadlinesCreated, documentsUploaded, storageUsedBytes, formPreFills
- [X] Auto-creates usage record for current month
- [X] Called from relevant mutations

**Constitution Checklist**:
- [X] Accurate usage tracking (Data Integrity)

---

### Task 4.2: Implement Limit Checking
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.1, 1.3

**Description**: Create limit enforcement system.

**Files to create/modify**:
- `convex/billing.ts`

**Acceptance Criteria**:
- [X] `checkLimit(orgId, limitType)` query:
  - Gets subscription and plan
  - Gets current usage
  - Returns: { allowed, remaining, limit, current }
  - Returns unlimited indicator for -1 limits
- [X] `enforceLimit(ctx, orgId, limitType)` helper:
  - Throws ConvexError if limit exceeded
  - Clear error message with upgrade prompt

**Constitution Checklist**:
- [X] Clear upgrade messaging (Clarity)

---

### Task 4.3: Integrate Limits into Features
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Add limit checks to feature mutations.

**Files to create/modify**:
- `convex/deadlines.ts`
- `convex/documents.ts`
- `convex/forms.ts`
- `convex/team.ts`

**Acceptance Criteria**:
- [X] deadlines.create checks 'deadlines' limit
- [X] documents.save checks 'storage' limit
- [X] forms.analyzeForm checks 'formPreFills' limit
- [X] team.invite checks 'users' limit
- [X] Each returns clear error on limit exceeded

**Constitution Checklist**:
- [X] Limits enforced consistently (Data Integrity)

---

## Phase 5: Trial Management

### Task 5.1: Implement Trial Status Query
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create query for trial status.

**Files to create/modify**:
- `convex/billing.ts`

**Acceptance Criteria**:
- [X] `getTrialStatus(orgId)` query
- [X] Returns: { inTrial, daysRemaining, trialEnd, expired }
- [X] Handles both free trial (no subscription) and subscription trial
- [X] Free trial: 14 days from org creation

**Constitution Checklist**:
- [X] Clear trial status (Clarity)

---

### Task 5.2: Create Trial Warning Cron
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 5.1

**Description**: Send trial expiry warnings.

**Files to create/modify**:
- `convex/crons.ts`
- `convex/billing.ts`
- `src/lib/email/templates/TrialWarningEmail.tsx`

**Acceptance Criteria**:
- [X] Daily cron at 10 AM UTC
- [X] Queries orgs in trial
- [X] Sends warnings at: 7 days, 3 days, 1 day, 0 days remaining
- [X] Email template with upgrade CTA
- [X] Tracks sent warnings to avoid duplicates

**Constitution Checklist**:
- [X] Advance warning for trial end (UX)

---

## Phase 6: Billing UI

### Task 6.1: Create PlanCard Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create card for displaying plan options.

**Files to create/modify**:
- `src/components/features/billing/PlanCard.tsx`

**Acceptance Criteria**:
- [X] Plan name and price
- [X] Monthly/yearly toggle
- [X] Feature list with check/x icons
- [X] "Current Plan" badge if active
- [X] "Popular" badge for Professional
- [X] Select/Upgrade button
- [X] Disabled if on better plan

**Constitution Checklist**:
- [X] Clear feature comparison (Clarity)

---

### Task 6.2: Create UsageBar Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 4.1

**Description**: Create usage meter component.

**Files to create/modify**:
- `src/components/features/billing/UsageBar.tsx`

**Acceptance Criteria**:
- [X] Progress bar showing current/limit
- [X] Percentage label
- [X] Color: green (< 70%), yellow (70-90%), red (> 90%)
- [X] "Unlimited" display for -1
- [X] Metric label (e.g., "Deadlines: 15/25")

**Constitution Checklist**:
- [X] Clear usage visibility (Clarity)

---

### Task 6.3: Create TrialBanner Component
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 5.1

**Description**: Create banner showing trial status.

**Files to create/modify**:
- `src/components/features/billing/TrialBanner.tsx`

**Acceptance Criteria**:
- [X] Shows only during trial
- [X] "X days left in trial" message
- [X] Upgrade button
- [X] Dismissible (with cookie/localStorage)
- [X] Changes color as trial ends (yellow -> red)

**Constitution Checklist**:
- [X] Clear trial countdown (Clarity)

---

### Task 6.4: Create PlanComparisonTable Component
**Priority**: P2 (Medium) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create full feature comparison table.

**Files to create/modify**:
- `src/components/features/billing/PlanComparisonTable.tsx`

**Acceptance Criteria**:
- [X] Row per feature
- [X] Column per plan
- [X] Check/X or value for each cell
- [X] Highlight current plan column
- [X] Responsive (cards on mobile)

---

### Task 6.5: Create UpgradeModal Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 6.1

**Description**: Create modal for upgrading when limit hit.

**Files to create/modify**:
- `src/components/features/billing/UpgradeModal.tsx`

**Acceptance Criteria**:
- [X] Shows current limit and usage
- [X] Plan options to upgrade to
- [X] Quick upgrade button
- [X] Redirect to checkout

---

## Phase 7: Billing Pages

### Task 7.1: Create Billing Settings Page
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 6.1-6.3

**Description**: Create main billing management page.

**Files to create/modify**:
- `src/app/(dashboard)/settings/billing/page.tsx`

**Acceptance Criteria**:
- [X] Current plan display
- [X] Usage meters for all limits
- [X] Billing cycle info
- [X] "Change Plan" button
- [X] "Manage Billing" button (portal)
- [X] Payment method summary
- [X] Next invoice date

**Constitution Checklist**:
- [X] Clear billing information (Clarity)

---

### Task 7.2: Create Pricing Page
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 6.1, 6.4

**Description**: Create public pricing page.

**Files to create/modify**:
- `src/app/(dashboard)/pricing/page.tsx`
- OR `src/app/pricing/page.tsx` (public)

**Acceptance Criteria**:
- [X] PlanCards for all plans
- [X] Monthly/yearly toggle
- [X] Feature comparison table
- [X] FAQ section
- [X] "Start Free Trial" or "Upgrade" CTAs
- [X] Current plan indicator if logged in

---

## Phase 8: Testing

### Task 8.1: Write Webhook Handler Tests
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.1-3.3

**Description**: Test webhook handling with Stripe test events.

**Files to create/modify**:
- `tests/integration/stripe-webhooks.test.ts`

**Acceptance Criteria**:
- [X] Test signature verification
- [X] Test checkout.session.completed creates subscription
- [X] Test subscription.updated updates record
- [X] Test payment_failed sends notifications
- [X] Test subscription.deleted handles cancellation
- [X] 80% coverage

**Constitution Checklist**:
- [X] 80% coverage (Testing Standards)

---

### Task 8.2: Write Limit Enforcement Tests
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.2, 4.3

**Description**: Test usage limit enforcement.

**Files to create/modify**:
- `tests/integration/billing-limits.test.ts`

**Acceptance Criteria**:
- [X] Test usage increments correctly
- [X] Test limit check returns correct values
- [X] Test mutation fails when limit exceeded
- [X] Test unlimited (-1) allows any usage
- [X] Test error message is clear
- [X] 80% coverage

**Constitution Checklist**:
- [X] Limits tested thoroughly (Testing Standards)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Stripe Setup | 3 | P0 | 5-7 |
| 2. Checkout Flow | 2 | P0-P1 | 4-6 |
| 3. Webhooks | 3 | P0 | 8-11 |
| 4. Usage Limits | 3 | P0 | 8-11 |
| 5. Trial Management | 2 | P0-P1 | 4-6 |
| 6. UI Components | 5 | P0-P2 | 10-14 |
| 7. Pages | 2 | P0-P1 | 7-9 |
| 8. Testing | 2 | P0 | 7-9 |
| **Total** | **22** | | **53-73** |

## Dependencies Graph

```
1.1 Stripe Config ─► 1.2 Schema ─► 1.3 Plans
         │                │
         │                ├─► 2.1 Checkout ─► 2.2 Portal
         │                │
         │                ├─► 3.1 Webhook ─► 3.2 Sub Handler
         │                │                   3.3 Failure Handler
         │                │
         │                └─► 4.1 Usage Track ─► 4.2 Limit Check ─► 4.3 Integration
         │
         └─► 5.1 Trial Status ─► 5.2 Warning Cron

6.1-6.5 Components ─► 7.1-7.2 Pages
```

**Note**: Webhook handling is critical - signature verification and idempotency are required for financial operations (Constitution: Data Integrity).
