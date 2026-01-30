# Implementation Plan: Document Vault

**Branch**: `003-document-vault` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-document-vault/spec.md`

## Summary

Build a secure document storage system with categorization, deadline linking, full-text search (including OCR for scanned documents), version history, and audit-ready export capabilities.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Convex File Storage, Claude API (vision/OCR), pdf-parse, react-pdf, JSZip
**Storage**: Convex Storage (files), Convex DB (metadata)
**Testing**: Vitest (unit), mocked Claude API
**Target Platform**: Web (responsive)
**Project Type**: Web application
**Performance Goals**: Upload < 3s for 10MB, search < 1s
**Constraints**: 50MB max file size, encryption at rest, 30-day soft delete
**Scale/Scope**: 10,000 documents per organization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Convex storage with verification, version history, soft-delete
- [x] **Alert Reliability**: N/A for this feature
- [x] **Clarity**: Document-deadline links show complete compliance picture

Additional checks:
- [x] **Security**: Encryption at rest (Convex default), access logging, org isolation
- [x] **Code Quality**: TypeScript strict, Zod validation for uploads
- [x] **Testing**: 80% coverage for upload/search flows
- [x] **Performance**: Async text extraction, indexed search
- [x] **External Services**: Claude API adapter with timeout/fallback

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── documents/
│           ├── page.tsx              # Document list with search
│           └── [id]/page.tsx         # Document detail/preview
├── components/
│   └── features/
│       └── documents/
│           ├── DocumentUploader.tsx
│           ├── DocumentCard.tsx
│           ├── DocumentPreview.tsx
│           ├── DocumentSearch.tsx
│           ├── DocumentCategorySelector.tsx
│           ├── DocumentVersionHistory.tsx
│           └── AuditExportWizard.tsx
├── convex/
│   ├── documents.ts                  # Queries/mutations/actions
│   └── schema.ts                     # Document tables
└── lib/
    └── adapters/
        └── ocr/
            ├── interface.ts
            └── claude.ts             # Claude Vision OCR
```

## Database Schema

```typescript
// convex/schema.ts (additions)
documents: defineTable({
  orgId: v.id("organizations"),
  deadlineIds: v.array(v.id("deadlines")),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  storageId: v.id("_storage"),
  category: v.string(),
  extractedText: v.optional(v.string()),
  metadata: v.optional(v.object({})),
  version: v.number(),
  previousVersionId: v.optional(v.id("documents")),
  uploadedAt: v.number(),
  uploadedBy: v.string(),
  lastAccessedAt: v.number(),
  lastAccessedBy: v.string(),
  deletedAt: v.optional(v.number()),
})
  .index("by_org", ["orgId"])
  .index("by_org_category", ["orgId", "category"])
  .index("by_deadline", ["deadlineIds"])
  .searchIndex("search_text", { searchField: "extractedText", filterFields: ["orgId"] }),

document_access_log: defineTable({
  documentId: v.id("documents"),
  userId: v.string(),
  action: v.string(),
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
}),
```

## File Upload Flow

```typescript
// convex/documents.ts
export const generateUploadUrl = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await verifyOrgAccess(ctx, orgId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    orgId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: v.string(),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Check for existing document (versioning)
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.eq(q.field("fileName"), args.fileName),
          q.eq(q.field("deletedAt"), null)
        )
      )
      .first();

    const version = existing ? existing.version + 1 : 1;

    const docId = await ctx.db.insert("documents", {
      ...args,
      deadlineIds: args.deadlineIds ?? [],
      version,
      previousVersionId: existing?._id,
      extractedText: null,
      uploadedAt: Date.now(),
      uploadedBy: user.id,
      lastAccessedAt: Date.now(),
      lastAccessedBy: user.id,
      deletedAt: null,
    });

    // Trigger async text extraction
    await ctx.scheduler.runAfter(0, internal.documents.extractText, { docId });

    return docId;
  },
});
```

## Text Extraction (Claude Vision)

```typescript
// convex/documents.ts
export const extractText = internalAction({
  args: { docId: v.id("documents") },
  handler: async (ctx, { docId }) => {
    const doc = await ctx.runQuery(internal.documents.get, { docId });
    const fileUrl = await ctx.storage.getUrl(doc.storageId);

    let extractedText = '';

    if (doc.fileType === 'pdf') {
      // Try pdf-parse first
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(buffer));
      extractedText = pdfData.text;

      // If no text (scanned PDF), use Claude Vision
      if (!extractedText.trim()) {
        extractedText = await extractWithClaude(fileUrl);
      }
    } else if (['jpg', 'jpeg', 'png'].includes(doc.fileType)) {
      extractedText = await extractWithClaude(fileUrl);
    }

    await ctx.runMutation(internal.documents.updateExtractedText, {
      docId,
      extractedText: extractedText.slice(0, 100000),
    });
  },
});

async function extractWithClaude(fileUrl: string): Promise<string> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: fileUrl } },
        { type: 'text', text: 'Extract all text from this document. Return only the extracted text.' },
      ],
    }],
  });

  return response.content[0].text;
}
```

## Search Implementation

```typescript
// convex/documents.ts
export const search = query({
  args: {
    orgId: v.id("organizations"),
    query: v.string(),
    category: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
    dateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("documents")
      .withSearchIndex("search_text", (q) =>
        q.search("extractedText", args.query).eq("orgId", args.orgId)
      )
      .take(50);

    // Apply filters
    if (args.category) {
      results = results.filter((d) => d.category === args.category);
    }
    if (args.deadlineId) {
      results = results.filter((d) => d.deadlineIds.includes(args.deadlineId));
    }
    if (args.dateRange) {
      results = results.filter((d) =>
        d.uploadedAt >= args.dateRange.from && d.uploadedAt <= args.dateRange.to
      );
    }

    return results.filter((d) => d.deletedAt === null);
  },
});
```

## Audit Export

```typescript
// convex/documents.ts
export const generateAuditExport = action({
  args: {
    orgId: v.id("organizations"),
    category: v.optional(v.string()),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
    dateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.runQuery(internal.documents.listForExport, args);

    const zip = new JSZip();

    // Organize by category
    for (const doc of documents) {
      const folder = zip.folder(doc.category);
      const fileUrl = await ctx.storage.getUrl(doc.storageId);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      folder.file(doc.fileName, blob);
    }

    // Add cover sheet and table of contents
    const coverSheet = generateCoverSheet(documents, args);
    zip.file('00_Cover_Sheet.pdf', coverSheet);

    const toc = generateTableOfContents(documents);
    zip.file('00_Table_of_Contents.pdf', toc);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const storageId = await ctx.storage.store(zipBlob);

    return await ctx.storage.getUrl(storageId);
  },
});
```

## Document Categories

```typescript
const DOCUMENT_CATEGORIES = [
  'licenses',
  'certifications',
  'training_records',
  'audit_reports',
  'policies',
  'insurance',
  'contracts',
  'other',
];
```

## Complexity Tracking

No constitution violations - implements encryption, audit logging, and data integrity requirements.
