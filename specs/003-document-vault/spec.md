# Feature Specification: Document Vault

**Feature Branch**: `003-document-vault`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a secure document storage system that keeps all compliance-related files organized, linked to their relevant deadlines, and instantly retrievable during audits."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Categorize Documents (Priority: P1)

A compliance manager uploads a renewed business license PDF and categorizes it under "Licenses" for easy retrieval during audits.

**Why this priority**: Document storage is the core function - without uploads, there's nothing to organize or retrieve.

**Independent Test**: Can be tested by uploading a document, selecting a category, and verifying it appears in the correct location.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they upload a PDF file under 50MB with category "Licenses", **Then** the document is stored and appears in the Licenses category.
2. **Given** a user uploading a document, **When** the file exceeds 50MB, **Then** the system rejects the upload with a clear size limit message.
3. **Given** a user uploading a document, **When** they select category and add optional description, **Then** both metadata are saved with the document.

---

### User Story 2 - Link Documents to Deadlines (Priority: P1)

A compliance officer links the uploaded HIPAA training certificate to the "Annual HIPAA Training" deadline, creating a complete compliance record.

**Why this priority**: Linking creates the compliance story - document + deadline = proof of timely compliance.

**Independent Test**: Can be tested by linking a document to a deadline and verifying bidirectional visibility.

**Acceptance Scenarios**:

1. **Given** an uploaded document and an existing deadline, **When** user links them, **Then** the document appears in the deadline's detail view.
2. **Given** a linked document, **When** viewed, **Then** it shows all associated deadlines.
3. **Given** a deadline with linked documents, **When** the deadline is completed, **Then** the document links remain intact for audit history.

---

### User Story 3 - Search Documents (Priority: P2)

A compliance manager needs to find all insurance-related documents from 2025 and uses search to quickly locate them.

**Why this priority**: Search enables retrieval at scale, which becomes critical as document volume grows.

**Independent Test**: Can be tested by uploading documents with various content and verifying search finds expected results.

**Acceptance Scenarios**:

1. **Given** documents in the system, **When** user searches by filename "insurance", **Then** all documents with "insurance" in the name appear.
2. **Given** documents with text content, **When** user searches for text within documents, **Then** matching documents are returned (full-text search).
3. **Given** multiple search criteria (category, date range, linked deadline), **When** combined, **Then** results match all criteria.

---

### User Story 4 - Version History (Priority: P2)

A compliance manager uploads an updated policy document and the system keeps the previous version accessible for audit purposes.

**Why this priority**: Version history proves documents weren't backdated - important for compliance credibility.

**Independent Test**: Can be tested by uploading multiple versions and verifying all versions remain accessible.

**Acceptance Scenarios**:

1. **Given** an existing document, **When** user uploads a new version with the same name, **Then** both versions are retained with timestamps.
2. **Given** a document with multiple versions, **When** user views version history, **Then** all versions are listed with upload dates and uploaders.
3. **Given** a document with versions, **When** user downloads a specific version, **Then** they receive exactly that version's content.

---

### User Story 5 - Audit Export (Priority: P2)

During a regulatory audit, the compliance officer generates a complete package of all HIPAA-related documents with a cover sheet and organized folder structure.

**Why this priority**: Audit export is the "magic moment" that justifies the product's value.

**Independent Test**: Can be tested by exporting a category and verifying the ZIP contains correct documents and cover sheet.

**Acceptance Scenarios**:

1. **Given** a compliance category with documents, **When** user initiates audit export, **Then** system generates ZIP with organized folders.
2. **Given** an audit export, **When** generated, **Then** it includes a cover sheet listing all documents with upload dates and linked deadlines.
3. **Given** an export request for "HIPAA 2025", **When** processed, **Then** only documents in HIPAA category uploaded in 2025 are included.

---

### User Story 6 - Soft Delete and Recovery (Priority: P3)

A user accidentally deletes an important certificate and recovers it from trash within the 30-day window.

**Why this priority**: Recovery is important but less frequently used than core operations.

**Independent Test**: Can be tested by deleting a document, viewing trash, and restoring it.

**Acceptance Scenarios**:

1. **Given** a document, **When** deleted, **Then** it moves to trash and is not visible in main views.
2. **Given** a document in trash, **When** restored within 30 days, **Then** it returns to original category with all metadata intact.
3. **Given** a document in trash for 30+ days, **When** retention period expires, **Then** it is permanently deleted.

---

