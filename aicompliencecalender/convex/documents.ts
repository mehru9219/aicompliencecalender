import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

// ============ CONSTANTS ============

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ["pdf", "docx", "xlsx", "jpg", "jpeg", "png"];
const MAX_EXTRACTED_TEXT_LENGTH = 100000;

const DOCUMENT_CATEGORIES = [
  "licenses",
  "certifications",
  "training_records",
  "audit_reports",
  "policies",
  "insurance",
  "contracts",
  "other",
] as const;

type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

// ============ HELPER FUNCTIONS ============

function isValidCategory(category: string): category is DocumentCategory {
  return DOCUMENT_CATEGORIES.includes(category as DocumentCategory);
}

// ============ QUERIES ============

/** Get a single document by ID */
export const get = query({
  args: { documentId: v.id("documents") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.deletedAt) return null;
    return doc;
  },
});

/** Get document with download URL */
export const getWithUrl = query({
  args: { documentId: v.id("documents") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.deletedAt) return null;

    const downloadUrl = await ctx.storage.getUrl(doc.storageId);
    return { ...doc, downloadUrl };
  },
});

/** List documents for an organization */
export const list = query({
  args: {
    orgId: v.id("organizations"),
    category: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
    includeDeleted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let docs;

    if (args.category && isValidCategory(args.category)) {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_org_category", (q) =>
          q
            .eq("orgId", args.orgId)
            .eq("category", args.category as DocumentCategory),
        )
        .order("desc")
        .collect();
    } else {
      docs = await ctx.db
        .query("documents")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .order("desc")
        .collect();
    }

    // Filter by deadline if provided
    if (args.deadlineId) {
      const deadlineId = args.deadlineId;
      docs = docs.filter((d) => d.deadlineIds.includes(deadlineId));
    }

    // Filter deleted unless explicitly included
    if (!args.includeDeleted) {
      docs = docs.filter((d) => !d.deletedAt);
    }

    // Apply limit
    if (args.limit) {
      docs = docs.slice(0, args.limit);
    }

    return docs;
  },
});

/** List deleted documents (trash) */
export const listDeleted = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.neq(q.field("deletedAt"), undefined))
      .order("desc")
      .take(args.limit ?? 100);

    return docs;
  },
});

/** Get version history for a document */
export const getVersionHistory = query({
  args: { documentId: v.id("documents") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const versions: any[] = [];
    let currentId: Id<"documents"> | undefined = args.documentId;

    while (currentId) {
      const document = await ctx.db.get(currentId);
      if (!document) break;
      versions.push(document);
      currentId = document.previousVersionId as Id<"documents"> | undefined;
    }

    return versions;
  },
});

