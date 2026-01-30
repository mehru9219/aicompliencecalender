# Tasks: AI-Powered Form Pre-filling

**Feature**: 004-ai-form-prefill | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build an intelligent form assistant that analyzes uploaded compliance forms, uses AI to understand field semantics, matches fields to stored organization data, and generates pre-filled documents. This feature uses AI heavily and must have rate limiting and cost controls.

---

## Phase 1: Organization Profile Foundation

### Task 1.1: Define Organization Profile Schema
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 001-deadline-management

**Description**: Create schema for storing organization profile data used in form filling.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `organization_profiles` table with all fields per plan:
  - legalName, dbaNames[], ein (encrypted), addresses[], phones[], emails[], website
  - licenseNumbers[], npiNumber, officers[], incorporationDate, customFields
  - orgId (link), updatedAt
- [X] `form_templates` table: orgId, name, industry, originalStorageId, fieldMappings[], timesUsed, createdAt
- [X] `form_fills` table: orgId, templateId, filledStorageId, valuesUsed, filledAt, filledBy
- [X] Index on orgId for all tables

**Constitution Checklist**:
- [X] EIN marked as encrypted (Security)
- [X] Org isolation via orgId (Security)

---

### Task 1.2: Create Profile TypeScript Types
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 1.1

**Description**: Define TypeScript types for organization profiles and forms.

**Files to create/modify**:
- `src/types/profile.ts`
- `src/types/form.ts`

**Acceptance Criteria**:
- [X] `OrganizationProfile` type matches schema
- [X] `Address`, `Phone`, `Email`, `LicenseNumber`, `Officer` nested types
- [X] `FormTemplate` type with fieldMappings
- [X] `FieldMapping` type: fieldName, fieldType, profileKey, position
- [X] `FormFill` type for fill history

**Constitution Checklist**:
- [X] Strict types (Code Quality)

---

### Task 1.3: Create Profile Validation Schemas
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create Zod schemas for profile validation.

**Files to create/modify**:
- `src/lib/validations/profile.ts`

**Acceptance Criteria**:
- [X] Validate legalName (required, 1-200 chars)
- [X] Validate EIN format (XX-XXXXXXX)
- [X] Validate phone numbers
- [X] Validate email addresses
- [X] Validate address structure
- [X] Validate license number formats

**Constitution Checklist**:
- [X] All API inputs validated (Code Quality)

---

## Phase 2: Organization Profile UI

### Task 2.1: Create OrgProfileEditor Component
**Priority**: P0 (Critical) | **Estimate**: 5-6 hours | **Dependencies**: 1.3

**Description**: Create comprehensive form for editing organization profile.

**Files to create/modify**:
- `src/components/features/forms/OrgProfileEditor.tsx`

**Acceptance Criteria**:
- [X] Sectioned form matching plan structure:
  - Business Information: legalName, dbaNames, ein, incorporationDate, website
  - Addresses: array editor with type, street, city, state, zip, country
  - Contact Information: phones array, emails array
  - Licenses & Certifications: licenseNumbers array, npiNumber
  - Officers & Contacts: officers array
- [X] Array field add/remove functionality
- [X] Inline validation with Zod
- [X] Auto-save draft on blur
- [X] Submit saves to Convex

**Constitution Checklist**:
- [X] Form labels visible (Accessibility)
- [X] Clear validation errors (UX)

---

### Task 2.2: Implement Profile CRUD Mutations
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Create Convex mutations for profile management.

**Files to create/modify**:
- `convex/profiles.ts`

**Acceptance Criteria**:
- [X] `get(orgId)` query - returns profile or null
- [X] `upsert(orgId, data)` mutation - creates or updates
- [X] Encrypts EIN before storage
- [X] Updates updatedAt timestamp
- [X] Validates input with Zod

**Constitution Checklist**:
- [X] EIN encrypted at rest (Security)
- [X] Org isolation (Security)

---

## Phase 3: Form Analysis AI

### Task 3.1: Create Claude API Adapter
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: None

**Description**: Create adapter for Claude API calls.

