# Tasks: Industry Compliance Templates

**Feature**: 005-industry-templates | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a library of pre-configured compliance templates for regulated industries with versioned definitions, customizable import, and automatic update notifications. Templates cite regulatory sources and help users get started quickly.

---

## Phase 1: Template Data Structure

### Task 1.1: Define Template Schema
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 001-deadline-management

**Description**: Create Convex schema for industry templates and imports.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `industry_templates` table: slug (unique), industry, subIndustry, name, description, version (semver), deadlines[], documentCategories[], regulatoryReferences[], formTemplateIds[], createdAt, updatedAt, isActive
- [X] `template_imports` table: orgId, templateId, templateVersion, importedDeadlineIds[], customizations, importedAt, lastNotifiedVersion
- [X] Indexes: `by_slug`, `by_industry`, `by_org` (for imports)

**Constitution Checklist**:
- [X] Version tracking for templates (Data Integrity)
- [X] Org isolation on imports (Security)

---

### Task 1.2: Create Template TypeScript Types
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.1

**Description**: Define comprehensive TypeScript types for templates.

**Files to create/modify**:
- `src/types/template.ts`

**Acceptance Criteria**:
- [X] `IndustryTemplate` type matches schema
- [X] `TemplateDeadline` type with:
  - id (stable across versions)
  - title, description, category, recurrence
  - defaultAlertDays[], anchorType (fixed_date/anniversary/custom)
  - defaultMonth, defaultDay (for fixed_date)
  - importance (critical/high/medium/low)
  - penaltyRange, regulatoryBody, notes
- [X] `RegulatoryReference` type: name, url, description
- [X] `TemplateImport` type

**Constitution Checklist**:
- [X] Strict types (Code Quality)

---

### Task 1.3: Create Healthcare Medical Practice Template
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 1.2

**Description**: Create the first complete industry template for healthcare.

**Files to create/modify**:
- `src/lib/templates/healthcare-medical-practice.ts`

**Acceptance Criteria**:
- [X] Complete template with 10+ deadlines:
  - HIPAA Annual Risk Assessment
  - HIPAA Workforce Training
  - Medical License Renewal
  - DEA Registration Renewal
  - CLIA Certificate Renewal
  - Malpractice Insurance Renewal
  - Business License Renewal
  - Fire Safety Inspection
  - OSHA Compliance Review
  - Medicare/Medicaid Revalidation
- [X] Each deadline has all fields populated
- [X] regulatoryReferences with real URLs
- [X] documentCategories specific to healthcare
- [X] Version: 1.0.0

**Constitution Checklist**:
- [X] Regulatory sources cited (Industry Templates)
- [X] Penalties documented (Clarity)

---

### Task 1.4: Create Additional Industry Templates
**Priority**: P1 (High) | **Estimate**: 8-10 hours | **Dependencies**: 1.3

**Description**: Create templates for other regulated industries.

**Files to create/modify**:
- `src/lib/templates/healthcare-dental.ts`
- `src/lib/templates/healthcare-mental-health.ts`
- `src/lib/templates/legal-law-firm.ts`
- `src/lib/templates/financial-advisor.ts`
- `src/lib/templates/financial-cpa-firm.ts`
- `src/lib/templates/index.ts` (registry)

**Acceptance Criteria**:
- [X] Each template has 5+ relevant deadlines
- [X] Regulatory references accurate
- [X] Proper categorization
- [X] All exported from index.ts

**Constitution Checklist**:
- [X] All templates cite sources (Industry Templates)

---

## Phase 2: Template Import Logic

### Task 2.1: Implement Template List Query
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.1

**Description**: Create query to list available templates.

**Files to create/modify**:
- `convex/templates.ts`

**Acceptance Criteria**:
- [X] `list(industry?)` query
- [X] Returns active templates only
- [X] Filters by industry if provided
- [X] Includes deadline count, last updated

**Constitution Checklist**:
- [X] No N+1 queries (Performance)

---

### Task 2.2: Implement Template Detail Query
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 2.1

**Description**: Create query for single template details.

**Files to create/modify**:
- `convex/templates.ts`

**Acceptance Criteria**:
- [X] `getBySlug(slug)` query
- [X] Returns full template with all deadlines
- [X] Includes regulatory references

---

### Task 2.3: Implement Due Date Calculation
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create utility to calculate due dates from template anchors.

**Files to create/modify**:
- `src/lib/utils/template-dates.ts`
- `tests/unit/template-dates.test.ts`

**Acceptance Criteria**:
- [X] `calculateDefaultDueDate(templateDeadline)` function
- [X] Handles anchorType 'fixed_date': uses defaultMonth/Day in current or next year
- [X] Handles anchorType 'anniversary': requires user input (returns null)
- [X] Handles anchorType 'custom': requires user input (returns null)
- [ ] 100% test coverage

