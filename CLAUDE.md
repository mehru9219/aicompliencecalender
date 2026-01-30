# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Be extremely concise in all interactions and commit messages, sacrifice grammar for concision.

## Repository Structure

This is a **monorepo with docs + app**:

```
/                           # Root: planning & specs
  /specs                    # Feature specifications (001-011)
  /constitution.md          # Project principles
  /specification.md         # Full product spec
  /aicompliencecalender/    # ← ACTUAL APP (cd here to develop)
```

**To develop:** `cd aicompliencecalender && npm run dev`

## Feature Specs (/specs)

11 features with full specs, each containing:
- `spec.md` - User stories, acceptance criteria
- `plan.md` - Implementation plan
- `tasks.md` - Task breakdown

| # | Feature |
|---|---------|
| 001 | Deadline Management |
| 002 | Alert/Notification System |
| 003 | Document Vault |
| 004 | AI Form Prefill |
| 005 | Industry Templates |
| 006 | Dashboard Overview |
| 007 | Calendar View |
| 008 | Org/Team Management |
| 009 | Onboarding |
| 010 | Billing/Subscription |
| 011 | Reporting/Analytics |

## Constitution (Three Laws)
1. Never lose user data
2. Never miss an alert
3. Never compromise on clarity

## Key Conventions
- UTC storage, timezone display at render
- Soft-delete 30 days, audit logs 7 years
- Multi-tenant isolation mandatory
- WCAG 2.1 AA accessibility
- No `any` types, Zod validation for external APIs

## Naming
- Components: PascalCase
- Hooks: `use` prefix
- Mutations: verb-first (`createDeadline`)
- Queries: noun-first (`deadlinesByOrg`)
- Tables: snake_case plural
- Env vars: SCREAMING_SNAKE_CASE

## Tech Stack (planned)
- Next.js + React + TypeScript
- Convex (backend/database)
- Clerk (auth)
- Tailwind CSS + shadcn/ui
- Resend (email), Twilio (SMS), Claude API (AI)
- Stripe (billing)

## Development Workflow

### UI Components
- Use **shadcn MCP** + **frontend-design skill** for all UI work
- Copy `COLORPALETTE.md` content to `app/globals.css` — this is our design system (colors, typography, shadows)
- **Never modify COLORPALETTE.md** — it's the source of truth

### After Every Implementation
Run these checks and fix all errors before committing:

```bash
cd aicompliencecalender
npx tsc --noEmit          # TypeScript strict mode
npx convex typecheck      # Convex type errors
npm run lint              # ESLint
npx prettier --check .    # Formatting
```

### Testing Protocol
1. After implementing a feature, find the matching section in `TESTING.md`
2. Run each test case that relates to your implementation
3. Mark passed tests with ✅ in TESTING.md
4. If a test fails: fix the code, rerun, then mark ✅
5. Never mark ✅ without actually running the test

### Documentation Protocol
After every implementation, update `DOCUMENTATION.md` with:
- What was built (concise, 1-2 lines)
- Key files changed
- Any patterns/utilities created

This prevents code duplication, mismatches, and ensures consistency across features.