/** Get document access log */
export const getAccessLog = query({
  args: {
    documentId: v.id("documents"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("document_access_log")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

/** Full-text search across document content */
export const search = query({
  args: {
    orgId: v.id("organizations"),
    query: v.string(),
    category: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    // Use Convex search index
    let results = await ctx.db
      .query("documents")
      .withSearchIndex("search_text", (q) => {
        let search = q.search("extractedText", args.query);
        // Filter by org
        search = search.eq("orgId", args.orgId);
        // Filter by category if provided
        if (args.category && isValidCategory(args.category)) {
          search = search.eq("category", args.category as DocumentCategory);
        }
        return search;
      })
      .take(args.limit ?? 50);

    // Filter out soft-deleted documents
    results = results.filter((doc) => !doc.deletedAt);

    // Filter by deadline if provided
    if (args.deadlineId) {
      const deadlineId = args.deadlineId;
      results = results.filter((doc) => doc.deadlineIds.includes(deadlineId));
    }

    // Filter by date range if provided
    if (args.dateFrom !== undefined) {
      results = results.filter((doc) => doc.uploadedAt >= args.dateFrom!);
    }
    if (args.dateTo !== undefined) {
      results = results.filter((doc) => doc.uploadedAt <= args.dateTo!);
    }

    return results;
  },
});

// ============ PLAN LIMITS ============

// Plan storage limits in GB
const PLAN_STORAGE_LIMITS = {
  starter: 1,
  professional: 10,
  business: 50,
} as const;

type PlanId = keyof typeof PLAN_STORAGE_LIMITS;

const BYTES_PER_GB = 1024 * 1024 * 1024;

/** Helper to check storage limit within mutation */
async function checkStorageLimit(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  additionalBytes: number,
): Promise<{ allowed: boolean; limitGb: number; currentGb: number }> {
  // Get subscription
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .first();

  const planId: PlanId = (subscription?.plan as PlanId) || "professional";
  const limitGb = PLAN_STORAGE_LIMITS[planId];

  // Get current storage usage
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_org_month", (q) =>
      q.eq("orgId", orgId).eq("month", currentMonth),
    )
    .first();

  const currentBytes = usage?.storageUsedBytes || 0;
  const currentGb = currentBytes / BYTES_PER_GB;
  const newTotalGb = (currentBytes + additionalBytes) / BYTES_PER_GB;

  return { allowed: newTotalGb <= limitGb, limitGb, currentGb };
}

/** Helper to increment storage usage */
async function incrementStorageUsage(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  bytes: number,
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_org_month", (q) =>
      q.eq("orgId", orgId).eq("month", currentMonth),
    )
    .first();

  if (!usage) {
    await ctx.db.insert("usage", {
      orgId,
      month: currentMonth,
      deadlinesCreated: 0,
      documentsUploaded: 1,
      storageUsedBytes: bytes,
      formPreFills: 0,
      alertsSent: 0,
    });
  } else {
    await ctx.db.patch(usage._id, {
      documentsUploaded: (usage.documentsUploaded || 0) + 1,
      storageUsedBytes: (usage.storageUsedBytes || 0) + bytes,
    });
  }
}

// ============ MUTATIONS ============

/** Generate upload URL for Convex storage */
export const generateUploadUrl = mutation({
  args: { orgId: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/** Save document metadata after upload */
export const saveDocument = mutation({
  args: {
    orgId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: v.string(),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
    uploadedBy: v.string(),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check storage limit before saving
    const storageCheck = await checkStorageLimit(
      ctx,
      args.orgId,
      args.fileSize,
    );
    if (!storageCheck.allowed) {
      throw new ConvexError({
        code: "LIMIT_EXCEEDED",
        message: `You have reached your plan storage limit of ${storageCheck.limitGb}GB. Upgrade your plan for more storage.`,
        currentGb: storageCheck.currentGb.toFixed(2),
        limitGb: storageCheck.limitGb,
      });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(args.fileType.toLowerCase())) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`,
      );
    }

    // Validate file size
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Validate category
    if (!isValidCategory(args.category)) {
      throw new Error(
        `Invalid category. Allowed: ${DOCUMENT_CATEGORIES.join(", ")}`,
      );
    }

    // Check for existing document with same name (for versioning)
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_org_filename", (q) =>
        q.eq("orgId", args.orgId).eq("fileName", args.fileName),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .first();

    const version = existing ? existing.version + 1 : 1;

    // Create document record
    const docId = await ctx.db.insert("documents", {
      orgId: args.orgId,
      deadlineIds: args.deadlineIds ?? [],
      fileName: args.fileName,
      fileType: args.fileType.toLowerCase(),
      fileSize: args.fileSize,
      storageId: args.storageId,
      category: args.category as DocumentCategory,
      version,
      previousVersionId: existing?._id,
      uploadedAt: now,
      uploadedBy: args.uploadedBy,
      lastAccessedAt: now,
      lastAccessedBy: args.uploadedBy,
    });

    // Increment storage usage
    await incrementStorageUsage(ctx, args.orgId, args.fileSize);

    // Log access
    await ctx.db.insert("document_access_log", {
      documentId: docId,
      orgId: args.orgId,
      userId: args.uploadedBy,
      action: "update",
      timestamp: now,
    });

    // Schedule text extraction
    await ctx.scheduler.runAfter(0, internal.documents.extractText, { docId });

    return docId;
  },
});

/** Update document metadata */
export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    category: v.optional(v.string()),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (doc.deletedAt) {
      throw new Error("Cannot update deleted document");
    }

    const updates: Record<string, unknown> = {
      lastAccessedAt: Date.now(),
      lastAccessedBy: args.userId,
    };

    if (args.category !== undefined) {
      if (!isValidCategory(args.category)) {
        throw new Error(
          `Invalid category. Allowed: ${DOCUMENT_CATEGORIES.join(", ")}`,
        );
      }
      updates.category = args.category;
    }

    if (args.deadlineIds !== undefined) {
      updates.deadlineIds = args.deadlineIds;
    }

    await ctx.db.patch(args.documentId, updates);

    // Log access
    await ctx.db.insert("document_access_log", {
      documentId: args.documentId,
      orgId: doc.orgId,
      userId: args.userId,
      action: "update",
      timestamp: Date.now(),
    });

    return null;
  },
});

/** Soft delete a document */
export const softDelete = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (doc.deletedAt) {
      throw new Error("Document already deleted");
    }

    const now = Date.now();

    await ctx.db.patch(args.documentId, {
      deletedAt: now,
      lastAccessedAt: now,
      lastAccessedBy: args.userId,
    });

    // Log deletion
    await ctx.db.insert("document_access_log", {
      documentId: args.documentId,
      orgId: doc.orgId,
      userId: args.userId,
      action: "delete",
      timestamp: now,
    });

    return null;
  },
});

/** Restore a soft-deleted document */
export const restore = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (!doc.deletedAt) {
      throw new Error("Document is not deleted");
    }

    const now = Date.now();

    await ctx.db.patch(args.documentId, {
      deletedAt: undefined,
      lastAccessedAt: now,
      lastAccessedBy: args.userId,
    });

    return null;
  },
});

/** Permanently delete a document (only if soft-deleted > 30 days) */
export const hardDelete = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }
    if (!doc.deletedAt) {
      throw new Error("Document must be soft-deleted first");
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (doc.deletedAt > thirtyDaysAgo) {
      throw new Error(
        "Document must be in trash for 30 days before permanent deletion",
      );
    }

    // Delete from storage
    await ctx.storage.delete(doc.storageId);

    // Delete access logs
    const logs = await ctx.db
      .query("document_access_log")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete document record
    await ctx.db.delete(args.documentId);

    return null;
  },
});

/** Log document view access */
export const logAccess = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("download"),
      v.literal("update"),
      v.literal("delete"),
    ),
    ipAddress: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }

    const now = Date.now();

    // Update last accessed
    await ctx.db.patch(args.documentId, {
      lastAccessedAt: now,
      lastAccessedBy: args.userId,
    });

    // Log access
    await ctx.db.insert("document_access_log", {
      documentId: args.documentId,
      orgId: doc.orgId,
      userId: args.userId,
      action: args.action,
      timestamp: now,
      ipAddress: args.ipAddress,
    });

    return null;
  },
});

// ============ INTERNAL FUNCTIONS ============

/** Internal query to get document */
export const getInternal = internalQuery({
  args: { docId: v.id("documents") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.docId);
  },
});

/** Update extracted text */
export const updateExtractedText = internalMutation({
  args: {
    docId: v.id("documents"),
    extractedText: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      extractedText: args.extractedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
    });
    return null;
  },
});

/** Extract text from PDF using pdf-parse */
async function extractPdfText(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // Dynamic import of pdf-parse (v2 uses PDFParse class)
  const { PDFParse } = await import("pdf-parse");
  const pdfParse = new PDFParse({
    data: new Uint8Array(arrayBuffer),
  });
  const textResult = await pdfParse.getText();

  return textResult.text || "";
}

/** Extract text from image using Claude Vision API */
async function extractImageText(
  fileUrl: string,
  fileType: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const mediaTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  const mediaType = mediaTypeMap[fileType.toLowerCase()];
  if (!mediaType) {
    throw new Error(`Unsupported image type: ${fileType}`);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: fileUrl,
              },
            },
            {
              type: "text",
              text: "Extract all text from this document image. Return only the extracted text content, preserving the original structure and formatting as much as possible. If the image contains no text, return an empty string.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === "text",
  );
  return textContent?.text || "";
}

/** Extract text from document (scheduled action) */
export const extractText = internalAction({
  args: { docId: v.id("documents") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    try {
      const doc = await ctx.runQuery(internal.documents.getInternal, {
        docId: args.docId,
      });

      if (!doc) {
        console.error(`Document ${args.docId} not found for text extraction`);
        return null;
      }

      const fileUrl = await ctx.storage.getUrl(doc.storageId);
      if (!fileUrl) {
        console.error(`Could not get URL for document ${args.docId}`);
        return null;
      }

      let extractedText = "";

      if (doc.fileType === "pdf") {
        // Extract text from PDF
        try {
          extractedText = await extractPdfText(fileUrl);

          // If PDF has very little text, it might be scanned - try OCR
          if (extractedText.trim().length < 50) {
            console.log(
              `PDF ${doc.fileName} appears to be scanned, attempting OCR is not supported for PDFs`,
            );
          }
        } catch (error) {
          console.error(`PDF extraction failed for ${doc.fileName}:`, error);
          extractedText = `[PDF text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
        }
      } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(doc.fileType)) {
        // Extract text from image using Claude Vision
        try {
          extractedText = await extractImageText(fileUrl, doc.fileType);
        } catch (error) {
          console.error(`Image OCR failed for ${doc.fileName}:`, error);
          extractedText = `[Image OCR failed: ${error instanceof Error ? error.message : "Unknown error"}]`;
        }
      } else if (doc.fileType === "docx") {
        // DOCX extraction - placeholder for now, would need mammoth.js
        extractedText = `[DOCX text extraction not yet implemented for: ${doc.fileName}]`;
      } else if (doc.fileType === "xlsx") {
        // XLSX extraction - placeholder
        extractedText = `[XLSX text extraction not yet implemented for: ${doc.fileName}]`;
      }

      if (extractedText) {
        await ctx.runMutation(internal.documents.updateExtractedText, {
          docId: args.docId,
          extractedText,
        });
      }
    } catch (error) {
      console.error(
        `Text extraction failed for document ${args.docId}:`,
        error,
      );
    }

    return null;
  },
});

/** Purge documents deleted more than 30 days ago (called by cron) */
export const purgeOldDeletedDocuments = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Find all documents deleted > 30 days ago
    const oldDocs = await ctx.db
      .query("documents")
      .filter((q) =>
        q.and(
          q.neq(q.field("deletedAt"), undefined),
          q.lt(q.field("deletedAt"), thirtyDaysAgo),
        ),
      )
      .collect();

    let purgedCount = 0;

    for (const doc of oldDocs) {
      try {
        // Delete from storage
        await ctx.storage.delete(doc.storageId);

        // Delete access logs
        const logs = await ctx.db
          .query("document_access_log")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .collect();

        for (const log of logs) {
          await ctx.db.delete(log._id);
        }

        // Delete document
        await ctx.db.delete(doc._id);
        purgedCount++;
      } catch (error) {
        console.error(`Failed to purge document ${doc._id}:`, error);
      }
    }

    return purgedCount;
  },
});

