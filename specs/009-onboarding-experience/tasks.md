# Tasks: Onboarding Experience

**Feature**: 009-onboarding-experience | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a guided onboarding wizard with progress tracking, test alerts, and re-engagement emails. Good onboarding ensures users successfully set up their compliance tracking and verify that alerts work correctly.

---

## Phase 1: Onboarding Data Layer

### Task 1.1: Define Onboarding Progress Schema
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 001-deadline-management

**Description**: Create schema for tracking onboarding progress.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `onboarding_progress` table:
  - orgId, userId
  - steps: object with boolean for each step (account_created, org_setup, template_imported, alerts_configured, first_deadline, team_invited, first_completion)
  - startedAt, completedAt, lastActivityAt
- [X] Indexes: `by_org`, `by_user`

**Constitution Checklist**:
- [X] Progress tracked persistently (Data Integrity)

---

### Task 1.2: Create Onboarding TypeScript Types
**Priority**: P0 (Critical) | **Estimate**: 1 hour | **Dependencies**: 1.1

**Description**: Define types for onboarding.

**Files to create/modify**:
- `src/types/onboarding.ts`

**Acceptance Criteria**:
- [X] `OnboardingProgress` type matching schema
- [X] `OnboardingStep` type with id, title, required flag
- [X] `ONBOARDING_STEPS` constant array

---

### Task 1.3: Implement Onboarding Queries and Mutations
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Create Convex functions for onboarding.

**Files to create/modify**:
- `convex/onboarding.ts`

**Acceptance Criteria**:
- [X] `getProgress(orgId)` query
- [X] `initializeProgress(orgId)` mutation (creates if not exists)
- [X] `markStepComplete(orgId, step)` mutation
- [X] `markComplete(orgId)` mutation (sets completedAt)
- [X] `getIncomplete()` internal query (for re-engagement)
- [X] Updates lastActivityAt on each action

**Constitution Checklist**:
- [X] Progress resumable on return (Data Integrity)

---

## Phase 2: Onboarding Steps

### Task 2.1: Create OrgSetupStep Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.3

**Description**: Create step for organization setup.

**Files to create/modify**:
- `src/components/features/onboarding/OrgSetupStep.tsx`

**Acceptance Criteria**:
- [X] Form fields: Business Name, Industry (select), Business Address
- [X] Industry options: Healthcare, Dental, Legal, Financial, etc.
- [X] Required: name and industry
- [X] On submit: saves org data, marks step complete
- [X] Calls onComplete callback

**Constitution Checklist**:
- [X] Form labels visible (Accessibility)

---

### Task 2.2: Create TemplateImportStep Component
**Priority**: P1 (High) | **Estimate**: 4-5 hours | **Dependencies**: 005-industry-templates, 1.3

**Description**: Create step for importing industry template.

**Files to create/modify**:
- `src/components/features/onboarding/TemplateImportStep.tsx`

**Acceptance Criteria**:
- [X] Shows templates for user's selected industry
- [X] Template cards with selection
- [X] Deadline checklist when template selected
- [X] "Import X deadlines" button
- [X] "Skip for now" button
- [X] On import: creates deadlines, marks step complete

**Constitution Checklist**:
- [X] Skip option available (UX)

---

### Task 2.3: Create AlertSetupStep Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 002-alert-notification-system, 1.3

**Description**: Create step for configuring and testing alerts.

**Files to create/modify**:
- `src/components/features/onboarding/AlertSetupStep.tsx`

**Acceptance Criteria**:
- [X] Channel selection: Email only, Email + SMS
- [X] Phone number input if SMS selected
- [X] "Send Test Alert" button
- [X] Test sends actual email/SMS (marked as test)
- [X] Success confirmation: "Check your email/phone"
- [X] Must receive test before proceeding (or explicit skip)
- [X] Marks step complete on confirmation

**Constitution Checklist**:
- [X] Test alert to verify delivery (Alert Reliability)
- [X] Clear confirmation (Clarity)

---

