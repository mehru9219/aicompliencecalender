# Feature Specification: Reporting & Analytics

**Feature Branch**: `011-reporting-analytics`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a reporting system that generates compliance summaries, tracks trends over time, and produces audit-ready documentation for regulators and executives."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Compliance Summary Report (Priority: P1)

A compliance manager generates a one-page summary showing overall compliance status, upcoming deadlines, and overdue items for a monthly executive meeting.

**Why this priority**: Summary reports provide immediate value for executive communication - a core use case.

**Independent Test**: Can be tested by generating a summary report and verifying it contains correct data sections.

**Acceptance Scenarios**:

1. **Given** the reports section, **When** user clicks "Compliance Summary", **Then** a report generates showing: total deadlines, compliance score trend, breakdown by category, upcoming (30 days), and overdue items.
2. **Given** a generated summary, **When** user clicks "Export PDF", **Then** a professional PDF downloads with organization letterhead placeholder.
3. **Given** the summary report, **When** displayed, **Then** the compliance score shows a 12-month trend graph.

---

### User Story 2 - View Completion Trends (Priority: P1)

A compliance officer analyzes trends to understand that Q4 has historically higher late completions, enabling proactive planning.

**Why this priority**: Trend analysis reveals patterns that prevent future failures - high value for compliance improvement.

**Independent Test**: Can be tested by viewing trends with historical data and verifying graph accuracy.

**Acceptance Scenarios**:

1. **Given** 12 months of deadline history, **When** viewing completion trends, **Then** a graph shows on-time vs. late completions over time.
2. **Given** trend data, **When** filtered by category "Training", **Then** the graph shows only training deadline trends.
3. **Given** trend analysis, **When** compared quarter-over-quarter, **Then** users can see performance patterns (e.g., "Q4 is consistently worse").

---

### User Story 3 - Generate Audit Preparation Package (Priority: P1)

During a regulatory audit, the compliance officer generates a complete package for "HIPAA" that includes all related documents, deadline history, and alert logs - ready to hand to auditors.

**Why this priority**: Audit packages are the "killer feature" that justifies the product during high-stakes moments.

**Independent Test**: Can be tested by generating an audit package and verifying it contains all relevant materials.

**Acceptance Scenarios**:

1. **Given** user selects "HIPAA" compliance area, **When** they generate audit package, **Then** it includes: cover letter, table of contents, all HIPAA deadlines with history, all linked documents, and alert delivery logs.
2. **Given** the audit package, **When** exported, **Then** it's available as PDF binder or ZIP with organized folders.
3. **Given** multiple deadline completions, **When** included in package, **Then** each shows: completion date, who completed it, and any associated documents.

---

### User Story 4 - Team Performance Report (Priority: P2)

An organization admin reviews team performance to identify if one team member is overloaded or consistently completing tasks late.

**Why this priority**: Team analytics enable management decisions but require team usage data first.

**Independent Test**: Can be tested by generating team report with multiple users and verifying accuracy.

**Acceptance Scenarios**:

1. **Given** an organization with 5 users, **When** admin views team performance, **Then** they see: deadlines per person, completion rate, average days before due date at completion.
2. **Given** team performance data, **When** displayed, **Then** it's shown only to Admins/Owners (not visible to Members).
3. **Given** a team member with concerning metrics, **When** reviewed, **Then** admin can click through to see specific deadlines.

---

### User Story 5 - Custom Report Builder (Priority: P2)

A CFO wants a monthly report showing only financial compliance items (insurance, tax filings) with completion rates - and wants it emailed automatically on the 1st of each month.

**Why this priority**: Custom reports serve varied needs but require understanding of available data first.

**Independent Test**: Can be tested by creating a custom report definition and verifying correct data appears.

**Acceptance Scenarios**:

1. **Given** report builder, **When** user selects date range, categories "Insurance" and "Filing", **Then** only those deadlines appear in report.
2. **Given** a custom report configuration, **When** saved, **Then** user can re-run it anytime with updated data.
3. **Given** a scheduled report, **When** configured to run monthly, **Then** it auto-generates and emails on the 1st of each month.

---

### User Story 6 - Executive Dashboard (Priority: P3)

A business owner who doesn't manage day-to-day compliance logs in with "Executive View" to see high-level risk summary and cost avoidance estimate.

**Why this priority**: Executive view is a specialized interface but requires core reporting to exist first.

**Independent Test**: Can be tested by accessing executive view and verifying high-level metrics are displayed.

**Acceptance Scenarios**:

1. **Given** a user with Owner role, **When** they select "Executive View", **Then** dashboard shows: organization-wide compliance score, risk summary, and cost avoidance estimate.
2. **Given** cost avoidance display, **When** calculated, **Then** it shows: "X deadlines completed on time = $Y in avoided fines" with methodology tooltip.
3. **Given** executive dashboard, **When** drilled down, **Then** user can navigate to detailed reports if needed.

---

### Edge Cases

