# Feature Specification: Billing & Subscription

**Feature Branch**: `010-billing-subscription`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a subscription billing system that offers clear value tiers, easy upgrade paths, and transparent pricing that scales with organization size."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Free Trial (Priority: P1)

A new user signs up and automatically begins a 14-day free trial with full Professional tier access, no credit card required.

**Why this priority**: Trial access is the entry point - users must experience the product before paying.

**Independent Test**: Can be tested by signing up and verifying full feature access without payment.

**Acceptance Scenarios**:

1. **Given** a new user completing signup, **When** account is created, **Then** 14-day Professional trial begins automatically.
2. **Given** a trial user, **When** they access features, **Then** all Professional tier features are available.
3. **Given** a trial user, **When** they view account, **Then** trial end date and days remaining are clearly shown.

---

### User Story 2 - View Pricing and Select Plan (Priority: P1)

A user nearing trial end views the pricing page, compares tiers, and selects the plan that fits their needs.

**Why this priority**: Plan selection is essential for conversion - users must understand and choose a plan to continue.

**Independent Test**: Can be tested by viewing pricing page and verifying all plans are displayed with features.

**Acceptance Scenarios**:

1. **Given** the pricing page, **When** viewed, **Then** all tiers are displayed with: price, user limit, feature list, and "Select" button.
2. **Given** plan comparison, **When** user hovers over a feature, **Then** a tooltip explains what it means.
3. **Given** annual vs monthly toggle, **When** switched, **Then** prices update showing annual discount (2 months free).

---

### User Story 3 - Subscribe and Enter Payment (Priority: P1)

A user selects the Professional plan and completes payment with their credit card, immediately gaining full paid access.

**Why this priority**: Payment completion is the monetization event - critical for business sustainability.

**Independent Test**: Can be tested by completing payment flow and verifying subscription is active.

**Acceptance Scenarios**:

1. **Given** a plan selected, **When** user enters credit card details, **Then** payment is processed securely.
2. **Given** successful payment, **When** completed, **Then** user's account immediately reflects paid plan status.
3. **Given** payment failure, **When** it occurs, **Then** user sees clear error message with option to retry.

---

### User Story 4 - Upgrade Plan (Priority: P2)

A growing organization on the Professional plan upgrades to Business to add more users, with prorated billing applied.

**Why this priority**: Upgrade path enables growth but requires initial subscription first.

**Independent Test**: Can be tested by upgrading and verifying prorated charge and immediate feature access.

**Acceptance Scenarios**:

1. **Given** a Professional subscriber, **When** they click "Upgrade to Business", **Then** the prorated amount is calculated and shown.
2. **Given** upgrade confirmation, **When** user confirms, **Then** the prorated charge is applied and Business features unlock immediately.
3. **Given** an upgraded account, **When** next billing cycle arrives, **Then** the full Business rate is charged.

---

### User Story 5 - Downgrade Plan (Priority: P2)

An organization reducing headcount downgrades from Business to Professional, with the change taking effect at the next billing cycle.

**Why this priority**: Downgrade path provides flexibility but is less common than upgrades.

**Independent Test**: Can be tested by requesting downgrade and verifying timing and warnings.

**Acceptance Scenarios**:

1. **Given** a Business subscriber, **When** they request downgrade to Professional, **Then** the effective date (next billing cycle) is shown.
2. **Given** current usage exceeds new plan limits (e.g., 8 users vs. 5 user limit), **When** downgrading, **Then** user is warned and must reduce usage before downgrade completes.
3. **Given** a scheduled downgrade, **When** next billing cycle arrives, **Then** the account switches to Professional and charges the lower rate.

---

### User Story 6 - Trial Expiration Handling (Priority: P2)

A trial user who hasn't subscribed reaches day 14 and their account becomes read-only, with prompts to subscribe to regain access.

**Why this priority**: Trial expiration creates urgency but requires trial to run its course.

**Independent Test**: Can be tested by letting trial expire and verifying read-only state.

**Acceptance Scenarios**:

1. **Given** trial expiring, **When** 7 days, 3 days, 1 day remain, **Then** user receives email reminders.
2. **Given** an expired trial, **When** user logs in, **Then** they can view all their data but cannot add/edit.
3. **Given** an expired trial, **When** user subscribes, **Then** full access is immediately restored.

---

### User Story 7 - Cancel Subscription (Priority: P3)

An organization decides to stop using the product and cancels their subscription through self-service.

**Why this priority**: Cancellation is rare and self-service reduces support burden.

**Independent Test**: Can be tested by cancelling and verifying data retention and reactivation options.

**Acceptance Scenarios**:

1. **Given** billing settings, **When** user clicks "Cancel Subscription", **Then** exit survey is offered (optional).
2. **Given** cancellation confirmed, **When** current period ends, **Then** account becomes read-only (not immediately deleted).
3. **Given** a cancelled account, **When** user reactivates within 30 days, **Then** all data is restored and billing resumes.

---

### Edge Cases