### Task 2.4: Create FirstDeadlineStep Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 001-deadline-management, 1.3

**Description**: Create step for creating first deadline.

**Files to create/modify**:
- `src/components/features/onboarding/FirstDeadlineStep.tsx`

**Acceptance Criteria**:
- [X] Embedded DeadlineForm (simplified)
- [X] Pre-filled suggestions based on industry
- [X] "Create Deadline" button
- [X] On success: marks step complete
- [X] Skip not available (required step)

**Constitution Checklist**:
- [X] First deadline creates alerts (Alert Reliability)

---

### Task 2.5: Create TeamInviteStep Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 008-organization-team-management, 1.3

**Description**: Create step for inviting team members.

**Files to create/modify**:
- `src/components/features/onboarding/TeamInviteStep.tsx`

**Acceptance Criteria**:
- [X] Email input for invite
- [X] Role selector
- [X] "Send Invite" button
- [X] "Add another" for multiple invites
- [X] "Skip for now" button (optional step)
- [X] On invite or skip: marks step complete

**Constitution Checklist**:
- [X] Optional step clearly marked (Clarity)

---

## Phase 3: Wizard Container

### Task 3.1: Create OnboardingWizard Component
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 2.1-2.5

**Description**: Create the main wizard container.

**Files to create/modify**:
- `src/components/features/onboarding/OnboardingWizard.tsx`

**Acceptance Criteria**:
- [X] Modal dialog that opens when onboarding incomplete
- [X] Progress indicator (segmented bar)
- [X] Renders current step component
- [X] Navigation: Back, Next/Continue
- [X] Step validation before advance
- [X] Dismissible with "Continue Later" (saves progress)
- [X] Auto-advances on step completion
- [X] Closes and marks complete when all required done

**Constitution Checklist**:
- [X] Clear progress indication (Clarity)
- [X] Resumable if closed (Data Integrity)

---

### Task 3.2: Create ProgressIndicator Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 1.2

**Description**: Create visual progress indicator.

**Files to create/modify**:
- `src/components/features/onboarding/ProgressIndicator.tsx`

**Acceptance Criteria**:
- [X] Segmented bar with segment per step
- [X] Colors: completed (green), current (blue), pending (gray)
- [X] Step titles on hover/below
- [X] Responsive width

---

## Phase 4: Post-Onboarding Checklist

### Task 4.1: Create OnboardingChecklist Component
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 1.3

**Description**: Create persistent checklist shown after wizard.

**Files to create/modify**:
- `src/components/features/onboarding/OnboardingChecklist.tsx`

**Acceptance Criteria**:
- [X] Card component for dashboard sidebar
- [X] Lists remaining checklist items:
  - Create first deadline
  - Upload first document
  - Configure alert preferences
  - Invite team member
  - Complete a deadline
- [X] Checkmarks for completed items
- [X] Progress: "3/5 complete"
- [X] Hides when all complete
- [X] Links to relevant pages

**Constitution Checklist**:
- [X] Clear guidance for users (Clarity)

---

### Task 4.2: Integrate Checklist into Dashboard
**Priority**: P1 (High) | **Estimate**: 1 hour | **Dependencies**: 4.1, 006-dashboard-overview

**Description**: Add checklist to dashboard.

**Files to create/modify**:
- `src/app/(dashboard)/page.tsx`

**Acceptance Criteria**:
- [X] OnboardingChecklist in sidebar or top of dashboard
- [X] Only shows if onboarding not complete
- [X] Collapsible/dismissible

---

## Phase 5: Re-engagement System

### Task 5.1: Create Onboarding Reminder Email Template
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Create email template for re-engagement.

**Files to create/modify**:
- `src/lib/email/templates/OnboardingReminderEmail.tsx`

**Acceptance Criteria**:
- [X] React email template
- [X] Personalized: userName, orgName
- [X] Shows next incomplete step
- [X] Progress indicator: "You've completed 2/5 steps"
- [X] CTA button: "Continue Setup"
- [X] Variants: 24h reminder, 7d reminder