**Files to create/modify**:
- `src/lib/adapters/ai/claude.ts`
- `src/lib/adapters/ai/interface.ts`

**Acceptance Criteria**:
- [X] `AIAdapter` interface with `analyze(prompt, context)` method
- [X] `ClaudeAdapter` implements interface
- [X] Timeout of 60 seconds
- [X] Rate limiting: max 10 calls per minute per org
- [X] Cost tracking logging
- [X] Error handling with meaningful messages

**Constitution Checklist**:
- [X] Adapter pattern (External Services)
- [X] Timeout limits (Code Quality)
- [X] Rate limiting (Cost Awareness)

---

### Task 3.2: Implement Form Field Extraction
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: None

**Description**: Create utility to extract form fields from PDFs.

**Files to create/modify**:
- `src/lib/pdf/extractor.ts`
- `tests/unit/pdf-extractor.test.ts`

**Acceptance Criteria**:
- [X] `extractFormFields(pdfBuffer)` returns array of FormField
- [X] FormField: name, type (text, checkbox, dropdown, radio), position, options
- [X] Uses pdf-lib to read form fields
- [X] Handles non-fillable PDFs (returns empty array)
- [ ] Unit tests with sample PDFs

**Constitution Checklist**:
- [X] Graceful handling of non-fillable PDFs (Failure Handling)

---

### Task 3.3: Implement AI Field Analysis
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.1, 3.2

**Description**: Use Claude to understand field semantics.

**Files to create/modify**:
- `convex/forms.ts`
- `tests/unit/field-analysis.test.ts`

**Acceptance Criteria**:
- [X] `analyzeFieldsWithClaude(fields)` function
- [X] Prompt asks Claude to determine semantic type for each field:
  - business_name, ein, address_street, address_city, address_state, address_zip
  - phone, email, website, license_number, date, signature, other
- [X] Returns confidence level: high, medium, low
- [X] Returns formatting notes if applicable
- [X] Parses JSON response safely with error handling
- [ ] Unit tests with mocked Claude responses

**Constitution Checklist**:
- [X] AI operations async with progress (Performance)
- [X] Error handling for AI failures (Failure Handling)

---

### Task 3.4: Implement Field-to-Profile Matching
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 3.3

**Description**: Create logic to match analyzed fields to profile data.

**Files to create/modify**:
- `src/lib/forms/matcher.ts`
- `tests/unit/field-matcher.test.ts`

**Acceptance Criteria**:
- [X] `matchFieldsToProfile(analysis, profile)` function
- [X] Maps semantic types to profile keys:
  - business_name → legalName
  - ein → ein
  - address_street → addresses[0].street
  - phone → phones[0].number
  - etc.
- [X] Returns mappings with source tracking
- [X] Returns unmatched fields separately
- [ ] 100% test coverage

**Constitution Checklist**:
- [X] Clear source tracking for audit (Clarity)

---

## Phase 4: Form Filling

### Task 4.1: Implement PDF Filling Utility
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.2

**Description**: Create utility to fill PDF form fields.

**Files to create/modify**:
- `src/lib/pdf/filler.ts`
- `tests/unit/pdf-filler.test.ts`

**Acceptance Criteria**:
- [X] `fillPdfForm(pdfBuffer, mappings)` function
- [X] Handles field types: PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup
- [X] Gracefully skips fields that can't be filled (logs warning)
- [X] Leaves signature fields empty (marks for user)
- [X] Returns filled PDF as Uint8Array
- [ ] Unit tests with sample fillable PDFs

**Constitution Checklist**:
- [X] Graceful error handling (Failure Handling)

---

### Task 4.2: Implement Form Analysis Action
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 3.3, 3.4

**Description**: Create Convex action for full form analysis flow.

**Files to create/modify**:
- `convex/forms.ts`

**Acceptance Criteria**:
- [X] `analyzeForm(orgId, storageId, fileName)` action
- [X] Fetches file from storage
- [X] Extracts form fields
- [X] Calls Claude for semantic analysis
- [X] Matches to org profile
- [X] Returns: fields, analysis, mappings, unmatchedFields
- [X] Rate limiting check before AI call
- [X] Timeout handling (< 30s goal)

