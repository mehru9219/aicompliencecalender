# Tasks: Reporting & Analytics

**Feature**: 011-reporting-analytics | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a comprehensive reporting system with compliance summaries, team performance analytics, audit-ready PDF exports, custom report builder, scheduled report delivery, and cost avoidance estimates. Reports must be accurate, timestamped, and org-scoped (Constitution: Data Integrity, Security).

---

## Phase 1: Report Data Layer

### Task 1.1: Define Report Schema
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create schema for saved reports and scheduled deliveries.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `saved_reports` table: orgId, name, config (dateRangeType, customDateRange, categories, metrics, chartTypes, groupBy), schedule (frequency, recipients, dayOfWeek, dayOfMonth), createdAt, createdBy
- [X] Indexes: `by_org`
- [X] Config validated with Zod before save

**Constitution Checklist**:
- [X] Org isolation with index (Security)

---

### Task 1.2: Implement Compliance Summary Query
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 001-deadline-management

**Description**: Create comprehensive query for compliance metrics.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `getComplianceSummary(orgId, dateRange)` query
- [X] Returns summary: total, completed, onTime, late, overdue, pending, completionRate, onTimeRate
- [X] Returns scoreHistory (monthly scores for 12 months)
- [X] Returns byCategory breakdown with overdue counts
- [X] Returns upcoming deadlines (sorted by dueDate)
- [X] Returns overdueItems (sorted by dueDate)
- [X] Filters by orgId, excludes soft-deleted
- [X] Single query, no N+1

**Constitution Checklist**:
- [X] Org isolation (Security)
- [X] No N+1 queries (Performance)

---

### Task 1.3: Implement Team Performance Query
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2, 008-organization-team-management

**Description**: Create query for team member performance metrics.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `getTeamPerformance(orgId)` query
- [X] Requires `audit:read` permission
- [X] Returns per member: completed count, onTimeRate, avgDaysBefore, activeAssignments
- [X] Groups completions by completedBy user
- [X] Includes member info (name, avatar)

**Constitution Checklist**:
- [X] Permission check required (Security)
- [X] Audit-level access (Compliance)

---

### Task 1.4: Implement Cost Avoidance Query
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Calculate estimated cost savings from on-time completions.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `getCostAvoidance(orgId, dateRange)` query
- [X] Configurable penalty estimates per category:
  - license: $5,000
  - certification: $3,000
  - training: $1,000
  - audit: $10,000
  - filing: $2,000
  - default: $1,000
- [X] Returns: totalAvoided, deadlinesCompletedOnTime, breakdown
- [X] Includes disclaimer about estimates

**Constitution Checklist**:
- [X] Clear disclaimer (Clarity)

---

## Phase 2: Audit Export

### Task 2.1: Create Audit Report PDF Template
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: None

**Description**: Create PDF template using @react-pdf/renderer.

**Files to create/modify**:
- `src/lib/pdf/audit-report.tsx`
- `src/lib/pdf/styles.ts`

**Acceptance Criteria**:
- [X] Install: @react-pdf/renderer
- [X] Cover page: title, compliance area, date range, org name, generation date
- [X] Table of contents: Executive Summary, Deadline History, Documentation, Alert Log, Activity Timeline
- [X] Executive summary: total requirements, on-time count, documents count
- [X] Deadline history table: title, dueDate, completedAt, status (On Time/Late/Pending)
- [X] Documentation inventory: linked documents with upload dates
- [X] Alert delivery log: alert types, sent dates, delivery status
- [X] Activity timeline: key actions with timestamps
- [X] Page numbers, professional styling

**Constitution Checklist**:
- [X] Timestamped generation (Data Integrity)
- [X] Alert log included (Alert Reliability)

---

### Task 2.2: Implement Audit Report Action
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.1

**Description**: Create Convex action to generate audit PDF.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `generateAuditReport(orgId, complianceArea, dateRange)` action
- [X] Fetches: deadlines by category, linked documents, alert log, activity log
- [X] Calls PDF generation
- [X] Stores PDF in Convex storage
- [X] Returns download URL
- [X] Timeout handling for large reports

**Constitution Checklist**:
- [X] Async for large reports (Performance)
- [X] Audit trail included (Compliance)

---

### Task 2.3: Create AuditExportWizard Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.2

**Description**: Create step-by-step wizard for audit export.

**Files to create/modify**:
- `src/components/features/reports/AuditExportWizard.tsx`

