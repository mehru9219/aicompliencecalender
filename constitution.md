## AI Compliance Calendar - Project Constitution

---

### 1. Core Mission

```
This application exists to protect regulated businesses from costly compliance 
failures. Every decision must prioritize RELIABILITY and TRUST over features 
or aesthetics. A missed alert or lost document could cost users thousands of 
dollars in fines.
```

---

### 2. Non-Negotiable Principles

#### 2.1 Data Integrity

- **Zero data loss tolerance.** User documents and deadline data are sacred.
- All database operations must be atomic and recoverable.
- Every file upload must be verified before confirming success to user.
- Implement soft-delete for all user data; hard deletes require explicit admin action.
- Daily automated backups with point-in-time recovery capability.

#### 2.2 Alert Reliability

- **Alerts must never fail silently.** If an alert cannot be delivered, the system must:
  1. Retry with exponential backoff
  2. Escalate to alternative channels
  3. Log the failure visibly in user dashboard
  4. Notify system administrators
- Alert scheduling uses UTC internally; timezone conversion happens only at display/send time.
- All scheduled jobs must have dead-letter queues and monitoring.

#### 2.3 Security & Privacy

- All documents are encrypted at rest.
- Multi-tenant isolation is mandatory; no user can ever access another organization's data.
- Authentication tokens expire; sessions have reasonable timeouts.
- Audit logs track all document access and deadline modifications.
- HIPAA-adjacent mindset: assume user data is sensitive by default.

---

### 3. Code Quality Standards

#### 3.1 TypeScript Strictness

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
- All API responses must be validated with Zod or equivalent.
- Prefer `unknown` over `any` when type is truly unknown.

#### 3.2 Error Handling

- **Never swallow errors.** Every catch block must either:
  1. Handle the error meaningfully
  2. Re-throw with added context
  3. Log and notify appropriately
- User-facing errors must be clear and actionable, never technical jargon.
- All external API calls (Resend, Twilio, Claude) must have timeout limits and fallback behavior.

#### 3.3 Code Organization

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

#### 3.4 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DeadlineCard.tsx` |
| Hooks | camelCase with `use` prefix | `useDeadlines.ts` |
| Convex mutations | camelCase verb-first | `createDeadline`, `updateAlert` |
| Convex queries | camelCase noun-first | `deadlinesByOrg`, `upcomingAlerts` |
| Database tables | snake_case plural | `deadlines`, `alert_logs` |
| Environment variables | SCREAMING_SNAKE_CASE | `RESEND_API_KEY` |

---

### 4. Testing Standards

#### 4.1 Required Coverage

| Layer | Minimum Coverage | Focus |
|-------|------------------|-------|
| Alert scheduling logic | 100% | This is life-or-death for the product |
| Date/timezone utilities | 100% | Bugs here cause missed deadlines |
| Convex mutations | 80% | Data integrity |
| API integrations | 80% | Mock external services |
| UI components | 60% | Critical user flows |

#### 4.2 Test Types

- **Unit tests** for all date manipulation, recurrence calculation, and alert scheduling.
- **Integration tests** for Convex function chains (create deadline → schedule alerts).
- **E2E tests** for critical paths:
  1. Signup → Onboarding → First deadline creation
  2. Alert delivery flow (mock channels)
  3. Document upload → retrieval
  4. Form pre-fill flow

#### 4.3 Testing Principles

- Tests must not depend on real time; use dependency injection for `Date.now()`.
- External services (Resend, Twilio, Claude) are always mocked in tests.
- Each test must be independent; no shared mutable state between tests.

---

### 5. User Experience Principles

#### 5.1 Information Hierarchy

- **Dashboard shows danger first.** Overdue items → Due this week → Upcoming.
- Red/yellow/green status indicators must be instantly recognizable.
- Critical actions (delete, send alert) require explicit confirmation.

#### 5.2 Error States

- Every loading state must have a corresponding error state.
- Error messages must tell users:
  1. What went wrong (simple language)
  2. What they can do about it
  3. How to get help if stuck
- Never show stack traces or technical errors to users.

#### 5.3 Mobile Experience

- Dashboard and alerts must be fully functional on mobile.
- Touch targets minimum 44x44px.
- Critical actions (mark complete, view deadline) accessible within 2 taps.

#### 5.4 Accessibility