**Constitution Checklist**:
- [ ] 100% coverage for date utilities (Testing Standards)

---

### Task 2.4: Implement Template Import Mutation
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 2.3

**Description**: Create mutation to import template deadlines.

**Files to create/modify**:
- `convex/templates.ts`
- `tests/integration/template-import.test.ts`

**Acceptance Criteria**:
- [X] `importTemplate(orgId, templateId, selectedDeadlineIds, customDates)` mutation
- [X] Creates deadline for each selected template deadline
- [X] Uses customDates for user-provided dates
- [X] Uses calculateDefaultDueDate for others
- [X] Links templateDeadlineId for tracking
- [X] Schedules alerts using defaultAlertDays
- [X] Records import in template_imports table
- [X] Returns imported deadline IDs
- [ ] 80% test coverage

**Constitution Checklist**:
- [X] Alerts scheduled automatically (Alert Reliability)
- [X] Import tracked for updates (Data Integrity)

---

## Phase 3: Template Updates

### Task 3.1: Implement Version Comparison
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create utility to compare template versions and detect changes.

**Files to create/modify**:
- `src/lib/utils/template-version.ts`
- `tests/unit/template-version.test.ts`

**Acceptance Criteria**:
- [X] `compareVersions(oldVersion, newVersion, template)` function
- [X] Detects: new deadlines, removed deadlines, modified deadlines
- [X] Returns change list with type and details
- [X] Uses semver for version comparison

**Constitution Checklist**:
- [X] Change tracking for user notification (Clarity)

---

### Task 3.2: Implement Update Check Cron
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.1

**Description**: Create cron job to check for template updates.

**Files to create/modify**:
- `convex/crons.ts`
- `convex/templates.ts`

**Acceptance Criteria**:
- [X] Daily cron job (or weekly)
- [X] For each template_import, compare current template version to lastNotifiedVersion
- [X] If different, trigger notification
- [X] Update lastNotifiedVersion after notification

**Constitution Checklist**:
- [X] Users notified of template updates (Industry Templates)

---

### Task 3.3: Implement Update Notification
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.2

**Description**: Create notification system for template updates.

**Files to create/modify**:
- `convex/templates.ts`
- `src/lib/email/templates/TemplateUpdateEmail.tsx`

**Acceptance Criteria**:
- [ ] Send email to org owner with:
  - Template name and old/new version
  - List of changes
  - Link to review
- [X] Create in-app notification
- [ ] Link to template update review page

**Constitution Checklist**:
- [ ] Email for important updates (Alert Reliability)
- [X] In-app notification (Clarity)

---

## Phase 4: Template UI Components

### Task 4.1: Create TemplateCard Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create card component for template library.

**Files to create/modify**:
- `src/components/features/templates/TemplateCard.tsx`

**Acceptance Criteria**:
- [X] Shows: name, industry, description, deadline count
- [X] Version badge
- [X] "Import" button
- [X] Click for details

**Constitution Checklist**:
- [X] Touch targets (Mobile)

---

### Task 4.2: Create TemplateDeadlineList Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create component showing template deadlines.

**Files to create/modify**:
- `src/components/features/templates/TemplateDeadlineList.tsx`

**Acceptance Criteria**:
- [X] Lists all deadlines in template
- [X] Shows: title, category, recurrence, importance badge
- [X] Expandable for description, penalty, regulatory body
- [X] Checkbox for selection during import

**Constitution Checklist**:
- [X] Penalty info visible (Clarity)

---

### Task 4.3: Create TemplateImportWizard Component
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 4.2, 2.4

**Description**: Create multi-step wizard for importing template.

**Files to create/modify**:
- `src/components/features/templates/TemplateImportWizard.tsx`

**Acceptance Criteria**:
- [X] Step 1: Select deadlines (checkboxes, select all/none)
- [X] Step 2: Customize dates (DateCustomizer for each selected)
- [X] Step 3: Review and confirm
- [X] Progress indicator
- [X] Import button with loading state
- [X] Success summary with link to deadlines

**Constitution Checklist**:
- [X] Clear multi-step flow (Clarity)

---

### Task 4.4: Create DateCustomizer Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 2.3

**Description**: Create component for customizing deadline dates during import.

**Files to create/modify**:
- `src/components/features/templates/DateCustomizer.tsx`

**Acceptance Criteria**:
- [X] For fixed_date anchors: shows default, allows override
- [X] For anniversary/custom: requires date input
- [X] Shows deadline title and description
- [X] Date picker with reasonable defaults
- [X] Validation (date must be in future)