**Acceptance Criteria**:
- [X] Step 1: Select compliance area (dropdown)
- [X] Step 2: Select date range (preset or custom)
- [X] Step 3: Preview summary (count of items to include)
- [X] Step 4: Generate and download
- [X] Loading state during generation
- [X] Error handling with retry
- [X] Download button when ready

**Constitution Checklist**:
- [X] Clear step progression (Clarity)
- [X] Loading state (UX)

---

## Phase 3: Custom Report Builder

### Task 3.1: Implement Custom Report Query
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Create flexible query for custom report configurations.

**Files to create/modify**:
- `convex/reports.ts`
- `src/lib/reports/date-ranges.ts`

**Acceptance Criteria**:
- [X] `runCustomReport(orgId, config)` query
- [X] Config: dateRangeType, customDateRange, categories, metrics, groupBy
- [X] Date range resolution: this_month, last_month, this_quarter, this_year, custom
- [X] Metrics: completion_rate, on_time_rate, by_category, by_status, trend
- [X] Category filtering (array)
- [X] Group by: day, week, month, quarter

**Constitution Checklist**:
- [X] Flexible date handling (UX)

---

### Task 3.2: Create ReportBuilder Component
**Priority**: P1 (High) | **Estimate**: 4-5 hours | **Dependencies**: 3.1

**Description**: Create interactive report configuration UI.

**Files to create/modify**:
- `src/components/features/reports/ReportBuilder.tsx`
- `src/components/features/reports/MetricSelector.tsx`
- `src/components/features/reports/DateRangeSelector.tsx`

**Acceptance Criteria**:
- [X] Date range selection with presets and custom
- [X] Category multi-select
- [X] Metric checkboxes (completion rate, on-time rate, by category, by status, trend)
- [X] Group by selector (for trend metric)
- [X] Chart type selection per metric
- [X] Live preview as config changes
- [X] Save report configuration

**Constitution Checklist**:
- [X] Live preview (Clarity)

---

### Task 3.3: Implement Save/Load Report Mutations
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.1

**Description**: Create mutations for saving and loading report configurations.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `saveReport(orgId, name, config)` mutation
- [X] `listSavedReports(orgId)` query
- [X] `deleteReport(reportId)` mutation
- [X] `updateReport(reportId, config)` mutation
- [X] Validates config structure

**Constitution Checklist**:
- [X] Config validation (Data Integrity)

---

## Phase 4: Scheduled Reports

### Task 4.1: Implement Report Schedule Mutation
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.3

**Description**: Add scheduling to saved reports.

**Files to create/modify**:
- `convex/reports.ts`

**Acceptance Criteria**:
- [X] `scheduleReport(reportId, schedule)` mutation
- [X] Schedule options: daily, weekly (dayOfWeek), monthly (dayOfMonth)
- [X] Recipients: array of email addresses
- [X] Validates email format
- [X] Updates saved_reports record

**Constitution Checklist**:
- [X] Email validation (Data Integrity)

---

### Task 4.2: Create Report Delivery Cron
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 4.1

**Description**: Create cron job for scheduled report delivery.

**Files to create/modify**:
- `convex/crons.ts`
- `convex/reports.ts`
- `src/lib/email/templates/ScheduledReportEmail.tsx`

**Acceptance Criteria**:
- [X] Daily cron at 6 AM UTC
- [X] Queries reports due for delivery
- [X] Daily: every day
- [X] Weekly: matches current day of week
- [X] Monthly: matches current day of month
- [X] Generates report data
- [X] Sends email via Resend with report summary
- [X] Attaches CSV/Excel export if configured
- [X] Logs delivery success/failure

**Constitution Checklist**:
- [X] Reliable delivery (Alert Reliability)
- [X] Delivery logging (Audit Trail)

---

### Task 4.3: Create ReportScheduler Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.1

**Description**: Create UI for configuring report schedules.

**Files to create/modify**:
- `src/components/features/reports/ReportScheduler.tsx`

**Acceptance Criteria**:
- [X] Frequency selector: none, daily, weekly, monthly
- [X] Day of week selector (for weekly)
- [X] Day of month selector (for monthly)
- [X] Recipients email input (multi)
- [X] Preview next delivery date
- [X] Enable/disable toggle

**Constitution Checklist**:
- [X] Clear next delivery (Clarity)

---

## Phase 5: Report UI Components

### Task 5.1: Create ComplianceScoreChart Component
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create chart showing compliance score over time.

**Files to create/modify**:
- `src/components/features/reports/ComplianceScoreChart.tsx`

