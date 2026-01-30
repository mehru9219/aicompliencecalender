# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Be extremely concise in all interactions and commit messages, sacrifice grammar for concision.

## Commands

```bash
npm run dev          # Start frontend (Next.js) + backend (Convex) in parallel
npm run dev:frontend # Next.js only
npm run dev:backend  # Convex only
npm run build        # Production build
npm run lint         # ESLint
```

## Tech Stack

- Next.js 16 + React 19 + TypeScript 5.9
- Convex (backend/database)
- Clerk (auth)
- Tailwind CSS 4

## Project Structure

```
/app                 # Next.js App Router routes
/components          # React components
/convex              # Convex backend
  schema.ts          # Database schema
  auth.config.ts     # Clerk auth config (uncomment to enable)
  myFunctions.ts     # Example functions
  _generated/        # Auto-generated types/api
/public              # Static assets
```

## Convex Patterns

### Function syntax (always use validators)

```typescript
import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { id: v.id("tableName") },
  returns: v.null(),
  handler: async (ctx, args) => {
    return null;
  },
});
```

### Key rules

- Use `query`/`mutation`/`action` for public, `internal*` for private
- Always include `args` + `returns` validators
- Use `v.null()` for void returns
- Use `withIndex()` not `filter()` for queries
- Tables: define in `convex/schema.ts`, snake_case plural
- Index names: include all fields (`by_field1_and_field2`)

### Calling functions

- `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction` with FunctionReference
- Import `api` (public) or `internal` (private) from `./_generated/api`

## Clerk Setup (incomplete)

1. Uncomment provider in `convex/auth.config.ts`
2. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard

## Constitution (Three Laws)

1. Never lose user data
2. Never miss an alert
3. Never compromise on clarity

## Naming Conventions

- Components: PascalCase
- Hooks: `use` prefix
- Mutations: verb-first (`createDeadline`)
- Queries: noun-first (`deadlinesByOrg`)
- Tables: snake_case plural
- Env vars: SCREAMING_SNAKE_CASE
