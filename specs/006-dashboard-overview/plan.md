# Implementation Plan: Dashboard & Overview

**Branch**: `006-dashboard-overview` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-dashboard-overview/spec.md`

## Summary

Build a real-time compliance dashboard with compliance score calculation, critical alerts highlighting, category breakdowns, activity feeds, and quick action buttons for immediate visibility into compliance health.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Recharts, Convex (reactive queries), Lucide React
**Storage**: Convex (computed on read from deadlines/documents/alerts)
**Testing**: Vitest (unit), score calculation tests
**Target Platform**: Web (responsive)
**Project Type**: Web application
**Performance Goals**: Dashboard load < 1s, real-time updates < 100ms
**Constraints**: Mobile-responsive, accessibility compliant
**Scale/Scope**: Real-time updates for all org sizes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Dashboard reads from authoritative data sources, no cached stale data
- [x] **Alert Reliability**: Critical section prominently displays overdue and due-today items
- [x] **Clarity**: Color-coded score (green/yellow/red), urgency zones clearly labeled

Additional checks:
- [x] **Security**: Org-scoped queries only, no cross-org data leakage
- [x] **Code Quality**: TypeScript strict, computed values validated
- [x] **Testing**: 100% coverage for score calculation algorithm
- [x] **Performance**: Convex reactive queries, no polling needed
- [x] **External Services**: N/A

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── page.tsx                  # Main dashboard
├── components/
│   └── features/
│       └── dashboard/
│           ├── ComplianceScoreCard.tsx
│           ├── CriticalAlertsSection.tsx
│           ├── DueThisWeekSection.tsx
│           ├── QuickStatsBar.tsx
│           ├── UpcomingSection.tsx
│           ├── RecentActivityFeed.tsx
│           ├── CategoryBreakdownChart.tsx
│           ├── QuickActionsBar.tsx
│           ├── CircularProgress.tsx
│           └── DashboardSkeleton.tsx
├── convex/
│   ├── dashboard.ts                  # Dashboard data queries
│   └── schema.ts
└── lib/
    └── utils/
        └── score.ts                  # Score calculation logic
```

## Dashboard Data Query

```typescript
// convex/dashboard.ts
export const getDashboardData = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const allDeadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), null))
      .collect();

    // Categorize deadlines
    const overdue = allDeadlines.filter(
      d => !d.completedAt && d.dueDate < now
    );
    const dueToday = allDeadlines.filter(
      d => !d.completedAt &&
           d.dueDate >= now &&
           d.dueDate < now + 24*60*60*1000
    );
    const dueThisWeek = allDeadlines.filter(
      d => !d.completedAt &&
           d.dueDate >= now &&
           d.dueDate < now + sevenDays
    );
    const upcoming = allDeadlines.filter(
      d => !d.completedAt &&
           d.dueDate >= now + sevenDays &&
           d.dueDate < now + thirtyDays
    );
    const completedThisMonth = allDeadlines.filter(
      d => d.completedAt && d.completedAt >= now - thirtyDays
    );

    // Calculate compliance score
    const score = calculateComplianceScore(allDeadlines, now);

    // Recent activity
    const recentActivity = await getRecentActivity(ctx, orgId, 10);

    // Category breakdown
    const byCategory = groupByCategory(allDeadlines.filter(d => !d.completedAt));

    return {
      score,
      overdue: overdue.sort((a, b) => a.dueDate - b.dueDate),
      dueToday,
      dueThisWeek: dueThisWeek.sort((a, b) => a.dueDate - b.dueDate),
      upcoming: upcoming.sort((a, b) => a.dueDate - b.dueDate),
      stats: {
        totalActive: allDeadlines.filter(d => !d.completedAt).length,
        completedThisMonth: completedThisMonth.length,
        documentsStored: await getDocumentCount(ctx, orgId),
      },
      byCategory,
      recentActivity,
    };
  },
});
```

## Compliance Score Calculation