**Acceptance Criteria**:
- [X] Line chart using Recharts
- [X] X-axis: months (12 month history)
- [X] Y-axis: score (0-100)
- [X] Color-coded zones: red (<60), yellow (60-80), green (>80)
- [X] Tooltip with exact score and date
- [X] Responsive sizing

**Constitution Checklist**:
- [X] Chart render < 500ms (Performance)

---

### Task 5.2: Create CategoryBreakdownChart Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create chart showing deadlines by category.

**Files to create/modify**:
- `src/components/features/reports/CategoryBreakdownChart.tsx`

**Acceptance Criteria**:
- [X] Pie or bar chart using Recharts
- [X] Shows count per category
- [X] Highlights categories with overdue
- [X] Legend with category names
- [X] Click to filter

**Constitution Checklist**:
- [X] Clear legend (Clarity)

---

### Task 5.3: Create TeamPerformanceTable Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create table showing team member performance.

**Files to create/modify**:
- `src/components/features/reports/TeamPerformanceTable.tsx`

**Acceptance Criteria**:
- [X] Table columns: Member (avatar + name), Completed, On-Time Rate, Avg Days Before, Active
- [X] Sortable columns
- [X] On-time rate color-coded
- [X] Responsive (cards on mobile)
- [X] Click row to filter dashboard

**Constitution Checklist**:
- [X] Permission-gated display (Security)

---

### Task 5.4: Create CostAvoidanceCard Component
**Priority**: P2 (Medium) | **Estimate**: 1-2 hours | **Dependencies**: 1.4

**Description**: Create card displaying cost avoidance estimate.

**Files to create/modify**:
- `src/components/features/reports/CostAvoidanceCard.tsx`

**Acceptance Criteria**:
- [X] Large dollar amount display
- [X] "Estimated penalties avoided" subtitle
- [X] Count of on-time completions
- [X] Expandable breakdown by category
- [X] Disclaimer text
- [X] Info tooltip explaining calculation

**Constitution Checklist**:
- [X] Disclaimer visible (Clarity)

---

### Task 5.5: Create ExportButtons Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Create export button group for different formats.

**Files to create/modify**:
- `src/components/features/reports/ExportButtons.tsx`
- `src/lib/export/csv.ts`
- `src/lib/export/excel.ts`

**Acceptance Criteria**:
- [X] Install: xlsx, json2csv
- [X] Buttons: CSV, Excel, PDF
- [X] Accepts data array and columns config
- [X] CSV export using json2csv
- [X] Excel export using xlsx
- [X] PDF triggers audit export flow
- [X] Download with timestamped filename

**Constitution Checklist**:
- [X] Timestamped exports (Data Integrity)

---

## Phase 6: Report Pages

### Task 6.1: Create Reports Dashboard Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 5.1-5.4

**Description**: Create main reports landing page.

**Files to create/modify**:
- `src/app/(dashboard)/reports/page.tsx`

**Acceptance Criteria**:
- [X] Header: "Reports & Analytics"
- [X] Quick stats row: Completion Rate, On-Time Rate, Active Deadlines, Estimated Savings
- [X] ComplianceScoreChart (12-month trend)
- [X] CategoryBreakdownChart
- [X] Links to: Compliance Summary, Team Performance, Audit Export, Report Builder
- [X] Recent saved reports list

**Constitution Checklist**:
- [X] Clear navigation (Clarity)

---

### Task 6.2: Create Compliance Summary Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2, 5.1, 5.2

**Description**: Create detailed compliance summary page.

**Files to create/modify**:
- `src/app/(dashboard)/reports/compliance/page.tsx`

**Acceptance Criteria**:
- [X] Date range selector
- [X] Summary stats: total, completed, on-time, late, overdue, pending
- [X] Completion rate and on-time rate prominently displayed
- [X] ComplianceScoreChart
- [X] CategoryBreakdownChart
- [X] Overdue items table with actions
- [X] Upcoming items table
- [X] Export buttons

**Constitution Checklist**:
- [X] Actionable overdue display (Clarity)

---

### Task 6.3: Create Team Performance Page
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3, 5.3

**Description**: Create team performance analytics page.

**Files to create/modify**:
- `src/app/(dashboard)/reports/team/page.tsx`

**Acceptance Criteria**:
- [X] Requires `audit:read` permission
- [X] TeamPerformanceTable
- [X] Workload distribution chart
- [X] Top performers highlight
- [X] Export buttons
- [X] Date range filter

**Constitution Checklist**:
- [X] Permission check (Security)

---

### Task 6.4: Create Audit Export Page
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 2.3

**Description**: Create page for audit export wizard.

