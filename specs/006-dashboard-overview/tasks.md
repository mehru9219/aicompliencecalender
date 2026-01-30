# Tasks: Dashboard & Overview

**Feature**: 006-dashboard-overview | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build the real-time compliance dashboard with compliance score, critical alerts, category breakdowns, and activity feeds. The dashboard is the user's primary view into compliance health (**Constitution Law #3: Never compromise on clarity**).

---

## Phase 1: Dashboard Data Layer

### Task 1.1: Implement Compliance Score Calculation
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 001-deadline-management

**Description**: Create the algorithm for calculating compliance score.

**Files to create/modify**:
- `lib/utils/score.ts`
- `tests/unit/score.test.ts`

**Acceptance Criteria**:
- [X] `calculateComplianceScore(deadlines, now)` function
- [X] Scoring logic:
  - Start at 100
  - Overdue: -2 per day overdue (max -20 per deadline)
  - Due in 7 days: -5 per deadline
  - Due in 30 days: -1 per deadline
  - Bonus: +1 per recent on-time completion (max +10)
- [X] Returns 0-100 (clamped)
- [X] Accepts injectable `now` for testing
- [X] 100% test coverage with edge cases

**Constitution Checklist**:
- [X] 100% coverage for score calculation (Testing Standards)
- [X] Tests don't depend on real time (Testing Principles)

---

### Task 1.2: Implement Dashboard Data Query
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 1.1

**Description**: Create comprehensive Convex query for dashboard data.

**Files to create/modify**:
- `convex/dashboard.ts`

**Acceptance Criteria**:
- [X] `getDashboardData(orgId)` query returns:
  - score: number
  - overdue: Deadline[] (sorted by dueDate)
  - dueToday: Deadline[]
  - dueThisWeek: Deadline[] (sorted)
  - upcoming: Deadline[] (7-30 days out)
  - stats: { totalActive, completedThisMonth, documentsStored, onTimeRate }
  - byCategory: { category, count, overdue }[]
  - recentActivity: Activity[] (last 10)
- [X] All deadlines filtered by orgId
- [X] Excludes soft-deleted
- [X] Single query, no N+1

**Constitution Checklist**:
- [X] No N+1 queries (Performance)
- [X] Org isolation (Security)

---

### Task 1.3: Implement Activity Log Query
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Create query for recent activity feed.

**Files to create/modify**:
- `convex/dashboard.ts`
- `convex/schema.ts` (activity_log table)

**Acceptance Criteria**:
- [X] `getRecentActivity(orgId, limit)` query
- [X] Returns from activity_log table (created)
- [X] Sorted by timestamp descending
- [X] Includes: action type, actor, target, timestamp
- [X] Real-time updates via Convex subscription

**Constitution Checklist**:
- [X] Audit trail accessible (Compliance)

---

## Phase 2: Score Display Components

### Task 2.1: Create ComplianceScoreCard Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.1

**Description**: Create the hero score display component.

**Files to create/modify**:
- `components/features/dashboard/ComplianceScoreCard.tsx`

**Acceptance Criteria**:
- [X] Large score display (e.g., "87%")
- [X] Color-coded:
  - >= 80: green, "Healthy"
  - >= 60: yellow, "Needs Attention"
  - < 60: red, "At Risk"
- [X] Circular progress visualization
- [X] Icon alongside color (not color-only)
- [X] Responsive sizing

**Constitution Checklist**:
- [X] Color + icon, never color alone (Accessibility)
- [X] Red/yellow/green recognizable (UX)
- [X] Minimum contrast 4.5:1 (Accessibility)

---

### Task 2.2: Create CircularProgress Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Create circular progress visualization for score.

**Files to create/modify**:
- `components/ui/circular-progress.tsx`

**Acceptance Criteria**:
- [X] SVG-based circular progress
- [X] Accepts value (0-100) and color
- [X] Smooth animation on value change
- [X] Accessible (aria-valuenow, aria-valuemin, aria-valuemax)

**Constitution Checklist**:
- [X] Accessible (Accessibility)

---

## Phase 3: Critical Alerts Section

### Task 3.1: Create CriticalAlertsSection Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Create the high-priority alerts section (overdue + due today).

**Files to create/modify**:
- `components/features/dashboard/CriticalAlertsSection.tsx`

