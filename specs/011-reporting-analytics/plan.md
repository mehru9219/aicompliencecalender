# Implementation Plan: Reporting & Analytics

**Branch**: `011-reporting-analytics` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-reporting-analytics/spec.md`

## Summary

Build a comprehensive reporting system with compliance summaries, team performance analytics, audit-ready PDF exports, custom report builder, scheduled report delivery, and cost avoidance estimates to demonstrate compliance value.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Recharts, @react-pdf/renderer, xlsx, json2csv
**Storage**: Convex (computed from deadlines/documents/alerts)
**Testing**: Vitest (unit), PDF rendering tests
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Report generation < 5s, chart render < 500ms
**Constraints**: PDF generation async for large reports
**Scale/Scope**: Historical data up to 3 years

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Reports generated from authoritative data, timestamped
- [x] **Alert Reliability**: Alert delivery logs included in audit reports
- [x] **Clarity**: Clear metrics, visual charts, exportable formats

Additional checks:
- [x] **Security**: Org-scoped data only, permission checks on sensitive reports
- [x] **Code Quality**: TypeScript strict, report types validated
- [x] **Testing**: PDF output validation, calculation accuracy tests
- [x] **Performance**: Async PDF generation, paginated data queries
- [x] **External Services**: Resend for scheduled report delivery

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── reports/
│           ├── page.tsx              # Report dashboard
│           ├── compliance/
│           │   └── page.tsx          # Compliance summary
│           ├── team/
│           │   └── page.tsx          # Team performance
│           ├── audit/
│           │   └── page.tsx          # Audit export wizard
│           └── custom/
│               └── page.tsx          # Report builder
├── components/
│   └── features/
│       └── reports/
│           ├── ComplianceScoreChart.tsx
│           ├── CategoryBreakdownChart.tsx
│           ├── TeamPerformanceTable.tsx
│           ├── AuditExportWizard.tsx
│           ├── ReportBuilder.tsx
│           ├── CostAvoidanceCard.tsx
│           ├── ReportScheduler.tsx
│           └── ExportButtons.tsx
├── convex/
│   ├── reports.ts                    # Report queries/actions
│   └── schema.ts
└── lib/
    └── pdf/
        └── audit-report.tsx          # PDF template
```

## Database Schema

```typescript
// convex/schema.ts (additions)
saved_reports: defineTable({
  orgId: v.id("organizations"),
  name: v.string(),
  config: v.object({
    dateRangeType: v.string(),
    customDateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
    categories: v.array(v.string()),
    metrics: v.array(v.string()),
    chartTypes: v.array(v.string()),
    groupBy: v.optional(v.string()),
  }),
  schedule: v.optional(v.object({
    frequency: v.string(),
    recipients: v.array(v.string()),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
  })),
  createdAt: v.number(),
  createdBy: v.string(),
})
  .index("by_org", ["orgId"]),
```

## Compliance Summary Query

```typescript
// convex/reports.ts
export const getComplianceSummary = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.object({
      from: v.number(),
      to: v.number(),
    }),
  },
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .collect();

    const inRange = deadlines.filter(
      d => d.dueDate >= dateRange.from && d.dueDate <= dateRange.to
    );

    const completed = inRange.filter(d => d.completedAt);
    const onTime = completed.filter(d => d.completedAt <= d.dueDate);
    const late = completed.filter(d => d.completedAt > d.dueDate);
    const overdue = inRange.filter(d => !d.completedAt && d.dueDate < Date.now());
    const pending = inRange.filter(d => !d.completedAt && d.dueDate >= Date.now());

    const scoreHistory = await getMonthlyScores(ctx, orgId, 12);
    const byCategory = groupBy(inRange.filter(d => !d.completedAt), 'category');

    return {
      summary: {
        total: inRange.length,
        completed: completed.length,
        onTime: onTime.length,
        late: late.length,
        overdue: overdue.length,
        pending: pending.length,
        completionRate: completed.length / inRange.length * 100,
        onTimeRate: onTime.length / completed.length * 100,
      },
      scoreHistory,
      byCategory: Object.entries(byCategory).map(([category, items]) => ({
        category,
        count: items.length,
        overdue: items.filter(i => i.dueDate < Date.now()).length,
      })),
      upcoming: pending.slice(0, 10).sort((a, b) => a.dueDate - b.dueDate),
      overdueItems: overdue.sort((a, b) => a.dueDate - b.dueDate),
    };
  },
});

export const getTeamPerformance = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await withPermission('audit:read')(ctx, { orgId });

    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => q.neq(q.field("completedAt"), null))
      .collect();

    const byUser = groupBy(deadlines, 'completedBy');
    const members = await getOrgMembers(ctx, orgId);

    return members.map(member => {
      const userDeadlines = byUser[member.id] || [];
      const onTime = userDeadlines.filter(d => d.completedAt <= d.dueDate);

      const avgDaysBefore = userDeadlines.reduce((sum, d) => {
        return sum + (d.dueDate - d.completedAt) / (24*60*60*1000);
      }, 0) / userDeadlines.length;

      return {
        user: member,
        completed: userDeadlines.length,
        onTimeRate: userDeadlines.length ? onTime.length / userDeadlines.length * 100 : 0,
        avgDaysBefore: Math.round(avgDaysBefore),
        activeAssignments: deadlines.filter(
          d => d.assignedTo === member.id && !d.completedAt
        ).length,
      };
    });
  },
});
```

## Audit Export

