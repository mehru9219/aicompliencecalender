# Implementation Plan: Core Deadline Management

**Branch**: `001-deadline-management` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-deadline-management/spec.md`

## Summary

Build the foundational deadline management system that allows regulated businesses to create, track, and manage compliance deadlines with automatic status calculation, recurring deadline support, and full audit trail for completion history.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Next.js 14 (App Router), React 18, Convex, Clerk, Tailwind CSS, React Hook Form, Zod
**Storage**: Convex (serverless database)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (responsive)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: CRUD operations < 500ms, list queries < 1s
**Constraints**: Multi-tenant isolation, soft-delete with 30-day retention
**Scale/Scope**: 1,000 organizations, 100,000 deadlines per org

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Atomic Convex transactions, soft-delete implemented, audit trail on completion
- [x] **Alert Reliability**: Alert scheduling triggered on deadline create/update (deferred to Alert feature)
- [x] **Clarity**: Status calculation (overdue/due_soon/upcoming/completed) provides instant visibility

Additional checks:
- [x] **Security**: orgId-scoped queries, Clerk authentication, data isolation via indexes
- [x] **Code Quality**: TypeScript strict mode, Zod validation for all inputs
- [x] **Testing**: 100% coverage for status calculation and recurrence logic
- [x] **Performance**: Indexed queries by org, status, due date
- [x] **External Services**: N/A for this feature

## Project Structure

### Documentation (this feature)

```text
specs/001-deadline-management/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── deadlines/
│           ├── page.tsx              # List view with filters
│           ├── [id]/page.tsx         # Detail/edit view
│           └── new/page.tsx          # Create form
├── components/
│   ├── ui/                           # Shared UI components
│   └── features/
│       └── deadlines/
│           ├── DeadlineCard.tsx
│           ├── DeadlineForm.tsx
│           ├── DeadlineFilters.tsx
│           ├── DeadlineStatusBadge.tsx
│           └── RecurrenceSelector.tsx
├── convex/
│   ├── schema.ts                     # Database schema
│   ├── deadlines.ts                  # Queries and mutations
│   └── _generated/                   # Convex generated types
├── lib/
│   ├── utils/
│   │   ├── date.ts                   # Date utilities
│   │   └── status.ts                 # Status calculation
│   └── validations/
│       └── deadline.ts               # Zod schemas
└── types/
    └── deadline.ts                   # TypeScript types

tests/
├── unit/
│   ├── status.test.ts
│   └── recurrence.test.ts
└── integration/
    └── deadlines.test.ts
```

**Structure Decision**: Next.js App Router with Convex backend. Feature components in `/components/features/deadlines/`, Convex functions in `/convex/deadlines.ts`.

## Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    industry: v.string(),
    ownerId: v.string(),
    settings: v.object({}),
    createdAt: v.number(),
  }),

  deadlines: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    category: v.string(),
    recurrence: v.optional(v.object({
      type: v.string(),
      interval: v.optional(v.number()),
      endDate: v.optional(v.number()),
    })),
    assignedTo: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "dueDate"])
    .index("by_org_category", ["orgId", "category"])
    .index("by_assigned", ["orgId", "assignedTo"]),
});
```

## Key Functions

### Status Calculation (runs on read)

```typescript
function calculateStatus(deadline: Deadline): Status {
  if (deadline.completedAt) return 'completed';
  const now = Date.now();
  const daysUntilDue = (deadline.dueDate - now) / (1000 * 60 * 60 * 24);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 14) return 'due_soon';
  return 'upcoming';
}
```

### Recurrence Generation

```typescript
function generateNextDeadline(completed: Deadline): Partial<Deadline> | null {
  if (!completed.recurrence) return null;

  const nextDue = calculateNextDueDate(completed.dueDate, completed.recurrence);
  if (completed.recurrence.endDate && nextDue > completed.recurrence.endDate) {
    return null;
  }

  return {
    ...completed,
    _id: undefined,
    dueDate: nextDue,
    completedAt: undefined,
    completedBy: undefined,
  };
}
```

## Validation Schema

```typescript
// lib/validations/deadline.ts
import { z } from "zod";

export const deadlineSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.date(),
  category: z.enum(['license', 'certification', 'training', 'audit', 'filing', 'other']),
  recurrence: z.object({
    type: z.enum(['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']),
    interval: z.number().optional(),
    endDate: z.date().optional(),
  }).optional(),
  assignedTo: z.string().optional(),
});
```

## Convex Functions

### Queries
- `deadlines.list(orgId, filters?)` - Paginated deadline list
- `deadlines.get(deadlineId)` - Single deadline with full details
- `deadlines.upcoming(orgId, days)` - Deadlines due within N days
- `deadlines.overdue(orgId)` - All overdue deadlines
- `deadlines.byCategory(orgId, category)` - Filtered by category
- `deadlines.trash(orgId)` - Soft-deleted items

### Mutations
- `deadlines.create(data)` - Creates deadline + schedules alerts
- `deadlines.update(id, data)` - Updates deadline + reschedules alerts
- `deadlines.complete(id)` - Marks complete, creates next if recurring
- `deadlines.softDelete(id)` - Moves to trash
- `deadlines.restore(id)` - Restores from trash
- `deadlines.hardDelete(id)` - Permanent delete (30+ days in trash)

## Complexity Tracking

No constitution violations - design follows all principles.