```typescript
// lib/utils/score.ts
function calculateComplianceScore(deadlines: Deadline[], now: number): number {
  if (deadlines.length === 0) return 100;

  let score = 100;
  const activeDeadlines = deadlines.filter(d => !d.completedAt);

  for (const d of activeDeadlines) {
    const daysUntilDue = (d.dueDate - now) / (1000 * 60 * 60 * 24);

    if (daysUntilDue < 0) {
      // Overdue: heavy penalty
      score -= Math.min(20, Math.abs(daysUntilDue) * 2);
    } else if (daysUntilDue <= 7) {
      // Due soon: moderate penalty
      score -= 5;
    } else if (daysUntilDue <= 30) {
      // Upcoming: light penalty
      score -= 1;
    }
  }

  // Bonus for on-time completions
  const recentCompletions = deadlines.filter(
    d => d.completedAt && d.completedAt <= d.dueDate
  );
  score += Math.min(10, recentCompletions.length);

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

## Dashboard Layout

```typescript
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  const { orgId } = useOrg();
  const dashboard = useQuery(api.dashboard.getDashboardData, { orgId });

  if (!dashboard) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Compliance Score - Hero */}
      <ComplianceScoreCard score={dashboard.score} />

      {/* Critical Alerts - Red Zone */}
      {(dashboard.overdue.length > 0 || dashboard.dueToday.length > 0) && (
        <CriticalAlertsSection
          overdue={dashboard.overdue}
          dueToday={dashboard.dueToday}
        />
      )}

      {/* Due This Week - Yellow Zone */}
      {dashboard.dueThisWeek.length > 0 && (
        <DueThisWeekSection deadlines={dashboard.dueThisWeek} />
      )}

      {/* Stats Bar */}
      <QuickStatsBar stats={dashboard.stats} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingSection deadlines={dashboard.upcoming} />
        <RecentActivityFeed activities={dashboard.recentActivity} />
      </div>

      {/* Category Breakdown */}
      <CategoryBreakdownChart data={dashboard.byCategory} />

      {/* Quick Actions */}
      <QuickActionsBar />
    </div>
  );
}
```

## Component Designs

```typescript
// components/features/dashboard/ComplianceScoreCard.tsx
function ComplianceScoreCard({ score }: { score: number }) {
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Needs Attention' : 'At Risk';

  return (
    <Card className={`bg-${color}-50 border-${color}-200`}>
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-gray-600">Compliance Score</p>
          <p className={`text-5xl font-bold text-${color}-600`}>{score}%</p>
          <p className={`text-sm text-${color}-600`}>{label}</p>
        </div>
        <div className="w-32 h-32">
          <CircularProgress value={score} color={color} />
        </div>
      </div>
    </Card>
  );
}

// components/features/dashboard/CriticalAlertsSection.tsx
function CriticalAlertsSection({ overdue, dueToday }) {
  return (
    <Card className="bg-red-50 border-red-300 border-2">
      <CardHeader className="bg-red-100">
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Requires Immediate Attention
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {overdue.map(d => (
          <DeadlineAlertItem
            key={d._id}
            deadline={d}
            urgency="overdue"
            daysText={`${Math.abs(daysDiff(d.dueDate))} days overdue`}
          />
        ))}
        {dueToday.map(d => (
          <DeadlineAlertItem
            key={d._id}
            deadline={d}
            urgency="today"
            daysText="Due today"
          />
        ))}
      </CardContent>
    </Card>
  );
}

// components/features/dashboard/QuickStatsBar.tsx
function QuickStatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={<Clock />} label="Active Deadlines" value={stats.totalActive} />
      <StatCard icon={<CheckCircle />} label="Completed This Month" value={stats.completedThisMonth} />
      <StatCard icon={<FileText />} label="Documents Stored" value={stats.documentsStored} />
      <StatCard icon={<TrendingUp />} label="On-Time Rate" value={`${stats.onTimeRate}%`} />
    </div>
  );
}
```

## Real-Time Updates

```typescript
// Dashboard auto-refreshes via Convex reactive queries
// No polling needed - updates push automatically

export const subscribeToActivity = query({
  args: { orgId: v.id("organizations"), limit: v.number() },
  handler: async (ctx, { orgId, limit }) => {
    return await ctx.db
      .query("activity_log")
      .withIndex("by_org_time", (q) => q.eq("orgId", orgId))
      .order("desc")
      .take(limit);
  },
});
```

## View Modes

```typescript
type DashboardView = 'my_items' | 'team' | 'category';

function DashboardPage() {
  const [view, setView] = useState<DashboardView>('team');
  const user = useUser();

  const filters = useMemo(() => {
    switch (view) {
      case 'my_items':
        return { assignedTo: user.id };
      case 'category':
        return { groupBy: 'category' };
      default:
        return {};
    }
  }, [view, user.id]);

  // ... rest of dashboard with filters applied
}
```

## Mobile Responsiveness

```typescript
// Responsive grid adjustments
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stats collapse to 2 cols on tablet, 1 on mobile */}
</div>

// Critical section always full width
<Card className="col-span-full">
  {/* Overdue items */}
</Card>

// Hide non-essential on mobile
<div className="hidden md:block">
  <CategoryBreakdownChart />
</div>
```

## Complexity Tracking

No constitution violations - implements real-time updates and clear visibility into compliance status.