**Acceptance Criteria**:
- [X] Red background/border for visibility
- [X] Header: "Requires Immediate Attention" with warning icon
- [X] Lists overdue items with "X days overdue" text
- [X] Lists due today items with "Due today" text
- [X] Each item: title, category, quick complete button
- [X] Click navigates to deadline detail
- [X] Collapses if empty (not shown)

**Constitution Checklist**:
- [X] Danger shown first (UX Information Hierarchy)
- [X] Critical actions accessible (Mobile)

---

### Task 3.2: Create DeadlineAlertItem Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create list item component for alert sections.

**Files to create/modify**:
- `components/features/dashboard/DeadlineAlertItem.tsx`

**Acceptance Criteria**:
- [X] Shows: title, category badge, urgency text
- [X] Quick action: "Mark Complete" button
- [X] Color indicator by urgency
- [X] Touch target 44x44px minimum

**Constitution Checklist**:
- [X] Touch targets (Mobile)

---

### Task 3.3: Create DueThisWeekSection Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.2

**Description**: Create the yellow/warning zone for items due this week.

**Files to create/modify**:
- `components/features/dashboard/DueThisWeekSection.tsx`

**Acceptance Criteria**:
- [X] Yellow/amber styling
- [X] Header: "Due This Week"
- [X] Lists items with days remaining
- [X] Sorted by due date
- [X] Collapses if empty

**Constitution Checklist**:
- [X] Yellow for warning (UX)

---

## Phase 4: Stats and Activity

### Task 4.1: Create QuickStatsBar Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create the statistics bar showing key metrics.

**Files to create/modify**:
- `components/features/dashboard/QuickStatsBar.tsx`
- `components/features/dashboard/StatCard.tsx`

**Acceptance Criteria**:
- [X] 4-column grid (2 on tablet, 1 on mobile)
- [X] StatCard for each metric:
  - Active Deadlines (Clock icon)
  - Completed This Month (CheckCircle icon)
  - Documents Stored (FileText icon)
  - On-Time Rate (TrendingUp icon)
- [X] Clean, minimal design
- [X] Click navigates to relevant section

**Constitution Checklist**:
- [X] Responsive grid (Mobile)

---

### Task 4.2: Create RecentActivityFeed Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create the activity feed showing recent actions.

**Files to create/modify**:
- `components/features/dashboard/RecentActivityFeed.tsx`

**Acceptance Criteria**:
- [X] Lists last 10 activities
- [X] Shows: action icon, description, actor, timestamp
- [X] Action types: deadline_created, deadline_completed, document_uploaded, alert_sent
- [X] Relative timestamps ("2 hours ago")
- [X] Real-time updates (Convex subscription)

**Constitution Checklist**:
- [X] Real-time updates (Performance)

---

### Task 4.3: Create UpcomingSection Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.2

**Description**: Create section showing upcoming deadlines (7-30 days).

**Files to create/modify**:
- `components/features/dashboard/UpcomingSection.tsx`

**Acceptance Criteria**:
- [X] Blue/neutral styling
- [X] Header: "Upcoming (Next 30 Days)"
- [X] Lists items with due date
- [X] Limited to 5-10 items with "View All" link
- [X] Sorted by due date

---

## Phase 5: Charts and Breakdown

### Task 5.1: Create CategoryBreakdownChart Component
**Priority**: P2 (Medium) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Create chart showing deadlines by category.

**Files to create/modify**:
- `components/features/dashboard/CategoryBreakdownChart.tsx`

**Acceptance Criteria**:
- [X] Bar or pie chart using Recharts
- [X] Shows count per category
- [X] Highlights categories with overdue items
- [X] Legend with category names
- [X] Responsive sizing
- [X] Hidden on mobile (optional)

**Constitution Checklist**:
- [X] Hide non-essential on mobile (Mobile)

---

### Task 5.2: Create QuickActionsBar Component
**Priority**: P2 (Medium) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create quick action buttons for common tasks.

**Files to create/modify**:
- `components/features/dashboard/QuickActionsBar.tsx`

**Acceptance Criteria**:
- [X] Buttons: New Deadline, Upload Document, View Calendar
- [X] Icons with labels
- [X] Navigate to respective pages
- [X] Keyboard accessible

**Constitution Checklist**:
- [X] Keyboard accessible (Accessibility)

---

## Phase 6: Dashboard Page

### Task 6.1: Create Dashboard Layout
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: All Phase 2-5 components

**Description**: Create the main dashboard page assembling all components.

**Files to create/modify**:
- `app/(dashboard)/page.tsx`