**Constitution Checklist**:
- [X] Rate limiting enforced (Cost Awareness)
- [X] < 30s target (Performance)

---

### Task 4.3: Implement Form Fill Action
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.1, 4.2

**Description**: Create action to fill and save form.

**Files to create/modify**:
- `convex/forms.ts`

**Acceptance Criteria**:
- [X] `fillFromTemplate(orgId, templateId, overrides?)` action
- [X] Fetches template and profile
- [X] Builds values from profile + overrides
- [X] Fills PDF using filler utility
- [X] Stores filled PDF in Convex storage
- [X] Records fill in form_fills table
- [X] Increments template timesUsed
- [X] Returns download URL

**Constitution Checklist**:
- [X] Values snapshot saved for audit (Audit Trail)

---

## Phase 5: Form UI Components

### Task 5.1: Create FormUploader Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: None

**Description**: Create form upload component specifically for form pre-fill.

**Files to create/modify**:
- `src/components/features/forms/FormUploader.tsx`

**Acceptance Criteria**:
- [X] Drag-drop for PDF/DOCX files
- [X] File type validation (PDF, DOCX only)
- [X] Size validation
- [X] Upload progress
- [X] Triggers analysis after upload

**Constitution Checklist**:
- [X] Clear error messages (UX)

---

### Task 5.2: Create FormAnalysisPreview Component
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 4.2

**Description**: Create component showing AI analysis results.

**Files to create/modify**:
- `src/components/features/forms/FormAnalysisPreview.tsx`

**Acceptance Criteria**:
- [X] Shows PDF preview on left
- [X] Shows detected fields on right
- [X] Each field shows:
  - Field name
  - Detected type
  - Confidence indicator (green/yellow/red)
  - Matched value from profile (if any)
- [X] Unmatched fields highlighted
- [X] Loading state during analysis

**Constitution Checklist**:
- [X] Confidence levels visible (Clarity)
- [X] Color + icon for confidence (Accessibility)

---

### Task 5.3: Create FieldMappingEditor Component
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 5.2

**Description**: Create component for manually editing field mappings.

**Files to create/modify**:
- `src/components/features/forms/FieldMappingEditor.tsx`

**Acceptance Criteria**:
- [X] Edit mapping for any field
- [X] Dropdown to select profile field
- [X] Manual value entry option
- [X] Clear mapping option
- [X] Bulk actions (clear all, reset to detected)

**Constitution Checklist**:
- [X] User can override AI suggestions (Clarity)

---

### Task 5.4: Create FormFillReview Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 5.3

**Description**: Create final review component before generating filled form.

**Files to create/modify**:
- `src/components/features/forms/FormFillReview.tsx`

**Acceptance Criteria**:
- [X] Shows all field-value pairs
- [X] Edit any value inline
- [X] Highlight signature fields as "Manual Entry Required"
- [X] Generate button
- [X] Progress indicator during generation
- [X] Download link when complete

**Constitution Checklist**:
- [X] Clear preview before generation (Clarity)

---

### Task 5.5: Create FormTemplateCard Component
**Priority**: P2 (Medium) | **Estimate**: 1-2 hours | **Dependencies**: 1.1

**Description**: Create card for displaying saved form templates.

**Files to create/modify**:
- `src/components/features/forms/FormTemplateCard.tsx`

**Acceptance Criteria**:
- [X] Shows: template name, industry, times used
- [X] Quick fill button
- [X] Edit mappings button
- [X] Delete button

**Constitution Checklist**:
- [X] Touch targets (Mobile)

---

## Phase 6: Form Pages

### Task 6.1: Create Form Templates Library Page
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 5.5

**Description**: Create page listing saved form templates.

**Files to create/modify**:
- `src/app/(dashboard)/forms/page.tsx`

**Acceptance Criteria**:
- [X] Grid of FormTemplateCards
- [X] Search/filter by name, industry
- [X] "Upload New Form" button
- [X] Empty state for no templates
- [ ] Pagination

**Constitution Checklist**:
- [X] Empty state (UX)

---

