import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - import.meta.glob is a Vite feature not recognized by all TS configs
const modules = import.meta.glob("./**/*.ts");

// Helper to create test org
async function createTestOrg(
  t: ReturnType<typeof convexTest>,
  ownerId = "user_123",
) {
  return t.run(async (ctx) => {
    return ctx.db.insert("organizations", {
      name: "Test Org",
      industry: "healthcare",
      ownerId,
      settings: { timezone: "America/New_York" },
      createdAt: Date.now(),
    });
  });
}

// Helper to create a mock storage ID and document directly
async function createTestDocument(
  t: ReturnType<typeof convexTest>,
  orgId: ReturnType<typeof createTestOrg> extends Promise<infer T> ? T : never,
  overrides: Partial<{
    fileName: string;
    fileType: string;
    fileSize: number;
    category: string;
    extractedText: string;
    uploadedBy: string;
    deletedAt: number;
    version: number;
  }> = {},
) {
  return t.run(async (ctx) => {
    // Create a mock storage entry
    const storageId = await ctx.storage.store(new Blob(["test content"]));

    return ctx.db.insert("documents", {
      orgId,
      deadlineIds: [],
      fileName: overrides.fileName ?? "test-doc.pdf",
      fileType: overrides.fileType ?? "pdf",
      fileSize: overrides.fileSize ?? 1024,
      storageId,
      category: (overrides.category ?? "licenses") as
        | "licenses"
        | "certifications"
        | "training_records"
        | "audit_reports"
        | "policies"
        | "insurance"
        | "contracts"
        | "other",
      extractedText: overrides.extractedText,
      version: overrides.version ?? 1,
      uploadedAt: Date.now(),
      uploadedBy: overrides.uploadedBy ?? "user_123",
      lastAccessedAt: Date.now(),
      lastAccessedBy: overrides.uploadedBy ?? "user_123",
      deletedAt: overrides.deletedAt,
    });
  });
}