### Edge Cases

- What happens when a document linked to a deadline is deleted?
- How does the system handle duplicate filenames in the same category?
- What happens when OCR fails to extract text from a scanned document?
- How does the system handle corrupted file uploads?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support document uploads in PDF, Word (.doc, .docx), Excel (.xls, .xlsx), and image formats (JPG, PNG).
- **FR-002**: System MUST enforce maximum file size of 50MB per document.
- **FR-003**: System MUST NOT impose limits on total storage per organization.
- **FR-004**: System MUST require categorization for all uploaded documents with predefined categories: licenses, certifications, training records, audit reports, policies, insurance, contracts.
- **FR-005**: System MUST allow organizations to create custom document categories.
- **FR-006**: System MUST allow documents to be linked to one or more deadlines.
- **FR-007**: System MUST display linked documents when viewing a deadline and linked deadlines when viewing a document.
- **FR-008**: System MUST extract and index text from uploaded documents for full-text search.
- **FR-009**: System MUST perform OCR on scanned images and image-based PDFs to enable text search.
- **FR-010**: System MUST support search by filename, category, date range, linked deadline, and document content.
- **FR-011**: System MUST maintain version history when documents with the same name are re-uploaded.
- **FR-012**: System MUST track for each document: upload date, uploader, last accessed date, last accessed by, and download history.
- **FR-013**: System MUST support bulk export by category, date range, or linked deadline as organized ZIP file.
- **FR-014**: System MUST generate audit export packages with cover sheet, table of contents, and organized folder structure.
- **FR-015**: System MUST implement soft-delete with 30-day recovery window.
- **FR-016**: System MUST encrypt all documents at rest.
- **FR-017**: System MUST log all document access events for audit trail.

### Key Entities

- **Document**: Stored file with metadata including filename, category, upload date, uploader, linked deadlines, and version information.
- **Document Category**: Classification type (predefined or custom) for organizing documents.
- **Document Version**: Historical snapshot of a document with timestamp and uploader.
- **Document Link**: Association between a document and a deadline.
- **Access Log**: Record of who accessed/downloaded a document and when.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload a document and categorize it in under 60 seconds.
- **SC-002**: Documents under 10MB upload and confirm within 3 seconds.
- **SC-003**: Full-text search returns results within 1 second for libraries up to 10,000 documents.
- **SC-004**: Audit export generates complete package within 2 minutes for up to 500 documents.
- **SC-005**: 100% of document access events are captured in audit log.
- **SC-006**: Documents remain encrypted at rest with zero unencrypted storage incidents.
- **SC-007**: Users can find any document within 30 seconds using search or navigation.

## Assumptions

- OCR accuracy for scanned documents is sufficient for search (not perfect transcription).
- Users understand that very large exports may take longer; progress indication will be provided.
- Document content indexing happens asynchronously after upload; search may not find newly uploaded content for a few minutes.
- "Same name" for version tracking means exact filename match within the same category.

## Clarifications

### Session 2026-01-28

- Q: When a document is linked to a deadline that gets soft-deleted? → A: Preserve link, document shows "linked to [deleted deadline]" - maintains audit trail integrity
- Q: When uploading a file with the same name as an existing file in the same category? → A: Create new version of existing document - most common use case is replacing outdated docs
- Q: When OCR fails to extract text from a scanned document? → A: Store document without text index, mark as "search limited" - never block document upload
- Q: Spec says "MUST NOT impose limits on total storage" - is this per tier or absolute? → A: Tier-based limits per billing spec (1GB/10GB/50GB/unlimited) - billing feature takes precedence

### Integrated Decisions

**Deleted Deadline Link Display**:
```tsx
{deadline.deletedAt ? (
  <span className="text-gray-400">Linked to [deleted deadline]</span>
) : (
  <Link href={`/deadlines/${deadline._id}`}>{deadline.title}</Link>
)}
```

**Duplicate Filename Behavior**: Auto-version on duplicate name + category match:
```typescript
const existing = await findByNameAndCategory(fileName, category, orgId);
if (existing) {
  return createNewVersion(existing._id, newFile);
}
return createNewDocument(newFile);
```

**OCR Failure UI**:
```tsx
{document.extractedText === null && (
  <Badge variant="warning">Search limited - OCR failed</Badge>
)}
```

**Storage Limits** (aligned with billing spec):
- Starter: 1 GB
- Professional: 10 GB
- Business: 50 GB
- Enterprise: Unlimited