**Acceptance Criteria**:
- [X] Uses Convex useQuery for getDashboardData
- [X] Layout:
  1. ComplianceScoreCard (hero)
  2. CriticalAlertsSection (if items)
  3. DueThisWeekSection (if items)
  4. QuickStatsBar
  5. Two-column: UpcomingSection | RecentActivityFeed
  6. CategoryBreakdownChart
  7. QuickActionsBar
- [X] Loading skeleton while fetching
- [X] Error state with retry
- [X] Responsive layout

**Constitution Checklist**:
- [X] Loading state (UX)
- [X] Error state with action (UX)
- [X] Dashboard load < 1s (Performance)

---

### Task 6.2: Create DashboardSkeleton Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create loading skeleton matching dashboard layout.

**Files to create/modify**:
- `components/features/dashboard/DashboardSkeleton.tsx`

**Acceptance Criteria**:
- [X] Skeleton for score card
- [X] Skeleton for stats bar
- [X] Skeleton for lists
- [X] Animated shimmer effect
- [X] Matches actual layout dimensions

**Constitution Checklist**:
- [X] Loading state matches content layout (UX)

---

### Task 6.3: Implement View Mode Switching
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 6.1

**Description**: Add ability to switch dashboard views (Team vs My Items).

**Files to create/modify**:
- `app/(dashboard)/page.tsx`

**Acceptance Criteria**:
- [X] Toggle: "Team" | "My Items" | "By Category"
- [X] "My Items" filters to current user's assigned deadlines
- [X] "By Category" groups deadlines differently
- [X] Persists preference in localStorage
- [X] URL query param for shareable links

---

## Phase 7: Testing & Performance

### Task 7.1: Write Unit Tests for Score Calculation
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Comprehensive tests for score algorithm.

**Files to create/modify**:
- `tests/unit/score.test.ts`

**Acceptance Criteria**:
- [X] Test empty deadlines (100)
- [X] Test all overdue (low score)
- [X] Test all upcoming (high score)
- [X] Test mixed scenarios
- [X] Test bonus for on-time completions
- [X] Test score clamping (0-100)
- [X] 100% coverage

**Constitution Checklist**:
- [X] 100% coverage for score (Testing Standards)

---

### Task 7.2: Write Integration Tests for Dashboard Query
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Integration tests for dashboard data query.

**Files to create/modify**:
- `tests/integration/dashboard.test.ts`

**Acceptance Criteria**:
- [ ] Test with various deadline states
- [ ] Test categorization (overdue, due_soon, upcoming)
- [ ] Test stats calculation
- [ ] Test org isolation
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] Org isolation tested (Security)

---

### Task 7.3: Performance Optimization
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 6.1

**Description**: Optimize dashboard for performance targets.

**Files to create/modify**:
- `convex/dashboard.ts`
- `app/(dashboard)/page.tsx`

**Acceptance Criteria**:
- [X] Dashboard loads in < 1s with 100 deadlines
- [X] Query batches all needed data
- [ ] Components lazy-load below fold
- [ ] Charts render progressively
- [ ] Measure and log Core Web Vitals

**Constitution Checklist**:
- [X] Dashboard load < 1s (Performance)
- [X] No N+1 queries (Performance)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Data Layer | 3 | P0-P1 | 9-11 |
| 2. Score Display | 2 | P0-P1 | 5-6 |
| 3. Critical Alerts | 3 | P0-P1 | 6-9 |
| 4. Stats & Activity | 3 | P1 | 6-8 |
| 5. Charts | 2 | P2 | 4-6 |
| 6. Dashboard Page | 3 | P0-P2 | 6-8 |
| 7. Testing & Perf | 3 | P0-P1 | 6-9 |
| **Total** | **19** | | **42-57** |

## Dependencies Graph

```
1.1 Score Calc ─► 1.2 Dashboard Query ─► 6.1 Dashboard Page
                        │
                        └─► 2.1 ScoreCard
                            3.1 CriticalAlerts
                            3.3 DueThisWeek
                            4.1 StatsBar
                            4.2 ActivityFeed
                            4.3 Upcoming
                            5.1 CategoryChart

1.3 Activity Query ─► 4.2 ActivityFeed

All Components ─► 6.1 Dashboard Page ─► 7.3 Performance
```

**Note**: Dashboard is the first thing users see. It must load in < 1s and clearly show compliance status at a glance (**Constitution Law #3**).
