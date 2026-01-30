<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0 (MAJOR - Initial constitution creation)

Modified Principles: N/A (new document)

Added Sections:
  - Core Mission (The Three Laws)
  - Data Integrity
  - Alert Reliability
  - Security & Privacy
  - Code Quality Standards
  - Testing Standards
  - User Experience Principles
  - Performance Requirements
  - External Service Principles
  - Development Workflow
  - Documentation Requirements
  - Compliance-Specific Rules
  - Metrics & Monitoring
  - Governance

Removed Sections: N/A (new document)

Templates Requiring Updates:
  - .specify/templates/plan-template.md: Constitution Check section updated with specific gates
  - .specify/templates/spec-template.md: No changes required (generic template)
  - .specify/templates/tasks-template.md: No changes required (generic template)

Follow-up TODOs: None
-->

# AI Compliance Calendar Constitution

## Core Mission

This application exists to protect regulated businesses from costly compliance
failures. Every decision MUST prioritize RELIABILITY and TRUST over features
or aesthetics. A missed alert or lost document could cost users thousands of
dollars in fines.

### The Three Laws

1. **Never lose user data.** Documents and deadlines are the reason users pay.
2. **Never miss an alert.** A silent failure is worse than a visible error.
3. **Never compromise on clarity.** Users MUST always know their compliance status at a glance.

## Core Principles

### I. Data Integrity

**Zero data loss tolerance.** User documents and deadline data are sacred.

- All database operations MUST be atomic and recoverable.
- Every file upload MUST be verified before confirming success to user.
- Implement soft-delete for all user data; hard deletes require explicit admin action.
- Daily automated backups with point-in-time recovery capability.

### II. Alert Reliability

**Alerts MUST never fail silently.** If an alert cannot be delivered, the system MUST:

1. Retry with exponential backoff
2. Escalate to alternative channels
3. Log the failure visibly in user dashboard
4. Notify system administrators

Additional requirements:
- Alert scheduling uses UTC internally; timezone conversion happens only at display/send time.
- All scheduled jobs MUST have dead-letter queues and monitoring.

### III. Security & Privacy

- All documents MUST be encrypted at rest.
- Multi-tenant isolation is mandatory; no user can ever access another organization's data.
- Authentication tokens MUST expire; sessions have reasonable timeouts.
- Audit logs MUST track all document access and deadline modifications.
- HIPAA-adjacent mindset: assume user data is sensitive by default.

### IV. Code Quality Standards

**TypeScript Strictness:**
```typescript
// tsconfig.json requirements
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

- No `any` types except in explicitly justified edge cases with comments.
- All API responses MUST be validated with Zod or equivalent.
- Prefer `unknown` over `any` when type is truly unknown.

**Error Handling:**
- **Never swallow errors.** Every catch block MUST either:
  1. Handle the error meaningfully
  2. Re-throw with added context
  3. Log and notify appropriately
- User-facing errors MUST be clear and actionable, never technical jargon.
- All external API calls (Resend, Twilio, Claude) MUST have timeout limits and fallback behavior.

**Code Organization:**
```
/src
  /app              # Next.js routes
  /components
    /ui             # Pure presentational (buttons, inputs, cards)
    /features       # Feature-specific (DeadlineCard, AlertSettings)
  /convex           # All Convex functions
    /mutations      # Write operations
    /queries        # Read operations
    /actions        # External API calls
    /crons          # Scheduled jobs
  /lib              # Shared utilities
  /types            # Shared TypeScript types
```

- Components are either **pure UI** or **feature-specific**, never mixed.
- Convex functions are organized by operation type, not by feature.
- No business logic in components; extract to hooks or Convex functions.

**Naming Conventions:**

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DeadlineCard.tsx` |
| Hooks | camelCase with `use` prefix | `useDeadlines.ts` |
| Convex mutations | camelCase verb-first | `createDeadline`, `updateAlert` |
| Convex queries | camelCase noun-first | `deadlinesByOrg`, `upcomingAlerts` |
| Database tables | snake_case plural | `deadlines`, `alert_logs` |
| Environment variables | SCREAMING_SNAKE_CASE | `RESEND_API_KEY` |