**Constitution Checklist**:
- [X] Clear actionable message (Clarity)

---

### Task 5.2: Implement Re-engagement Cron Job
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 5.1, 1.3

**Description**: Create cron job for sending reminder emails.

**Files to create/modify**:
- `convex/crons.ts`
- `convex/onboarding.ts`

**Acceptance Criteria**:
- [X] Daily cron at 2 PM UTC
- [X] Queries incomplete onboarding records
- [X] Sends 24h reminder if lastActivityAt >= 24h ago and < 48h
- [X] Sends 7d reminder if lastActivityAt >= 168h and < 192h
- [X] Uses Resend adapter
- [X] Logs sent reminders

**Constitution Checklist**:
- [X] Re-engagement for incomplete (UX)

---

### Task 5.3: Track Reminder History
**Priority**: P2 (Medium) | **Estimate**: 1-2 hours | **Dependencies**: 5.2

**Description**: Track which reminders have been sent.

**Files to create/modify**:
- `convex/schema.ts`
- `convex/onboarding.ts`

**Acceptance Criteria**:
- [X] Add `remindersSent` array to progress table
- [X] Record: type, sentAt
- [X] Don't send same reminder twice

---

## Phase 6: Test Alert Implementation

### Task 6.1: Implement Test Alert Mutation
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 002-alert-notification-system

**Description**: Create mutation for sending test alerts.

**Files to create/modify**:
- `convex/alerts.ts`

**Acceptance Criteria**:
- [X] `sendTestAlert(orgId, channel, phone?)` mutation
- [X] Sends via email adapter with "[TEST]" prefix
- [X] Sends via SMS adapter with "TEST:" prefix
- [X] Returns success/failure
- [X] Logs as test (not counted against limits)

**Constitution Checklist**:
- [X] Test alerts verify delivery works (Alert Reliability)

---

## Phase 7: Testing

### Task 7.1: Write Unit Tests for Onboarding Logic
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Unit tests for onboarding functions.

**Files to create/modify**:
- `tests/unit/onboarding.test.ts`

**Acceptance Criteria**:
- [X] Test progress initialization
- [X] Test step completion
- [X] Test incomplete detection
- [X] Test completion marking
- [X] 80% coverage

**Constitution Checklist**:
- [X] 80% coverage (Testing Standards)

---

### Task 7.2: Write E2E Tests for Onboarding Flow
**Priority**: P1 (High) | **Estimate**: 4-5 hours | **Dependencies**: 3.1

**Description**: E2E tests for onboarding wizard.

**Files to create/modify**:
- `convex/onboarding.test.ts`

**Acceptance Criteria**:
- [X] Test: New user sees wizard
- [X] Test: Complete org setup step
- [X] Test: Skip template import
- [X] Test: Send test alert
- [X] Test: Create first deadline
- [X] Test: Wizard closes on completion
- [X] Test: Checklist appears on dashboard

**Constitution Checklist**:
- [X] E2E for critical paths (Testing Standards)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Data Layer | 3 | P0 | 4-6 |
| 2. Step Components | 5 | P0-P1 | 15-20 |
| 3. Wizard Container | 2 | P0-P1 | 5-7 |
| 4. Post-Onboarding | 2 | P1 | 4-5 |
| 5. Re-engagement | 3 | P1-P2 | 5-7 |
| 6. Test Alert | 1 | P0 | 2-3 |
| 7. Testing | 2 | P1 | 6-8 |
| **Total** | **18** | | **41-56** |

## Dependencies Graph

```
1.1 Schema ─► 1.3 Mutations ─► 2.1-2.5 Step Components ─► 3.1 Wizard
                    │
                    └─► 4.1 Checklist ─► 4.2 Dashboard Integration
                    │
                    └─► 5.2 Cron Job ◄─ 5.1 Email Template

6.1 Test Alert ◄─ 2.3 AlertSetupStep
```

**Note**: Test alerts are **required** during onboarding to verify alert delivery works (Constitution: Alert Reliability).