- All interactive elements must be keyboard accessible.
- Color is never the only indicator of status (use icons + color).
- Form inputs have visible labels, not just placeholders.
- Minimum contrast ratio 4.5:1 for text.

---

### 6. Performance Requirements

#### 6.1 Response Times

| Action | Target | Maximum |
|--------|--------|---------|
| Dashboard load | < 1s | 2s |
| Deadline CRUD | < 500ms | 1s |
| Document upload (< 10MB) | < 3s | 5s |
| Search results | < 500ms | 1s |
| Form pre-fill generation | < 10s | 30s |

#### 6.2 Optimization Rules

- No N+1 queries; batch all database reads.
- Images and documents lazy-load below the fold.
- Calendar view virtualizes items beyond visible range.
- AI operations (form pre-fill) run async with progress indication.

#### 6.3 Scalability Targets

- Support 1,000 organizations without architecture changes.
- Support 100,000 deadlines per organization.
- Support 10,000 documents per organization.

---

### 7. External Service Principles

#### 7.1 Dependency Isolation

- All external services (Resend, Twilio, Claude, Stripe) must be wrapped in adapter interfaces.
- Switching providers should require changes only in the adapter, not business logic.
- Example structure:
  ```
  /lib/adapters
    /email
      interface.ts    # EmailAdapter interface
      resend.ts       # Resend implementation
    /sms
      interface.ts    # SMSAdapter interface
      twilio.ts       # Twilio implementation
  ```

#### 7.2 Failure Handling

- External service failures must never crash the application.
- Implement circuit breakers for repeated failures.
- Queue failed operations for retry rather than losing them.

#### 7.3 Cost Awareness

- Log and monitor API usage for billing predictability.
- Implement rate limiting on AI features to prevent runaway costs.
- Batch operations where possible (bulk email vs. individual sends).

---

### 8. Development Workflow

#### 8.1 Git Practices

- `main` branch is always deployable.
- Feature branches named: `feature/short-description`
- Bug fixes named: `fix/short-description`
- Commits are atomic and descriptive; no "WIP" or "fix stuff" messages.

#### 8.2 Code Review Checklist

Before merging, verify:
- [ ] No `console.log` statements in production code
- [ ] Error states handled for all async operations
- [ ] Loading states present for all data fetching
- [ ] Types are explicit, no implicit `any`
- [ ] Tests added/updated for changed logic
- [ ] No hardcoded strings that should be constants/config

#### 8.3 Environment Management

- `.env.local` for local development (never committed)
- `.env.example` with all required variables documented
- Secrets stored in Vercel/platform environment, never in code

---

### 9. Documentation Requirements

#### 9.1 Code Documentation

- Complex business logic must have explanatory comments.
- All Convex functions must have JSDoc describing purpose and parameters.
- Non-obvious regex or date calculations require inline explanation.

#### 9.2 System Documentation

- README covers setup, environment variables, and basic architecture.
- `/docs` folder contains:
  - Architecture decisions (ADRs)
  - API documentation
  - Deployment procedures

---

### 10. Compliance-Specific Rules

#### 10.1 Audit Trail

- Every deadline status change is logged with timestamp and actor.
- Document access is logged for compliance audits.
- Logs are immutable; no deletion of audit records.

#### 10.2 Data Retention

- Completed deadlines retained for 7 years minimum (regulatory requirement).
- Documents retained until user explicitly requests deletion.
- Deleted items remain in soft-delete state for 30 days before permanent removal.

#### 10.3 Industry Templates

- All pre-built compliance templates must cite regulatory sources.
- Templates are reviewed quarterly for regulatory changes.
- Users are notified when templates they use are updated.

---

### 11. Metrics & Monitoring

#### 11.1 Critical Alerts

System must alert developers when:
- Alert delivery failure rate > 1%
- Database query times > 2s
- Error rate > 0.1%
- Cron jobs fail to execute

#### 11.2 Business Metrics to Track

- Alert delivery success rate (target: 99.9%)
- Time from signup to first deadline created
- Document upload success rate
- Form pre-fill accuracy (user corrections)

---

### Summary: The Three Laws

1. **Never lose user data.** Documents and deadlines are the reason users pay.

2. **Never miss an alert.** A silent failure is worse than a visible error.

3. **Never compromise on clarity.** Users must always know their compliance status at a glance.

---

*This constitution governs all development decisions for the AI Compliance Calendar. When in doubt, refer to these principles.*