- What happens when generating a report for a date range with no data?
- How does the system handle scheduled reports when the user's account is downgraded or cancelled?
- What happens when an audit package is too large to generate (10,000+ documents)?
- How does the system calculate cost avoidance without knowing actual fine amounts?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide Compliance Summary Report with: total deadlines, compliance score (12-month trend), category breakdown, upcoming (30 days), and overdue items.
- **FR-002**: Summary Report MUST be exportable as PDF with organization branding placeholder.
- **FR-003**: System MUST provide Completion Trends analysis showing on-time vs. late completions over time.
- **FR-004**: Trends MUST support filtering by: category, assigned user, date range.
- **FR-005**: Trends MUST support comparison views: month-over-month, quarter-over-quarter, year-over-year.
- **FR-006**: System MUST provide Audit Preparation Report generator for specific compliance areas.
- **FR-007**: Audit Report MUST include: customizable cover letter, table of contents, all related deadlines with completion history, all linked documents, alert delivery logs, and timeline visualization.
- **FR-008**: Audit Report MUST export as PDF binder or ZIP with organized folder structure.
- **FR-009**: System MUST provide Team Performance Report showing: deadlines per person, completion rate, average time before due date.
- **FR-010**: Team Performance MUST be accessible only to Admin and Owner roles.
- **FR-011**: Team Performance MUST NOT include leaderboards or competitive rankings (to avoid toxic dynamics).
- **FR-012**: System MUST provide Custom Report Builder allowing selection of: date range, categories, users, metrics, visualization type.
- **FR-013**: Custom Report configurations MUST be saveable for reuse.
- **FR-014**: Custom Reports MUST support scheduled generation (weekly, monthly, quarterly).
- **FR-015**: Scheduled Reports MUST auto-email to specified recipients on configured dates.
- **FR-016**: System MUST provide Executive Dashboard with: organization-wide compliance score, risk summary, and cost avoidance estimate.
- **FR-017**: Cost Avoidance MUST calculate based on: deadlines completed on time multiplied by estimated fine amounts per category.
- **FR-018**: Executive Dashboard MUST be accessible via "Executive View" option for Owner/Admin roles.
- **FR-019**: All reports MUST reflect real-time data accurate to within 5 minutes.

### Key Entities

- **Report Template**: Predefined report structure (Summary, Trends, Audit, Team Performance).
- **Custom Report Definition**: User-created report configuration with filters and display options.
- **Scheduled Report**: Automated report generation with frequency and recipient list.
- **Cost Avoidance Calculation**: Metric based on timely completions and estimated fine amounts.
- **Audit Package**: Comprehensive compliance documentation bundle for regulatory review.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Compliance Summary Report generates in under 30 seconds for organizations with up to 1000 deadlines.
- **SC-002**: Audit Preparation Package generates in under 2 minutes for up to 500 documents.
- **SC-003**: Users can create and save a custom report in under 5 minutes.
- **SC-004**: Scheduled reports deliver within 1 hour of configured time.
- **SC-005**: 90% of users find audit packages "complete enough for auditor review."
- **SC-006**: Executive cost avoidance metric is cited in 50%+ of enterprise sales conversations.
- **SC-007**: Report data accuracy is 100% (matches underlying database records).

## Assumptions

- Cost avoidance calculations use industry-standard fine estimates; exact amounts vary by regulation and jurisdiction.
- "Estimated fine amounts" are configurable or based on reasonable defaults per category.
- Large audit packages (1000+ documents) may require async generation with email notification when ready.
- Team performance metrics are informational, not punitive; organizational culture determines usage.
- Executive View is a simplified interface, not a separate login system.

## Clarifications

### Session 2026-01-28

- Q: When generating a report for a date range with no data? → A: Show empty report with "No data for period" message - user chose the range, show results
- Q: When an audit package would contain 10,000+ documents? → A: Async generation with email notification when ready - prevents timeout issues
- Q: What happens to scheduled reports when account is cancelled? → A: Cancel future schedules, keep report definitions for reactivation - preserves config for potential return
- Q: How should default fine estimates be sourced for cost avoidance? → A: Industry research with documented averages, configurable override per org

### Integrated Decisions

**Empty Report Display**:
```tsx
{data.length === 0 ? (
  <EmptyState
    title="No data for this period"
    description="Try expanding your date range or check your filters."
    action={{ label: 'Last 12 months', onClick: setDefaultDateRange }}
  />
) : (
  <ReportCharts data={data} />
)}
```

**Large Audit Package Generation**:
```typescript
// Trigger async job
const jobId = await startAuditExport(params);

// Show UI
<div>
  <p>Your audit package is being generated.</p>
  <p>We'll email you at {user.email} when it's ready to download.</p>
</div>
// Background job completes and emails download link
```

**Scheduled Report Cancellation**:
```typescript
// On account cancellation:
await ctx.db
  .query("scheduled_reports")
  .withIndex("by_org", q => q.eq("orgId", orgId))
  .forEach(async (report) => {
    await ctx.db.patch(report._id, {
      status: 'paused_cancelled',
      pausedAt: Date.now(),
    });
  });
// Definitions preserved for potential reactivation
```

**Cost Avoidance Defaults**:
```typescript
const DEFAULT_PENALTY_ESTIMATES = {
  license: { amount: 5000, source: 'State average, 2023 enforcement data' },
  hipaa: { amount: 25000, source: 'HHS OCR settlement averages' },
  certification: { amount: 3000, source: 'Industry survey, 2023' },
  training: { amount: 1000, source: 'OSHA fine averages' },
  filing: { amount: 2000, source: 'IRS/state late filing penalties' },
};

// User can override in org settings
orgSettings.customPenaltyEstimates = {
  license: 10000, // Their state has higher penalties
};
```