**Files to create/modify**:
- `src/app/(dashboard)/reports/audit/page.tsx`

**Acceptance Criteria**:
- [X] AuditExportWizard component
- [X] Recent exports history
- [X] Download links for past exports
- [X] Clear explanation of what's included

**Constitution Checklist**:
- [X] Audit trail accessible (Compliance)

---

### Task 6.5: Create Custom Report Builder Page
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.2, 4.3

**Description**: Create page for custom report building.

**Files to create/modify**:
- `src/app/(dashboard)/reports/custom/page.tsx`

**Acceptance Criteria**:
- [X] ReportBuilder component
- [X] Saved reports sidebar
- [X] Report preview area
- [X] Save/Update/Delete buttons
- [X] Schedule section (ReportScheduler)
- [X] Export buttons

**Constitution Checklist**:
- [X] Save before schedule (Data Integrity)

---

## Phase 7: Testing

### Task 7.1: Write Unit Tests for Report Calculations
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2, 1.4

**Description**: Unit tests for all report calculation functions.

**Files to create/modify**:
- `tests/unit/reports.test.ts`

**Acceptance Criteria**:
- [X] Test compliance summary calculations
- [X] Test on-time rate calculation with edge cases
- [X] Test completion rate with zero deadlines
- [X] Test cost avoidance calculation
- [X] Test date range resolution
- [X] Test trend grouping (day, week, month)
- [X] 100% coverage for calculation functions

**Constitution Checklist**:
- [X] 100% coverage for calculations (Testing Standards)

---

### Task 7.2: Write Integration Tests for Report Queries
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 1.2, 1.3

**Description**: Integration tests for report queries.

**Files to create/modify**:
- `tests/integration/reports.test.ts`

**Acceptance Criteria**:
- [X] Test compliance summary with various deadline states
- [X] Test team performance with multiple users
- [X] Test custom report with different configs
- [X] Test org isolation (cannot see other org data)
- [X] Test permission checks on team report
- [X] 80% coverage

**Constitution Checklist**:
- [X] Org isolation tested (Security)

---

### Task 7.3: Write PDF Generation Tests
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 2.1

**Description**: Tests for PDF generation.

**Files to create/modify**:
- `tests/unit/audit-pdf.test.ts`

**Acceptance Criteria**:
- [X] Test PDF renders without error
- [X] Test all sections included
- [X] Test with empty data (no deadlines)
- [X] Test with large dataset
- [X] Test generation timeout handling
- [X] Snapshot test for PDF structure

**Constitution Checklist**:
- [X] Large report handling (Performance)

---

### Task 7.4: Write Scheduled Report Tests
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Tests for scheduled report delivery.

**Files to create/modify**:
- `tests/integration/scheduled-reports.test.ts`

**Acceptance Criteria**:
- [X] Test daily schedule triggers correctly
- [X] Test weekly schedule on correct day
- [X] Test monthly schedule on correct day
- [X] Test email delivery called
- [X] Test delivery failure handling
- [X] Test multiple recipients

**Constitution Checklist**:
- [X] Schedule reliability tested (Alert Reliability)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Data Layer | 4 | P0-P2 | 8-11 |
| 2. Audit Export | 3 | P0 | 10-13 |
| 3. Report Builder | 3 | P1 | 9-12 |
| 4. Scheduled Reports | 3 | P1 | 7-10 |
| 5. UI Components | 5 | P0-P2 | 9-12 |
| 6. Pages | 5 | P0-P1 | 12-17 |
| 7. Testing | 4 | P0-P1 | 10-14 |
| **Total** | **27** | | **65-89** |

## Dependencies Graph

```
1.1 Schema ─► 3.3 Save/Load ─► 4.1 Schedule
                    │
                    └─► 3.2 ReportBuilder ─► 6.5 Custom Page

1.2 Compliance Query ─► 5.1 ScoreChart ─► 6.1 Reports Dashboard
         │                   │
         │                   └─► 6.2 Compliance Page
         │
         └─► 5.2 CategoryChart

1.3 Team Query ─► 5.3 TeamTable ─► 6.3 Team Page

1.4 Cost Query ─► 5.4 CostCard

2.1 PDF Template ─► 2.2 Audit Action ─► 2.3 AuditWizard ─► 6.4 Audit Page

4.1 Schedule ─► 4.2 Cron ─► 4.3 ReportScheduler
```

**Note**: Report generation must be async for large datasets (Constitution: Performance). All reports are org-scoped and permission-checked (Constitution: Security).