- What happens when a payment method expires mid-subscription?
- How does the system handle disputed/chargedback payments?
- What happens when an organization exceeds storage limits on their plan?
- How does the system handle currency conversion for international users?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide 14-day free trial with Professional tier access, no credit card required.
- **FR-002**: System MUST offer four pricing tiers: Starter ($49/mo), Professional ($149/mo), Business ($299/mo), Enterprise (custom).
- **FR-003**: Each tier MUST have defined limits: users, deadlines, storage, features.
- **FR-004**: Starter tier: 1 user, 25 deadlines, 1GB storage, email alerts only, basic dashboard.
- **FR-005**: Professional tier: 5 users, unlimited deadlines, 10GB storage, email + SMS, full dashboard + calendar, 10 form pre-fills/month.
- **FR-006**: Business tier: 15 users, unlimited deadlines, 50GB storage, all channels + escalation, unlimited form pre-fill, audit export, priority support.
- **FR-007**: Enterprise tier: Unlimited users, unlimited storage, SSO, dedicated support, API access.
- **FR-008**: System MUST offer annual billing at 2 months free discount.
- **FR-009**: System MUST accept credit card and ACH payment methods.
- **FR-010**: System MUST send automatic renewal notification 7 days before billing.
- **FR-011**: System MUST generate downloadable PDF invoices for all charges.
- **FR-012**: Upgrades MUST take effect immediately with prorated billing.
- **FR-013**: Downgrades MUST take effect at next billing cycle.
- **FR-014**: System MUST warn users if downgrade exceeds new plan limits.
- **FR-015**: System MUST provide 30-day grace period for over-limit usage after downgrade.
- **FR-016**: Trial expiration MUST convert account to read-only state (view only, no edits).
- **FR-017**: System MUST send trial expiration warnings at 7, 3, and 1 days remaining.
- **FR-018**: System MUST allow self-service cancellation without contacting support.
- **FR-019**: Cancelled accounts MUST retain data for 30 days for potential reactivation.
- **FR-020**: After 30 days post-cancellation, data MUST be permanently deleted with confirmation email.
- **FR-021**: System MUST track usage against plan limits in real-time.
- **FR-022**: System MUST prevent actions that would exceed plan limits (soft block with upgrade prompt).

### Key Entities

- **Subscription**: Active plan with tier, billing cycle, payment method, and status.
- **Plan/Tier**: Pricing level with defined limits and features (Starter, Professional, Business, Enterprise).
- **Invoice**: Billing record with amount, date, payment status, and downloadable PDF.
- **Payment Method**: Stored credit card or ACH details for recurring billing.
- **Usage Metrics**: Real-time tracking of users, deadlines, storage against plan limits.
- **Trial Period**: 14-day free access period with expiration handling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 30%+ of trial users convert to paid subscription.
- **SC-002**: Users can complete subscription signup in under 3 minutes.
- **SC-003**: Upgrade flow completes in under 2 minutes with immediate feature access.
- **SC-004**: 90%+ of payments process successfully on first attempt.
- **SC-005**: Self-service cancellation reduces support tickets for cancellation requests to near zero.
- **SC-006**: Reactivation within 30 days preserves 100% of user data.
- **SC-007**: Invoice generation and download completes within 5 seconds.

## Assumptions

- Pricing tiers are competitive for the compliance software market.
- Annual discount of 2 months free is sufficient incentive for annual commitment.
- Read-only expired trial state maintains engagement better than lockout.
- 30-day data retention post-cancellation balances user needs with storage costs.
- Payment processing is handled by a third-party provider (Stripe) with PCI compliance.

## Clarifications

### Session 2026-01-28

- Q: When a payment method expires mid-subscription? → A: Attempt renewal early (7 days before), notify if failing - proactive approach prevents service interruption
- Q: When a payment is disputed/chargedback? → A: Downgrade to trial-equivalent access (read-only) - balanced approach maintains data access without rewarding fraud
- Q: When an organization exceeds their plan's storage limit? → A: Soft block new uploads with upgrade prompt - clear boundary, no surprise charges
- Q: How should pricing display for international users? → A: USD only, note "prices in USD" - simplifies billing operations

### Integrated Decisions

**Payment Method Expiration**:
```typescript
// Stripe subscription settings
subscription_data: {
  collection_method: 'charge_automatically',
  days_until_due: 7, // Attempt charge 7 days before renewal
}
// If early charge fails, notify user immediately
```

**Chargeback Handling**:
```typescript
// On chargeback webhook:
await downgradeToReadOnly(orgId);
await notifyOrgOwner(orgId, {
  type: 'payment_disputed',
  message: 'Your account has been limited due to a payment dispute. Please contact support.',
});
```

**Storage Overage**:
```typescript
// Before upload:
const usage = await getStorageUsage(orgId);
const limit = PLAN_LIMITS[subscription.plan].storage;

if (usage + fileSize > limit) {
  throw new Error('STORAGE_LIMIT_EXCEEDED');
}
// UI shows upgrade prompt with current usage vs limit
```

**Currency Display**:
```tsx
<p className="text-sm text-gray-500">
  All prices in USD. Your bank may apply currency conversion fees.
</p>
```