### V. Testing Standards

**Required Coverage:**

| Layer | Minimum Coverage | Focus |
|-------|------------------|-------|
| Alert scheduling logic | 100% | Life-or-death for the product |
| Date/timezone utilities | 100% | Bugs here cause missed deadlines |
| Convex mutations | 80% | Data integrity |
| API integrations | 80% | Mock external services |
| UI components | 60% | Critical user flows |

**Test Types:**
- **Unit tests** for all date manipulation, recurrence calculation, and alert scheduling.
- **Integration tests** for Convex function chains (create deadline -> schedule alerts).
- **E2E tests** for critical paths:
  1. Signup -> Onboarding -> First deadline creation
  2. Alert delivery flow (mock channels)
  3. Document upload -> retrieval
  4. Form pre-fill flow

**Testing Principles:**
- Tests MUST NOT depend on real time; use dependency injection for `Date.now()`.
- External services (Resend, Twilio, Claude) are always mocked in tests.
- Each test MUST be independent; no shared mutable state between tests.

## User Experience Principles

### Information Hierarchy

- **Dashboard shows danger first.** Overdue items -> Due this week -> Upcoming.
- Red/yellow/green status indicators MUST be instantly recognizable.
- Critical actions (delete, send alert) require explicit confirmation.

### Error States

- Every loading state MUST have a corresponding error state.
- Error messages MUST tell users:
  1. What went wrong (simple language)
  2. What they can do about it
  3. How to get help if stuck
- Never show stack traces or technical errors to users.

### Mobile Experience

- Dashboard and alerts MUST be fully functional on mobile.
- Touch targets minimum 44x44px.
- Critical actions (mark complete, view deadline) accessible within 2 taps.

### Accessibility

- All interactive elements MUST be keyboard accessible.
- Color is never the only indicator of status (use icons + color).
- Form inputs have visible labels, not just placeholders.
- Minimum contrast ratio 4.5:1 for text.

## Performance Requirements

### Response Times

| Action | Target | Maximum |
|--------|--------|---------|
| Dashboard load | < 1s | 2s |
| Deadline CRUD | < 500ms | 1s |
| Document upload (< 10MB) | < 3s | 5s |
| Search results | < 500ms | 1s |
| Form pre-fill generation | < 10s | 30s |

### Optimization Rules

- No N+1 queries; batch all database reads.
- Images and documents lazy-load below the fold.
- Calendar view virtualizes items beyond visible range.
- AI operations (form pre-fill) run async with progress indication.

### Scalability Targets

- Support 1,000 organizations without architecture changes.
- Support 100,000 deadlines per organization.
- Support 10,000 documents per organization.

## External Service Principles

### Dependency Isolation

All external services (Resend, Twilio, Claude, Stripe) MUST be wrapped in adapter interfaces.
Switching providers should require changes only in the adapter, not business logic.

**Example structure:**
```
/lib/adapters
  /email
    interface.ts    # EmailAdapter interface
    resend.ts       # Resend implementation
  /sms
    interface.ts    # SMSAdapter interface
    twilio.ts       # Twilio implementation
```

### Failure Handling

- External service failures MUST never crash the application.
- Implement circuit breakers for repeated failures.
- Queue failed operations for retry rather than losing them.

### Cost Awareness

- Log and monitor API usage for billing predictability.
- Implement rate limiting on AI features to prevent runaway costs.
- Batch operations where possible (bulk email vs. individual sends).

## Development Workflow

### Git Practices

- `main` branch is always deployable.
- Feature branches named: `feature/short-description`
- Bug fixes named: `fix/short-description`
- Commits are atomic and descriptive; no "WIP" or "fix stuff" messages.

### Code Review Checklist

Before merging, verify:
- [ ] No `console.log` statements in production code
- [ ] Error states handled for all async operations
- [ ] Loading states present for all data fetching
- [ ] Types are explicit, no implicit `any`
- [ ] Tests added/updated for changed logic
- [ ] No hardcoded strings that should be constants/config