describe("documents", () => {
  // ===== TASK 8.1: UPLOAD TESTS =====

  describe("upload flow", () => {
    it("saves document with valid inputs", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create storage entry first
      const storageId = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["test pdf content"]));
      });

      const docId = await asUser.mutation(api.documents.saveDocument, {
        orgId,
        storageId,
        fileName: "license-2024.pdf",
        fileType: "pdf",
        fileSize: 1024 * 100, // 100KB
        category: "licenses",
        uploadedBy: "user_123",
      });

      expect(docId).toBeDefined();

      // Verify document was created
      const doc = await asUser.query(api.documents.get, { documentId: docId });
      expect(doc).toMatchObject({
        fileName: "license-2024.pdf",
        fileType: "pdf",
        category: "licenses",
        version: 1,
      });
    });

    it("creates new version when uploading same filename", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // First upload
      const storageId1 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["version 1"]));
      });

      const docId1 = await asUser.mutation(api.documents.saveDocument, {
        orgId,
        storageId: storageId1,
        fileName: "policy.pdf",
        fileType: "pdf",
        fileSize: 1024,
        category: "policies",
        uploadedBy: "user_123",
      });

      // Second upload with same filename
      const storageId2 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["version 2"]));
      });

      const docId2 = await asUser.mutation(api.documents.saveDocument, {
        orgId,
        storageId: storageId2,
        fileName: "policy.pdf",
        fileType: "pdf",
        fileSize: 2048,
        category: "policies",
        uploadedBy: "user_123",
      });

      // Verify version numbers
      const doc1 = await asUser.query(api.documents.get, {
        documentId: docId1,
      });
      const doc2 = await asUser.query(api.documents.get, {
        documentId: docId2,
      });

      expect(doc1?.version).toBe(1);
      expect(doc2?.version).toBe(2);
      expect(doc2?.previousVersionId).toBe(docId1);
    });

    it("rejects invalid file type", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const storageId = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["malicious"]));
      });

      await expect(
        asUser.mutation(api.documents.saveDocument, {
          orgId,
          storageId,
          fileName: "virus.exe",
          fileType: "exe",
          fileSize: 1024,
          category: "other",
          uploadedBy: "user_123",
        }),
      ).rejects.toThrow("Invalid file type");
    });

    it("rejects file exceeding size limit", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const storageId = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["large file"]));
      });

      const fiftyOneMB = 51 * 1024 * 1024;

      await expect(
        asUser.mutation(api.documents.saveDocument, {
          orgId,
          storageId,
          fileName: "huge.pdf",
          fileType: "pdf",
          fileSize: fiftyOneMB,
          category: "other",
          uploadedBy: "user_123",
        }),
      ).rejects.toThrow("File size exceeds");
    });

    it("rejects invalid category", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const storageId = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["test"]));
      });

      await expect(
        asUser.mutation(api.documents.saveDocument, {
          orgId,
          storageId,
          fileName: "test.pdf",
          fileType: "pdf",
          fileSize: 1024,
          category: "invalid_category",
          uploadedBy: "user_123",
        }),
      ).rejects.toThrow("Invalid category");
    });

    it("isolates documents between organizations", async () => {
      const t = convexTest(schema, modules);

      // Create two orgs
      const org1Id = await t.run(async (ctx) => {
        return ctx.db.insert("organizations", {
          name: "Org 1",
          industry: "healthcare",
          ownerId: "user_1",
          settings: {},
          createdAt: Date.now(),
        });
      });

      const org2Id = await t.run(async (ctx) => {
        return ctx.db.insert("organizations", {
          name: "Org 2",
          industry: "finance",
          ownerId: "user_2",
          settings: {},
          createdAt: Date.now(),
        });
      });

      const user1 = t.withIdentity({
        subject: "user_1",
        issuer: "https://clerk.test",
      });
      const user2 = t.withIdentity({
        subject: "user_2",
        issuer: "https://clerk.test",
      });

      // Create doc in org1
      const storageId1 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["org1 doc"]));
      });

      await user1.mutation(api.documents.saveDocument, {
        orgId: org1Id,
        storageId: storageId1,
        fileName: "org1-doc.pdf",
        fileType: "pdf",
        fileSize: 1024,
        category: "licenses",
        uploadedBy: "user_1",
      });

      // Create doc in org2
      const storageId2 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["org2 doc"]));
      });

      await user2.mutation(api.documents.saveDocument, {
        orgId: org2Id,
        storageId: storageId2,
        fileName: "org2-doc.pdf",
        fileType: "pdf",
        fileSize: 1024,
        category: "certifications",
        uploadedBy: "user_2",
      });

      // Each org should only see their own docs
      const org1Docs = await user1.query(api.documents.list, { orgId: org1Id });
      const org2Docs = await user2.query(api.documents.list, { orgId: org2Id });

      expect(org1Docs).toHaveLength(1);
      expect(org1Docs[0].fileName).toBe("org1-doc.pdf");

      expect(org2Docs).toHaveLength(1);
      expect(org2Docs[0].fileName).toBe("org2-doc.pdf");
    });
  });

  // ===== TASK 8.2: SEARCH TESTS =====

  describe("search", () => {
    it("finds documents by text content", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create document with extracted text directly
      await createTestDocument(t, orgId, {
        fileName: "hipaa-training.pdf",
        category: "training_records",
        extractedText:
          "HIPAA compliance training certificate for healthcare workers",
      });

      await createTestDocument(t, orgId, {
        fileName: "safety-manual.pdf",
        category: "policies",
        extractedText: "Workplace safety guidelines and procedures",
      });

      // Search for HIPAA
      const results = await asUser.query(api.documents.search, {
        orgId,
        query: "HIPAA",
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("hipaa-training.pdf");
    });

    it("filters search by category", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await createTestDocument(t, orgId, {
        fileName: "license-renewal.pdf",
        category: "licenses",
        extractedText: "Business license renewal document for 2024",
      });

      await createTestDocument(t, orgId, {
        fileName: "cert-renewal.pdf",
        category: "certifications",
        extractedText: "Professional certification renewal document for 2024",
      });

      // Search "renewal" but filter to licenses only
      const results = await asUser.query(api.documents.search, {
        orgId,
        query: "renewal",
        category: "licenses",
      });

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("licenses");
    });

    it("filters search by date range", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const now = Date.now();
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      // Create old document directly
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["old"]));
        return ctx.db.insert("documents", {
          orgId,
          deadlineIds: [],
          fileName: "old-report.pdf",
          fileType: "pdf",
          fileSize: 1024,
          storageId,
          category: "audit_reports",
          extractedText: "Audit report from last month",
          version: 1,
          uploadedAt: thirtyDaysAgo,
          uploadedBy: "user_123",
          lastAccessedAt: thirtyDaysAgo,
          lastAccessedBy: "user_123",
        });
      });

      // Create recent document
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["new"]));
        return ctx.db.insert("documents", {
          orgId,
          deadlineIds: [],
          fileName: "new-report.pdf",
          fileType: "pdf",
          fileSize: 1024,
          storageId,
          category: "audit_reports",
          extractedText: "Audit report from this week",
          version: 1,
          uploadedAt: now,
          uploadedBy: "user_123",
          lastAccessedAt: now,
          lastAccessedBy: "user_123",
        });
      });

      // Search within last 14 days
      const results = await asUser.query(api.documents.search, {
        orgId,
        query: "audit report",
        dateFrom: tenDaysAgo,
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("new-report.pdf");
    });

    it("returns empty results for no matches", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await createTestDocument(t, orgId, {
        extractedText: "This is about healthcare compliance",
      });

      const results = await asUser.query(api.documents.search, {
        orgId,
        query: "cryptocurrency blockchain",
      });

      expect(results).toHaveLength(0);
    });

    it("isolates search results by organization", async () => {
      const t = convexTest(schema, modules);

      const org1Id = await t.run(async (ctx) => {
        return ctx.db.insert("organizations", {
          name: "Org 1",
          industry: "healthcare",
          ownerId: "user_1",
          settings: {},
          createdAt: Date.now(),
        });
      });

      const org2Id = await t.run(async (ctx) => {
        return ctx.db.insert("organizations", {
          name: "Org 2",
          industry: "finance",
          ownerId: "user_2",
          settings: {},
          createdAt: Date.now(),
        });
      });

      // Create doc in org1 with "confidential" text
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["org1"]));
        return ctx.db.insert("documents", {
          orgId: org1Id,
          deadlineIds: [],
          fileName: "org1-secret.pdf",
          fileType: "pdf",
          fileSize: 1024,
          storageId,
          category: "policies",
          extractedText: "Confidential org1 data",
          version: 1,
          uploadedAt: Date.now(),
          uploadedBy: "user_1",
          lastAccessedAt: Date.now(),
          lastAccessedBy: "user_1",
        });
      });

      // Create doc in org2 with "confidential" text
      await t.run(async (ctx) => {
        const storageId = await ctx.storage.store(new Blob(["org2"]));
        return ctx.db.insert("documents", {
          orgId: org2Id,
          deadlineIds: [],
          fileName: "org2-secret.pdf",
          fileType: "pdf",
          fileSize: 1024,
          storageId,
          category: "policies",
          extractedText: "Confidential org2 data",
          version: 1,
          uploadedAt: Date.now(),
          uploadedBy: "user_2",
          lastAccessedAt: Date.now(),
          lastAccessedBy: "user_2",
        });
      });

      const user1 = t.withIdentity({
        subject: "user_1",
        issuer: "https://clerk.test",
      });

      // User1 searching "confidential" should only find org1's doc
      const results = await user1.query(api.documents.search, {
        orgId: org1Id,
        query: "confidential",
      });

      expect(results).toHaveLength(1);
      expect(results[0].fileName).toBe("org1-secret.pdf");
    });
  });

  // ===== SOFT DELETE & RESTORE =====

  describe("soft delete and restore", () => {
    it("soft deletes document", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.documents.softDelete, {
        documentId: docId,
        userId: "user_123",
      });

      // Should not appear in normal list
      const activeList = await asUser.query(api.documents.list, { orgId });
      expect(activeList).toHaveLength(0);

      // Should appear in deleted list
      const deletedList = await asUser.query(api.documents.listDeleted, {
        orgId,
      });
      expect(deletedList).toHaveLength(1);
    });

    it("restores soft-deleted document", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Delete then restore
      await asUser.mutation(api.documents.softDelete, {
        documentId: docId,
        userId: "user_123",
      });

      await asUser.mutation(api.documents.restore, {
        documentId: docId,
        userId: "user_123",
      });

      // Should appear in active list again
      const activeList = await asUser.query(api.documents.list, { orgId });
      expect(activeList).toHaveLength(1);
    });

    it("prevents restoring non-deleted document", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await expect(
        asUser.mutation(api.documents.restore, {
          documentId: docId,
          userId: "user_123",
        }),
      ).rejects.toThrow("not deleted");
    });
  });

  // ===== HARD DELETE 30-DAY ENFORCEMENT =====

  describe("hard delete", () => {
    it("allows hard delete after 30 days", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create document with old deletedAt
      const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const docId = await createTestDocument(t, orgId, {
        deletedAt: thirtyOneDaysAgo,
      });

      // Should succeed
      await asUser.mutation(api.documents.hardDelete, {
        documentId: docId,
        userId: "user_123",
      });

      const doc = await asUser.query(api.documents.get, { documentId: docId });
      expect(doc).toBeNull();
    });

    it("prevents hard delete before 30 days", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Soft delete first
      await asUser.mutation(api.documents.softDelete, {
        documentId: docId,
        userId: "user_123",
      });

      // Hard delete should fail (not 30 days yet)
      await expect(
        asUser.mutation(api.documents.hardDelete, {
          documentId: docId,
          userId: "user_123",
        }),
      ).rejects.toThrow("30 days");
    });

    it("requires soft delete before hard delete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await expect(
        asUser.mutation(api.documents.hardDelete, {
          documentId: docId,
          userId: "user_123",
        }),
      ).rejects.toThrow("soft-deleted first");
    });
  });

  // ===== LIST QUERY =====

  describe("list query", () => {
    it("filters by category", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      await createTestDocument(t, orgId, {
        fileName: "license1.pdf",
        category: "licenses",
      });
      await createTestDocument(t, orgId, {
        fileName: "cert1.pdf",
        category: "certifications",
      });
      await createTestDocument(t, orgId, {
        fileName: "license2.pdf",
        category: "licenses",
      });

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const licenses = await asUser.query(api.documents.list, {
        orgId,
        category: "licenses",
      });

      expect(licenses).toHaveLength(2);
      expect(
        licenses.every((d: { category: string }) => d.category === "licenses"),
      ).toBe(true);
    });

    it("excludes soft-deleted by default", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      await createTestDocument(t, orgId, { fileName: "active.pdf" });
      await createTestDocument(t, orgId, {
        fileName: "deleted.pdf",
        deletedAt: Date.now(),
      });

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const docs = await asUser.query(api.documents.list, { orgId });
      expect(docs).toHaveLength(1);
      expect(docs[0].fileName).toBe("active.pdf");
    });
  });

  // ===== VERSION HISTORY =====

  describe("version history", () => {
    it("retrieves version chain", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create version 1
      const storageId1 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["v1"]));
      });

      const docId1 = await asUser.mutation(api.documents.saveDocument, {
        orgId,
        storageId: storageId1,
        fileName: "versioned.pdf",
        fileType: "pdf",
        fileSize: 1024,
        category: "policies",
        uploadedBy: "user_123",
      });

      // Create version 2
      const storageId2 = await t.run(async (ctx) => {
        return ctx.storage.store(new Blob(["v2"]));
      });

      const docId2 = await asUser.mutation(api.documents.saveDocument, {
        orgId,
        storageId: storageId2,
        fileName: "versioned.pdf",
        fileType: "pdf",
        fileSize: 2048,
        category: "policies",
        uploadedBy: "user_123",
      });

      // Get version history starting from latest
      const history = await asUser.query(api.documents.getVersionHistory, {
        documentId: docId2,
      });

      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(2);
      expect(history[1].version).toBe(1);
    });
  });

  // ===== ACCESS LOGGING =====

  describe("access logging", () => {
    it("logs document access", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);
      const docId = await createTestDocument(t, orgId);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Log a view
      await asUser.mutation(api.documents.logAccess, {
        documentId: docId,
        userId: "user_123",
        action: "view",
      });

      // Log a download
      await asUser.mutation(api.documents.logAccess, {
        documentId: docId,
        userId: "user_123",
        action: "download",
      });

      const logs = await asUser.query(api.documents.getAccessLog, {
        documentId: docId,
      });

      // Should have at least 2 logs (view + download)
      // Plus the original "update" log from document creation
      expect(logs.length).toBeGreaterThanOrEqual(2);

      const actions = logs.map((l: { action: string }) => l.action);
      expect(actions).toContain("view");
      expect(actions).toContain("download");
    });
  });
});