// ============ PUBLIC ACTIONS ============

/** Generate audit-ready ZIP export of documents */
export const generateAuditExport = action({
  args: {
    orgId: v.id("organizations"),
    categories: v.optional(v.array(v.string())),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    downloadUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    documentCount: v.optional(v.number()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    error?: string;
    documentCount?: number;
  }> => {
    try {
      // Dynamic import of JSZip
      const JSZip = (await import("jszip")).default;

      // Get all documents for the organization
      const allDocs = await ctx.runQuery(internal.documents.listForExport, {
        orgId: args.orgId,
      });

      // Filter by categories if specified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filteredDocs: any[] = allDocs;
      if (args.categories && args.categories.length > 0) {
        filteredDocs = filteredDocs.filter((doc: { category: string }) =>
          args.categories!.includes(doc.category),
        );
      }

      // Filter by date range
      if (args.dateFrom) {
        filteredDocs = filteredDocs.filter(
          (doc: { uploadedAt: number }) => doc.uploadedAt >= args.dateFrom!,
        );
      }
      if (args.dateTo) {
        filteredDocs = filteredDocs.filter(
          (doc: { uploadedAt: number }) => doc.uploadedAt <= args.dateTo!,
        );
      }

      if (filteredDocs.length === 0) {
        return {
          success: false,
          error: "No documents match the specified criteria",
        };
      }

      // Create ZIP file
      const zip = new JSZip();

      // Group documents by category
      const docsByCategory: Record<string, typeof filteredDocs> = {};
      for (const doc of filteredDocs) {
        if (!docsByCategory[doc.category]) {
          docsByCategory[doc.category] = [];
        }
        docsByCategory[doc.category].push(doc);
      }

      // Add documents to ZIP, organized by category
      for (const [category, docs] of Object.entries(docsByCategory)) {
        const folder = zip.folder(category);
        if (!folder) continue;

        for (const doc of docs) {
          try {
            const fileUrl = await ctx.storage.getUrl(doc.storageId);
            if (!fileUrl) continue;

            const response = await fetch(fileUrl);
            if (!response.ok) continue;

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            folder.file(doc.fileName, arrayBuffer);
          } catch (error) {
            console.error(`Failed to add ${doc.fileName} to ZIP:`, error);
          }
        }
      }

      // Generate cover sheet content
      const coverSheet = generateCoverSheet(args, filteredDocs);
      zip.file("_COVER_SHEET.txt", coverSheet);

      // Generate table of contents
      const tableOfContents = generateTableOfContents(docsByCategory);
      zip.file("_TABLE_OF_CONTENTS.txt", tableOfContents);

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const arrayBuffer = await zipBlob.arrayBuffer();

      // Upload ZIP to Convex storage
      const storageId = await ctx.storage.store(
        new Blob([arrayBuffer], { type: "application/zip" }),
      );

      // Get download URL
      const downloadUrl = await ctx.storage.getUrl(storageId);
      if (!downloadUrl) {
        return {
          success: false,
          error: "Failed to get download URL for export",
        };
      }

      return {
        success: true,
        downloadUrl,
        documentCount: filteredDocs.length,
      };
    } catch (error) {
      console.error("Audit export failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  },
});

/** Internal query to list documents for export */
export const listForExport = internalQuery({
  args: { orgId: v.id("organizations") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/** Generate cover sheet content for audit export */
function generateCoverSheet(
  args: {
    orgId: Id<"organizations">;
    categories?: string[];
    dateFrom?: number;
    dateTo?: number;
  },
  docs: Array<{ uploadedAt: number }>,
): string {
  const now = new Date();
  const dateRange =
    args.dateFrom && args.dateTo
      ? `${new Date(args.dateFrom).toLocaleDateString()} - ${new Date(args.dateTo).toLocaleDateString()}`
      : args.dateFrom
        ? `From ${new Date(args.dateFrom).toLocaleDateString()}`
        : args.dateTo
          ? `Until ${new Date(args.dateTo).toLocaleDateString()}`
          : "All dates";

  return `
================================================================================
                           AUDIT EXPORT COVER SHEET
================================================================================

Export Date:        ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}
Organization ID:    ${args.orgId}

--------------------------------------------------------------------------------
EXPORT CRITERIA
--------------------------------------------------------------------------------
Categories:         ${args.categories?.join(", ") || "All categories"}
Date Range:         ${dateRange}
Document Count:     ${docs.length}

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------
This export was automatically generated by the AI Compliance Calendar system.
All documents have been organized by category in separate folders.

For questions about this export, contact your system administrator.

================================================================================
`.trim();
}

/** Generate table of contents for audit export */
function generateTableOfContents(
  docsByCategory: Record<
    string,
    Array<{ fileName: string; uploadedAt: number }>
  >,
): string {
  let content = `
================================================================================
                             TABLE OF CONTENTS
================================================================================

`;

  for (const [category, docs] of Object.entries(docsByCategory)) {
    content += `
${category.toUpperCase()}
${"=".repeat(category.length)}

`;
    for (const doc of docs) {
      const date = new Date(doc.uploadedAt).toLocaleDateString();
      content += `  - ${doc.fileName} (${date})\n`;
    }
    content += "\n";
  }

  return content.trim();
}