**Constitution Checklist**:
- [X] Clear labels (Accessibility)

---

### Task 4.5: Create TemplateUpdateNotice Component
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 3.1

**Description**: Create component showing template update notification.

**Files to create/modify**:
- `src/components/features/templates/TemplateUpdateNotice.tsx`

**Acceptance Criteria**:
- [X] Shows: template name, version change
- [X] Lists changes (new/modified/removed deadlines)
- [X] "Review Changes" button
- [X] "Dismiss" button
- [ ] Links to apply updates

---

### Task 4.6: Create RegulatoryReferenceLinks Component
**Priority**: P2 (Medium) | **Estimate**: 1 hour | **Dependencies**: 1.2

**Description**: Create component showing regulatory reference links.

**Files to create/modify**:
- `src/components/features/templates/RegulatoryReferenceLinks.tsx`

**Acceptance Criteria**:
- [X] Lists regulatory references with names
- [X] External link icons
- [X] Links open in new tab
- [X] Description on hover/expand

**Constitution Checklist**:
- [X] Regulatory sources accessible (Industry Templates)

---

## Phase 5: Template Pages

### Task 5.1: Create Template Library Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.1

**Description**: Create page browsing all templates.

**Files to create/modify**:
- `src/app/(dashboard)/templates/page.tsx`

**Acceptance Criteria**:
- [X] Grid of TemplateCards
- [X] Filter by industry (dropdown)
- [X] Search by name
- [X] Empty state if no templates for industry
- [X] Link to request new template

**Constitution Checklist**:
- [X] Template list < 500ms (Performance)

---

### Task 5.2: Create Template Detail Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.2, 4.6

**Description**: Create page showing template details.

**Files to create/modify**:
- `src/app/(dashboard)/templates/[slug]/page.tsx`

**Acceptance Criteria**:
- [X] Template name, description, version
- [X] TemplateDeadlineList
- [X] RegulatoryReferenceLinks
- [X] "Import Template" button opens wizard
- [ ] Shows if already imported (with version)

---

### Task 5.3: Create Template Import Page
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 4.3

**Description**: Create page for import wizard.

**Files to create/modify**:
- `src/app/(dashboard)/templates/import/page.tsx`

**Acceptance Criteria**:
- [X] TemplateImportWizard component
- [X] Query param for template slug
- [X] Redirect to deadlines on success

---

## Phase 6: Testing & Seeding

### Task 6.1: Write Integration Tests for Template Import
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.4

**Description**: Integration tests for import flow.

**Files to create/modify**:
- `tests/integration/template-import.test.ts`

**Acceptance Criteria**:
- [ ] Test importing all deadlines
- [ ] Test importing subset
- [ ] Test custom dates
- [ ] Test import recording
- [ ] Test duplicate import handling
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] 80% coverage (Testing Standards)

---

### Task 6.2: Create Template Seeding Script
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.4

**Description**: Create script to seed templates into database.

**Files to create/modify**:
- `convex/seed.ts`
- `scripts/seed-templates.ts`

**Acceptance Criteria**:
- [X] Imports all templates from lib/templates
- [X] Creates industry_templates records
- [X] Can be run idempotently (updates existing)
- [X] Logs created/updated templates

---

### Task 6.3: Implement Template Validation
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create validation for template structure.

**Files to create/modify**:
- `src/lib/validations/template.ts`
- `tests/unit/template-validation.test.ts`

**Acceptance Criteria**:
- [X] Validate all required fields
- [X] Validate semver version format
- [X] Validate deadline IDs are unique
- [X] Validate regulatory URLs are valid
- [ ] Run validation on seed

**Constitution Checklist**:
- [X] Template quality validation (Code Quality)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Template Data | 4 | P0-P1 | 16-19 |
| 2. Import Logic | 4 | P0 | 9-12 |
| 3. Updates | 3 | P1 | 6-9 |
| 4. UI Components | 6 | P0-P2 | 13-16 |
| 5. Pages | 3 | P0 | 8-11 |
| 6. Testing & Seeding | 3 | P0-P1 | 7-8 |
| **Total** | **23** | | **59-75** |

## Dependencies Graph

```
1.1 Schema ─► 1.2 Types ─► 1.3 Healthcare Template
                    │            │
                    │            └─► 1.4 More Templates ─► 6.2 Seeding
                    │
                    ├─► 2.1 List Query
                    │
                    ├─► 2.3 Date Calc ─► 2.4 Import Mutation
                    │                          │
                    └─► 4.1-4.6 Components ────┴─► 5.1-5.3 Pages

3.1 Version Compare ─► 3.2 Update Cron ─► 3.3 Notification
```

**Note**: Templates must cite regulatory sources per Constitution. Each template requires research to ensure accuracy.