```typescript
// convex/reports.ts
export const generateAuditReport = action({
  args: {
    orgId: v.id("organizations"),
    complianceArea: v.string(),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  handler: async (ctx, args) => {
    const deadlines = await ctx.runQuery(internal.deadlines.byCategory, {
      orgId: args.orgId,
      category: args.complianceArea,
      dateRange: args.dateRange,
    });

    const documents = await ctx.runQuery(internal.documents.byCategory, {
      orgId: args.orgId,
      category: args.complianceArea,
    });

    const alertLog = await ctx.runQuery(internal.alerts.getLog, {
      orgId: args.orgId,
      deadlineIds: deadlines.map(d => d._id),
    });

    const activityLog = await ctx.runQuery(internal.audit.getByResource, {
      orgId: args.orgId,
      resourceType: 'deadline',
      resourceIds: deadlines.map(d => d._id),
    });

    const pdf = await generateAuditPdf({
      org: await ctx.runQuery(api.organizations.get, { id: args.orgId }),
      complianceArea: args.complianceArea,
      dateRange: args.dateRange,
      deadlines,
      documents,
      alertLog,
      activityLog,
    });

    const storageId = await ctx.storage.store(pdf);
    return await ctx.storage.getUrl(storageId);
  },
});
```

## PDF Generation

```typescript
// lib/pdf/audit-report.tsx
async function generateAuditPdf(data) {
  const AuditReport = () => (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Compliance Audit Report</Text>
          <Text style={styles.subtitle}>{data.complianceArea.toUpperCase()}</Text>
          <Text style={styles.date}>
            {format(data.dateRange.from, 'MMM d, yyyy')} -
            {format(data.dateRange.to, 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.orgInfo}>
          <Text>{data.org.name}</Text>
          <Text>Generated: {format(new Date(), 'PPP')}</Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Table of Contents</Text>
        <Text>1. Executive Summary</Text>
        <Text>2. Deadline Compliance History</Text>
        <Text>3. Documentation Inventory</Text>
        <Text>4. Alert Delivery Log</Text>
        <Text>5. Activity Timeline</Text>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>1. Executive Summary</Text>
        <View style={styles.stats}>
          <Text>Total Requirements: {data.deadlines.length}</Text>
          <Text>Completed On-Time: {data.stats.onTime}</Text>
          <Text>Documents on File: {data.documents.length}</Text>
        </View>
      </Page>

      {/* Deadline History */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>2. Deadline Compliance History</Text>
        <View style={styles.table}>
          {data.deadlines.map(d => (
            <View key={d._id} style={styles.tableRow}>
              <Text style={styles.cell}>{d.title}</Text>
              <Text style={styles.cell}>{format(d.dueDate, 'MMM d, yyyy')}</Text>
              <Text style={styles.cell}>
                {d.completedAt ? format(d.completedAt, 'MMM d, yyyy') : 'Pending'}
              </Text>
              <Text style={styles.cell}>
                {d.completedAt && d.completedAt <= d.dueDate ? 'On Time' :
                 d.completedAt ? 'Late' : '-'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(<AuditReport />);
}
```

## Custom Report Builder

```typescript
// convex/reports.ts
export const runCustomReport = query({
  args: {
    orgId: v.id("organizations"),
    config: v.object({
      dateRangeType: v.string(),
      customDateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
      categories: v.array(v.string()),
      metrics: v.array(v.string()),
      groupBy: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { orgId, config }) => {
    const dateRange = resolveDateRange(config.dateRangeType, config.customDateRange);

    let deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q =>
        q.and(
          q.gte(q.field("dueDate"), dateRange.from),
          q.lte(q.field("dueDate"), dateRange.to)
        )
      )
      .collect();

    if (config.categories.length > 0) {
      deadlines = deadlines.filter(d => config.categories.includes(d.category));
    }

    const result: any = {};

    for (const metric of config.metrics) {
      switch (metric) {
        case 'completion_rate':
          result.completionRate = calculateCompletionRate(deadlines);
          break;
        case 'on_time_rate':
          result.onTimeRate = calculateOnTimeRate(deadlines);
          break;
        case 'by_category':
          result.byCategory = groupAndCount(deadlines, 'category');
          break;
        case 'by_status':
          result.byStatus = groupAndCount(deadlines, 'status');
          break;
        case 'trend':
          result.trend = calculateTrend(deadlines, config.groupBy || 'month');
          break;
      }
    }

    return result;
  },
});
```

## Cost Avoidance Estimate

```typescript
// convex/reports.ts
export const getCostAvoidance = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => q.neq(q.field("completedAt"), null))
      .collect();

    const onTimeCompletions = deadlines.filter(
      d => d.completedAt <= d.dueDate &&
           d.completedAt >= dateRange.from &&
           d.completedAt <= dateRange.to
    );

    const penalties = {
      license: 5000,
      certification: 3000,
      training: 1000,
      audit: 10000,
      filing: 2000,
    };

    let totalAvoided = 0;
    const breakdown = [];

    for (const d of onTimeCompletions) {
      const penalty = penalties[d.category] || 1000;
      totalAvoided += penalty;
      breakdown.push({
        deadline: d.title,
        category: d.category,
        estimatedPenalty: penalty,
      });
    }

    return {
      totalAvoided,
      deadlinesCompletedOnTime: onTimeCompletions.length,
      breakdown,
      disclaimer: 'Estimates based on average industry penalties. Actual penalties vary.',
    };
  },
});
```

## Complexity Tracking

No constitution violations - implements comprehensive audit trails and clear data provenance.
