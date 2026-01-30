# Tasks: Document Vault

**Feature**: 003-document-vault | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a secure document storage system with categorization, deadline linking, full-text search (including OCR), version history, and audit-ready export. Documents are sacred user data (**Constitution Law #1**).

---

## Phase 1: Database & Storage Foundation

### Task 1.1: Define Document Schema
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 001-deadline-management

**Description**: Create Convex schema for documents and access logging.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `documents` table: orgId, deadlineIds[], fileName, fileType, fileSize, storageId, category, extractedText, metadata, version, previousVersionId, uploadedAt, uploadedBy, lastAccessedAt, lastAccessedBy, deletedAt
- [X] `document_access_log` table: documentId, userId, action, timestamp, ipAddress
- [X] Indexes: `by_org`, `by_org_category`, `by_deadline`, `by_org_deleted`
- [X] Search index: `search_text` on extractedText filtered by orgId
- [X] 50MB max file size constraint documented

**Constitution Checklist**:
- [X] Soft-delete via deletedAt (Data Integrity)
- [X] Access logging for audit (Audit Trail)
- [X] orgId isolation (Security)

---

### Task 1.2: Create Document TypeScript Types
**Priority**: P0 (Critical) | **Estimate**: 1 hour | **Dependencies**: 1.1

**Description**: Define TypeScript types for documents.

**Files to create/modify**:
- `src/types/document.ts`

**Acceptance Criteria**:
- [X] `Document` type matches schema
- [X] `DocumentCategory` enum: licenses, certifications, training_records, audit_reports, policies, insurance, contracts, other
- [X] `DocumentAccessAction` enum: view, download, update, delete
- [X] `DocumentUploadInput` type for upload validation

**Constitution Checklist**:
- [X] No `any` types (Code Quality)

---

### Task 1.3: Create Document Validation Schemas
**Priority**: P0 (Critical) | **Estimate**: 1 hour | **Dependencies**: 1.2

**Description**: Create Zod schemas for document upload validation.

**Files to create/modify**:
- `src/lib/validations/document.ts`

**Acceptance Criteria**:
- [X] Validate fileName (no path traversal characters)
- [X] Validate fileType (allowed extensions: pdf, docx, xlsx, jpg, jpeg, png)
- [X] Validate fileSize (max 50MB)
- [X] Validate category (enum)
- [X] Clear error messages

**Constitution Checklist**:
- [X] All inputs validated (Code Quality)
- [X] Security: prevent path traversal (Security)

---

## Phase 2: File Upload System

### Task 2.1: Implement Upload URL Generation
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 1.1

**Description**: Create mutation for generating Convex storage upload URLs.

**Files to create/modify**:
- `convex/documents.ts`

**Acceptance Criteria**:
- [X] `generateUploadUrl(orgId)` mutation
- [X] Verifies user has org access before generating URL
- [X] Returns upload URL from Convex storage
- [X] URL expires after reasonable time

**Constitution Checklist**:
- [X] Org access verified (Security)

---

### Task 2.2: Implement Document Save Mutation
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.1, 1.3

**Description**: Create mutation to save document metadata after upload.

**Files to create/modify**:
- `convex/documents.ts`
- `tests/integration/document-upload.test.ts`

**Acceptance Criteria**:
- [X] `saveDocument(orgId, storageId, fileName, fileType, fileSize, category, deadlineIds?)` mutation
- [X] Validates all inputs with Zod
- [X] Detects existing document with same name - creates new version
- [X] Sets version number (1 for new, increment for existing)
- [X] Links previousVersionId for version chain
- [X] Records uploadedBy and uploadedAt
- [X] Triggers async text extraction via scheduler
- [X] Returns document ID
- [ ] 80% test coverage

**Constitution Checklist**:
- [X] Verify upload before confirming success (Data Integrity)
- [X] Atomic operations (Data Integrity)
- [X] Audit: uploadedBy tracked (Audit Trail)

---

### Task 2.3: Create DocumentUploader Component
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 2.1, 2.2

**Description**: Create the drag-and-drop file upload component.

**Files to create/modify**:
- `src/components/features/documents/DocumentUploader.tsx`

**Acceptance Criteria**:
- [X] Drag-and-drop zone with visual feedback
- [X] Click to browse files
- [X] Multiple file upload support
- [X] Progress indicator per file
- [X] Category selector (dropdown)
- [ ] Optional deadline linking (multi-select)
- [X] File type validation before upload
- [X] Size validation (50MB max) with clear error
- [X] Success toast on completion
- [X] Error handling with retry option

**Constitution Checklist**:
- [X] Clear error messages (UX)
- [X] Loading states (UX)
- [ ] Upload < 3s for 10MB (Performance)

---

## Phase 3: Text Extraction (OCR)

### Task 3.1: Create OCR Adapter Interface
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create adapter interface for OCR services.

**Files to create/modify**:
- `src/lib/adapters/ocr/interface.ts`

**Acceptance Criteria**:
- [X] `OCRAdapter` interface: `extractText(fileUrl: string, fileType: string): Promise<string>`
- [X] Interface allows for different implementations (Claude, AWS Textract, etc.)

**Constitution Checklist**:
- [X] Adapter pattern for provider flexibility (External Services)

---

### Task 3.2: Implement Claude Vision OCR Adapter
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 3.1

**Description**: Implement OCR using Claude Vision API.

**Files to create/modify**:
- `src/lib/adapters/ocr/claude.ts`
- `tests/unit/ocr-adapter.test.ts`

**Acceptance Criteria**:
- [X] `ClaudeOCRAdapter` implements interface
- [X] Handles image files (jpg, jpeg, png)
- [ ] Handles scanned PDFs (converts to image first)
- [X] Timeout of 60 seconds
- [ ] Rate limiting to prevent cost overrun
- [X] Error handling with fallback (return empty string, don't fail)
- [ ] 80% test coverage with mocked Claude API

**Constitution Checklist**:
- [X] Timeout limits (Code Quality)
- [ ] Rate limiting on AI features (Cost Awareness)
- [X] Never crash on external failure (Failure Handling)

---

### Task 3.3: Implement Text Extraction Action
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 3.2

**Description**: Create Convex action for extracting text from documents.

**Files to create/modify**:
- `convex/documents.ts`

**Acceptance Criteria**:
- [X] `extractText(docId)` internal action
- [X] For PDF: use pdf-parse first, fall back to Claude if no text
- [X] For images: use Claude Vision directly
- [ ] For DOCX: use mammoth.js
- [X] Truncate extracted text to 100,000 characters
- [X] Update document with extractedText
- [X] Handle errors gracefully (log, don't fail)

**Constitution Checklist**:
- [X] Async processing (Performance)
- [X] Graceful error handling (Failure Handling)

---

## Phase 4: Document Queries & Search

### Task 4.1: Implement Document List Query
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Create query for listing documents with filters.

**Files to create/modify**:
- `convex/documents.ts`

**Acceptance Criteria**:
- [X] `list(orgId, category?, deadlineId?, pagination)` query
- [X] Filters out soft-deleted documents
- [X] Sorted by uploadedAt descending (newest first)
- [X] Includes pagination (limit, cursor)
- [X] Only returns documents for specified org

**Constitution Checklist**:
- [X] Org isolation (Security)
- [X] No N+1 queries (Performance)

---

### Task 4.2: Implement Full-Text Search
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 3.3, 4.1

**Description**: Create search functionality using Convex search index.

**Files to create/modify**:
- `convex/documents.ts`
- `tests/integration/document-search.test.ts`

**Acceptance Criteria**:
- [X] `search(orgId, query, category?, deadlineId?, dateRange?)` query
- [X] Uses Convex search index on extractedText
- [X] Filters by category if provided
- [X] Filters by linked deadline if provided
- [X] Filters by date range if provided
- [X] Returns max 50 results
- [ ] Search results < 1s (Performance goal)

**Constitution Checklist**:
- [ ] Search < 500ms target (Performance)
- [X] Org-scoped results only (Security)

---

### Task 4.3: Implement Document Retrieval with Access Logging
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Create query for fetching single document with access logging.

**Files to create/modify**:
- `convex/documents.ts`

**Acceptance Criteria**:
- [X] `get(documentId)` query
- [X] Verifies user has org access
- [X] Logs access to document_access_log (via logAccess mutation)
- [X] Updates lastAccessedAt and lastAccessedBy (via logAccess mutation)
- [X] Returns signed URL for file download (via getWithUrl)
- [X] Handles version history retrieval (via getVersionHistory)

**Constitution Checklist**:
- [X] Document access logged (Audit Trail)
- [X] Org access verified (Security)

---

## Phase 5: Document Management UI

### Task 5.1: Create DocumentCard Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create card component for document list display.

**Files to create/modify**:
- `src/components/features/documents/DocumentCard.tsx`

**Acceptance Criteria**:
- [X] Displays: file icon (by type), fileName, category badge, uploadedAt, file size
- [ ] Thumbnail preview for images/PDFs
- [X] Click opens preview/detail
- [X] Quick actions: download, delete
- [X] Version indicator if version > 1

**Constitution Checklist**:
- [X] Touch targets 44x44px (Mobile)

---

### Task 5.2: Create DocumentPreview Component
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 4.3

**Description**: Create document preview component using react-pdf.

**Files to create/modify**:
- `src/components/features/documents/DocumentPreview.tsx`

**Acceptance Criteria**:
- [X] PDF preview using react-pdf
- [X] Image preview with zoom
- [X] Download button
- [X] Print button
- [X] Responsive sizing
- [X] Loading state while fetching
- [X] Error state if preview fails

**Constitution Checklist**:
- [X] Loading and error states (UX)
- [X] Documents lazy-load (Performance)

---

### Task 5.3: Create DocumentSearch Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Create search bar with filters for documents.

**Files to create/modify**:
- `src/components/features/documents/DocumentSearch.tsx`

**Acceptance Criteria**:
- [X] Search input with debounce (300ms)
- [X] Category filter dropdown
- [X] Date range picker
- [ ] Linked deadline filter
- [X] Clear all filters button
- [X] Results count display

**Constitution Checklist**:
- [X] Keyboard accessible (Accessibility)

---

### Task 5.4: Create DocumentVersionHistory Component
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 4.3

**Description**: Create component showing document version history.

**Files to create/modify**:
- `src/components/features/documents/DocumentVersionHistory.tsx`

**Acceptance Criteria**:
- [X] List all versions of document
- [X] Shows: version number, uploadedAt, uploadedBy
- [X] Download any version
- [ ] Restore previous version option
- [X] Current version highlighted

**Constitution Checklist**:
- [X] Version history preserved (Data Integrity)

---

### Task 5.5: Create DocumentCategorySelector Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 1.2

**Description**: Create reusable category selector.

**Files to create/modify**:
- `src/components/features/documents/DocumentCategorySelector.tsx`

**Acceptance Criteria**:
- [X] Dropdown with all document categories
- [X] Icons for each category
- [X] Search/filter within dropdown
- [X] Multi-select option for filtering

**Constitution Checklist**:
- [X] Keyboard accessible (Accessibility)

---

## Phase 6: Document Pages

### Task 6.1: Create Documents List Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.1, 5.1, 5.3

**Description**: Create the main documents list page.

**Files to create/modify**:
- `src/app/(dashboard)/documents/page.tsx`

**Acceptance Criteria**:
- [X] DocumentSearch at top
- [X] Grid/list view toggle
- [X] DocumentCard grid
- [X] DocumentUploader accessible (button or drag zone)
- [ ] Pagination or infinite scroll
- [X] Empty state for no documents
- [X] Loading skeleton

**Constitution Checklist**:
- [X] Loading state (UX)
- [X] Empty state (UX)

---

### Task 6.2: Create Document Detail Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.3, 5.2, 5.4

**Description**: Create the document detail/preview page.

**Files to create/modify**:
- `src/app/(dashboard)/documents/[id]/page.tsx`

**Acceptance Criteria**:
- [X] DocumentPreview as main content
- [X] Sidebar with: metadata, linked deadlines, version history, access log
- [X] Edit metadata (category, deadlines)
- [X] Delete with confirmation
- [X] Download button
- [X] Breadcrumb navigation

**Constitution Checklist**:
- [X] Delete requires confirmation (UX)
- [X] Access logged (Audit Trail)

---

## Phase 7: Audit Export

### Task 7.1: Create Audit Export Wizard Component
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 4.1

**Description**: Create wizard for generating audit-ready document exports.

**Files to create/modify**:
- `src/components/features/documents/AuditExportWizard.tsx`

**Acceptance Criteria**:
- [X] Step 1: Select category or deadline
- [X] Step 2: Select date range
- [X] Step 3: Preview documents to include
- [X] Step 4: Generate ZIP
- [X] Progress indicator during generation
- [X] Download link when complete

**Constitution Checklist**:
- [X] Clear multi-step process (Clarity)

---

### Task 7.2: Implement Audit Export Action
**Priority**: P1 (High) | **Estimate**: 4-5 hours | **Dependencies**: 7.1

**Description**: Create Convex action to generate audit export ZIP.

**Files to create/modify**:
- `convex/documents.ts`

**Acceptance Criteria**:
- [X] `generateAuditExport(orgId, category?, deadlineIds?, dateRange?)` action
- [X] Fetches matching documents
- [X] Creates ZIP with folder structure by category
- [X] Includes cover sheet PDF with:
  - Organization name
  - Export date
  - Date range covered
  - Document count
- [X] Includes table of contents PDF
- [X] Stores ZIP in Convex storage
- [X] Returns download URL
- [ ] Timeout handling for large exports

**Constitution Checklist**:
- [X] Audit-ready format (Compliance)
- [X] Async with progress (Performance)

---

## Phase 8: Testing & Security

### Task 8.1: Write Integration Tests for Document Upload
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.2

**Description**: Integration tests for upload flow.

**Files to create/modify**:
- `convex/documents.test.ts`

**Acceptance Criteria**:
- [X] Test successful upload flow
- [X] Test versioning (upload same filename)
- [X] Test file type validation
- [X] Test file size validation
- [X] Test multi-tenant isolation
- [ ] 80% coverage - needs coverage check

**Constitution Checklist**:
- [ ] 80% coverage for upload flows (Testing Standards) - needs coverage check

---

### Task 8.2: Write Integration Tests for Search
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Integration tests for search functionality.

**Files to create/modify**:
- `convex/documents.test.ts`

**Acceptance Criteria**:
- [X] Test text search returns relevant results
- [X] Test category filter
- [X] Test date range filter
- [ ] Test deadline filter - deferred (needs deadline linkage)
- [X] Test empty results
- [X] Test org isolation (search doesn't leak across orgs)

**Constitution Checklist**:
- [X] Org isolation tested (Security)

---

### Task 8.3: Implement Document Soft-Delete and Retention
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Implement soft-delete with 30-day retention.

**Files to create/modify**:
- `convex/documents.ts`
- `convex/crons.ts`

**Acceptance Criteria**:
- [X] `softDelete(documentId)` sets deletedAt
- [X] `restore(documentId)` clears deletedAt
- [X] `hardDelete(documentId)` only works if deletedAt > 30 days
- [X] Daily cron purges documents deleted > 30 days
- [X] Trash view shows soft-deleted documents

**Constitution Checklist**:
- [X] 30-day soft-delete retention (Data Retention)
- [X] Documents retained until explicit deletion (Data Retention)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Database Foundation | 3 | P0 | 4 |
| 2. File Upload | 3 | P0 | 8-11 |
| 3. Text Extraction | 3 | P1 | 7-10 |
| 4. Queries & Search | 3 | P0-P1 | 7-10 |
| 5. Management UI | 5 | P1-P2 | 10-14 |
| 6. Pages | 2 | P0 | 6-8 |
| 7. Audit Export | 2 | P1 | 7-9 |
| 8. Testing & Security | 3 | P0-P1 | 7-10 |
| **Total** | **24** | | **56-76** |

## Dependencies Graph

```
1.1 Schema ─► 2.1 Upload URL ─► 2.2 Save Mutation ─► 2.3 Uploader Component
    │
    ├── 3.1 OCR Interface ─► 3.2 Claude Adapter ─► 3.3 Extract Action
    │
    ├── 4.1 List Query ─────┬── 4.2 Search ─► 5.3 Search Component
    │                       │
    │                       └── 6.1 List Page
    │
    └── 4.3 Get Query ─► 5.2 Preview ─► 6.2 Detail Page
```

**Note**: Documents are **Constitution Law #1 critical**. All upload and storage operations must be atomic and verified.
