# Feature Specification: Onboarding Experience

**Feature Branch**: `009-onboarding-experience`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a guided onboarding flow that takes new users from signup to a fully configured compliance system in under 10 minutes, with immediate value demonstrated."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Account Creation (Priority: P1)

A new user signs up with email and password (or SSO) and immediately enters the onboarding wizard without friction.

**Why this priority**: Account creation is the entry point - users who can't sign up never experience the product.

**Independent Test**: Can be tested by completing signup and verifying the onboarding wizard appears immediately.

**Acceptance Scenarios**:

1. **Given** the signup page, **When** user enters email and password, **Then** account is created and onboarding wizard appears as overlay.
2. **Given** SSO option available, **When** user clicks "Sign in with Google/Microsoft", **Then** they authenticate and enter onboarding.
3. **Given** a new account, **When** created, **Then** the user lands on an empty dashboard with onboarding wizard active.

---

### User Story 2 - Organization Setup (Priority: P1)

A new user configures their organization by entering business name and selecting their industry to receive relevant templates.

**Why this priority**: Organization setup enables everything else - templates, team management, and deadlines all depend on it.

**Independent Test**: Can be tested by completing organization setup and verifying data is saved correctly.

**Acceptance Scenarios**:

1. **Given** onboarding step 2, **When** user enters "ABC Medical Clinic" and selects "Healthcare - Medical Practice", **Then** the information is saved.
2. **Given** organization setup, **When** address fields are skipped (optional), **Then** setup proceeds without error.
3. **Given** the team size question, **When** answered, **Then** appropriate plan recommendations are noted for later.

---

### User Story 3 - Import Industry Template (Priority: P1)

A healthcare practice owner sees the recommended compliance template, selects which deadlines to import, and enters their actual due dates for key items.

**Why this priority**: Template import creates immediate value - transforming an empty system into a populated one.

**Independent Test**: Can be tested by importing a template and verifying deadlines are created with correct dates.

**Acceptance Scenarios**:

1. **Given** industry "Healthcare" selected, **When** template step loads, **Then** the healthcare compliance template is displayed with ~15 deadline items.
2. **Given** template items displayed, **When** user selects 10 of 15 items, **Then** only selected items will be imported.
3. **Given** selected items, **When** user enters their medical license renewal date as June 15, **Then** that deadline is created with annual recurrence from June 15.

---

### User Story 4 - Configure Alert Preferences (Priority: P2)

A new user chooses to receive alerts via email and SMS, enters their phone number, and receives a test alert confirming delivery works.

**Why this priority**: Alert setup ensures the core value proposition works, but requires organization to exist first.

**Independent Test**: Can be tested by configuring alerts and verifying the test alert is delivered.

**Acceptance Scenarios**:

1. **Given** alert preferences step, **When** user selects "Email + SMS" and enters phone number, **Then** preferences are saved.
2. **Given** a phone number entered, **When** "Send Test" is clicked, **Then** a test SMS is delivered within 30 seconds.
3. **Given** test alert sent, **When** user confirms receipt, **Then** onboarding proceeds to next step.

---

### User Story 5 - See the Quick Win (Priority: P2)

A new user completes onboarding and sees their populated dashboard with compliance score, upcoming deadlines, and the first alert scheduled - demonstrating immediate value.

**Why this priority**: The "quick win" moment creates emotional connection and demonstrates ROI.

**Independent Test**: Can be tested by completing onboarding and verifying the dashboard shows imported data.

**Acceptance Scenarios**:

1. **Given** template import completed, **When** onboarding finishes, **Then** dashboard shows all imported deadlines with correct statuses.
2. **Given** the completed dashboard, **When** displayed, **Then** compliance score is calculated and shown prominently.
3. **Given** the first upcoming deadline, **When** highlighted, **Then** onboarding explains "Your first alert will arrive on [date]".

---

### User Story 6 - Persistent Onboarding Checklist (Priority: P3)

A user who started onboarding but didn't finish sees a persistent checklist in the sidebar reminding them of remaining steps.

**Why this priority**: Re-engagement helps users who got interrupted, but requires core onboarding first.

**Independent Test**: Can be tested by partially completing onboarding and verifying checklist persists.

**Acceptance Scenarios**:

1. **Given** a user who completed 3 of 5 onboarding steps, **When** they return, **Then** sidebar shows checklist with completed/remaining items.
2. **Given** checklist items (Create first deadline, Upload first document, etc.), **When** completed, **Then** each shows celebration animation.
3. **Given** all checklist items complete, **When** final item is done, **Then** checklist disappears with "Onboarding Complete" badge.

---

### Edge Cases