### Environment Management

- `.env.local` for local development (never committed)
- `.env.example` with all required variables documented
- Secrets stored in Vercel/platform environment, never in code

## Documentation Requirements

### Code Documentation

- Complex business logic MUST have explanatory comments.
- All Convex functions MUST have JSDoc describing purpose and parameters.
- Non-obvious regex or date calculations require inline explanation.

### System Documentation

- README covers setup, environment variables, and basic architecture.
- `/docs` folder contains:
  - Architecture decisions (ADRs)
  - API documentation
  - Deployment procedures

## Compliance-Specific Rules

### Audit Trail

- Every deadline status change is logged with timestamp and actor.
- Document access is logged for compliance audits.
- Logs are immutable; no deletion of audit records.

### Data Retention

- Completed deadlines retained for 7 years minimum (regulatory requirement).
- Documents retained until user explicitly requests deletion.
- Deleted items remain in soft-delete state for 30 days before permanent removal.

### Industry Templates

- All pre-built compliance templates MUST cite regulatory sources.
- Templates are reviewed quarterly for regulatory changes.
- Users are notified when templates they use are updated.

## Metrics & Monitoring

### Critical Alerts

System MUST alert developers when:
- Alert delivery failure rate > 1%
- Database query times > 2s
- Error rate > 0.1%
- Cron jobs fail to execute

### Business Metrics to Track

- Alert delivery success rate (target: 99.9%)
- Time from signup to first deadline created
- Document upload success rate
- Form pre-fill accuracy (user corrections)

## Governance

This constitution supersedes all other development practices. All code changes MUST
comply with these principles.

### Amendment Procedure

1. Proposed changes MUST be documented with rationale.
2. Amendments require review and explicit approval.
3. Breaking changes require migration plan for existing code.
4. Version number MUST be updated according to semantic versioning:
   - MAJOR: Backward incompatible changes to principles
   - MINOR: New principles or expanded guidance
   - PATCH: Clarifications and non-semantic refinements

### Compliance Review

- All PRs/reviews MUST verify compliance with these principles.
- Complexity MUST be justified against the simplicity mandate.
- When in doubt, refer to The Three Laws.

## Cross-Feature Clarifications

### Session 2026-01-28

The following decisions apply across all features:

- Q: Should rate limits be per-org, per-user, or API-global? → A: Per-org (organization-level throttling) - aligns with billing tiers
- Q: Data retention for compliance records - 7 years for all data? → A: Configurable per org based on regulatory requirements - 7-year default minimum
- Q: Which accessibility standard should be the compliance target? → A: WCAG 2.1 AA (industry standard for commercial software)
- Q: Is a native mobile app in scope for initial launch? → A: PWA with push notifications - single codebase, covers critical alert use case

### Integrated Cross-Feature Decisions

**Rate Limiting Strategy**:
```typescript
// Per-organization rate limits
const key = `ratelimit:${orgId}:${action}`;
const limit = PLAN_LIMITS[plan][action];
const current = await getCount(key);

if (current >= limit) {
  throw new RateLimitError(`Limit exceeded: ${limit} ${action} per hour`);
}
```

**Data Retention Configuration**:
```typescript
// Organization settings - configurable per regulatory requirements
dataRetention: {
  auditLogs: 7,        // years, minimum 7
  completedDeadlines: 7, // years
  documents: 'indefinite', // or number of years
}

// Defaults for new organizations
const DEFAULT_RETENTION = {
  auditLogs: 7,
  completedDeadlines: 7,
  documents: 'indefinite',
};
```

**Accessibility Target**: WCAG 2.1 Level AA compliance required.

**Mobile Strategy**: PWA (Progressive Web App) with:
- Push notifications for alerts
- Installable on home screen
- Offline capability for viewing cached data
- Native apps deferred to future phase based on user demand

**Version**: 1.1.0 | **Ratified**: 2026-01-27 | **Last Amended**: 2026-01-28