### Task 6.2: Create Form Filling Wizard Page
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 5.1, 5.2, 5.3, 5.4

**Description**: Create multi-step wizard for form filling.

**Files to create/modify**:
- `src/app/(dashboard)/forms/fill/page.tsx`

**Acceptance Criteria**:
- [X] Step 1: Upload form (FormUploader)
- [X] Step 2: Review analysis (FormAnalysisPreview)
- [X] Step 3: Edit mappings (FieldMappingEditor)
- [X] Step 4: Review and generate (FormFillReview)
- [X] Progress indicator
- [X] Back/Next navigation
- [X] Cancel returns to library

**Constitution Checklist**:
- [X] Clear multi-step flow (Clarity)
- [X] < 30s for generation (Performance)

---

### Task 6.3: Create Form Fill History Page
**Priority**: P2 (Medium) | **Estimate**: 2-3 hours | **Dependencies**: 4.3

**Description**: Create page showing past form fills.

**Files to create/modify**:
- `src/app/(dashboard)/forms/history/page.tsx`

**Acceptance Criteria**:
- [X] List of past fills
- [X] Shows: template name, filled date, filled by
- [X] Download filled document
- [X] View values used
- [ ] Pagination

**Constitution Checklist**:
- [X] Audit trail accessible (Compliance)

---

## Phase 7: Testing & Limits

### Task 7.1: Write Integration Tests for Form Analysis
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 4.2

**Description**: Integration tests for form analysis flow.

**Files to create/modify**:
- `tests/integration/form-analysis.test.ts`

**Acceptance Criteria**:
- [ ] Test full analysis flow (mock Claude)
- [ ] Test field extraction from sample PDFs
- [ ] Test field-to-profile matching
- [ ] Test error handling (invalid PDF, API failure)
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] External services mocked (Testing Principles)
- [ ] 80% coverage (Testing Standards)

---

### Task 7.2: Write Integration Tests for Form Filling
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.3

**Description**: Integration tests for form filling.

**Files to create/modify**:
- `tests/integration/form-filling.test.ts`

**Acceptance Criteria**:
- [ ] Test fill from template
- [ ] Test with overrides
- [ ] Test fill recording
- [ ] Test rate limiting (exceed limit, get error)
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] Rate limiting tested (Cost Awareness)

---

### Task 7.3: Implement Usage Limits for Form Pre-fills
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 010-billing-subscription

**Description**: Enforce plan-based limits on form pre-fills.

**Files to create/modify**:
- `convex/forms.ts`
- `convex/billing.ts`

**Acceptance Criteria**:
- [ ] Check limit before analyzeForm action
- [ ] Starter: 0 pre-fills
- [ ] Professional: 10/month
- [ ] Business: unlimited
- [ ] Track usage in billing.usage table
- [ ] Clear error message when limit reached
- [ ] Upgrade prompt UI

**Constitution Checklist**:
- [ ] Clear upgrade path (UX)
- [ ] Usage tracking for billing (Cost Awareness)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Profile Foundation | 3 | P0 | 5-7 |
| 2. Profile UI | 2 | P0 | 7-9 |
| 3. Form Analysis AI | 4 | P0 | 11-15 |
| 4. Form Filling | 3 | P0 | 10-13 |
| 5. Form UI | 5 | P0-P2 | 13-18 |
| 6. Pages | 3 | P0-P2 | 8-11 |
| 7. Testing & Limits | 3 | P0 | 9-12 |
| **Total** | **23** | | **63-85** |

## Dependencies Graph

```
1.1 Schema ─► 1.2 Types ─► 1.3 Validation ─► 2.1 Profile Editor
                                              2.2 CRUD Mutations

3.1 Claude Adapter ─► 3.3 AI Analysis ─┬─► 3.4 Matcher ─► 4.2 Analyze Action
                                       │
3.2 Field Extractor ──────────────────┘

4.1 PDF Filler ─► 4.3 Fill Action ─► 6.2 Wizard Page

5.1-5.4 Components ─► 6.1-6.3 Pages
```

**Note**: This feature has high AI costs. Rate limiting and usage tracking are **P0 requirements** before launch.