- What happens when a user closes the onboarding wizard mid-flow?
- How does the system handle users who skip template import?
- What happens when test alert delivery fails?
- How does the system handle users who sign up but never return?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide email/password signup with immediate entry into onboarding wizard.
- **FR-002**: System MUST support SSO signup options (Google, Microsoft) where available.
- **FR-003**: Onboarding wizard MUST appear as overlay on empty dashboard after signup.
- **FR-004**: Organization setup MUST require: business name (required), industry selection (required).
- **FR-005**: Organization setup MUST allow optional: business address, team size estimate.
- **FR-006**: System MUST display industry-appropriate template based on selected industry.
- **FR-007**: Template import MUST allow selective item import (not all-or-nothing).
- **FR-008**: Template import MUST require user to enter actual due dates for anchor deadlines.
- **FR-009**: System MUST calculate related deadline dates from entered anchor dates.
- **FR-010**: Alert preferences MUST offer: email only, SMS only, or both options.
- **FR-011**: System MUST send test alert immediately when phone number is entered.
- **FR-012**: System MUST verify test alert delivery before proceeding (user confirmation or automated).
- **FR-013**: Quick win step MUST show populated dashboard highlighting: compliance score, first deadline, first alert date.
- **FR-014**: System MUST allow inviting team members during onboarding (skippable).
- **FR-015**: Persistent onboarding checklist MUST appear in sidebar until all items complete.
- **FR-016**: Checklist items MUST include: Create first deadline, Upload first document, Complete alert setup, Invite team member (optional), Complete first deadline.
- **FR-017**: Completing all checklist items MUST award completion badge and remove checklist.
- **FR-018**: System MUST send re-engagement email if user doesn't complete onboarding within 24 hours.
- **FR-019**: System MUST send "deadline approaching" email if user completes onboarding but doesn't return within 7 days.
- **FR-020**: Total onboarding flow MUST be completable in under 10 minutes.

### Key Entities

- **Onboarding Progress**: Tracking of which steps a user has completed and current step.
- **Onboarding Checklist**: Post-wizard checklist items with completion status.
- **Template Import Session**: Record of which template items were selected and dates entered.
- **Test Alert Record**: Verification that alert delivery was tested and confirmed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80%+ of new users complete full onboarding flow in first session.
- **SC-002**: Median time from signup to populated dashboard is under 8 minutes.
- **SC-003**: 90%+ of users who complete template import have 5+ deadlines created.
- **SC-004**: Test alert delivery succeeds for 95%+ of entered phone numbers.
- **SC-005**: Users who complete onboarding are 3x more likely to return within 7 days.
- **SC-006**: Re-engagement emails achieve 20%+ open rate and 5%+ return rate.
- **SC-007**: 70%+ of users complete the persistent checklist within 30 days.

## Assumptions

- Users are willing to spend 5-10 minutes on initial setup if value is demonstrated.
- Industry selection accurately predicts relevant compliance templates.
- Test alerts provide sufficient confidence in delivery reliability.
- Skipping optional steps doesn't degrade experience significantly.
- Re-engagement emails are sent from a deliverable domain with proper authentication.

## Clarifications

### Session 2026-01-28

- Q: When a user closes the onboarding wizard mid-flow? → A: Save progress, show checklist in sidebar instead - respects user's choice, non-intrusive reminder
- Q: How is test alert delivery verified? → A: Link in test message must be clicked to verify - proves user actually received and read the message
- Q: When a user skips template import? → A: Show first deadline form inline instead - captures engagement, ensures at least one deadline
- Q: What's the maximum number of re-engagement emails? → A: 2 emails max (24h and 7d), then stop - respects inbox, avoids spam complaints

### Integrated Decisions

**Wizard Closure Behavior**:
```typescript
// When wizard is closed:
await saveOnboardingProgress(orgId, currentStep);
setShowWizard(false);
setShowSidebarChecklist(true);
```

**Test Alert Verification**:
```typescript
// Test alert contains unique verification link
const verifyToken = generateToken();
await sendTestAlert(channel, {
  message: 'Click to verify: https://app.../verify/' + verifyToken,
});

// User clicks link to confirm receipt
export async function verifyTestAlert(token: string) {
  await markAlertVerified(token);
  return { success: true, message: 'Alert delivery verified!' };
}
```

**Skip Template Flow**:
```tsx
// If user clicks "Skip templates"
<div className="space-y-4">
  <p>No problem! Let's create your first deadline manually.</p>
  <DeadlineForm
    onSuccess={() => markOnboardingStep('first_deadline')}
  />
</div>
```

**Re-engagement Schedule**:
```typescript
const RE_ENGAGEMENT_SCHEDULE = [
  { delay: 24 * 60 * 60 * 1000, template: 'onboarding_24h' },
  { delay: 7 * 24 * 60 * 60 * 1000, template: 'onboarding_7d' },
];
// Maximum 2 emails - no more after this
```
