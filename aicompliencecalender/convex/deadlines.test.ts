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

describe("deadlines", () => {
  // ===== BASIC CRUD =====

  it("creates and lists deadlines", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Annual License Renewal",
      description: "Renew business license",
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      category: "licenses",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    expect(deadlineId).toBeDefined();

    const deadlines = await asUser.query(api.deadlines.list, { orgId });
    expect(deadlines).toHaveLength(1);
    expect(deadlines[0]).toMatchObject({
      title: "Annual License Renewal",
      category: "licenses",
    });
  });

  it("completes a deadline", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Quarterly Report",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "reporting",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.complete, {
      id: deadlineId,
      userId: "user_123",
    });

    const deadline = await asUser.query(api.deadlines.get, { id: deadlineId });
    expect(deadline?.completedAt).toBeDefined();
    expect(deadline?.completedBy).toBe("user_123");
  });

  it("soft deletes and restores deadlines", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Delete Test",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.softDelete, {
      id: deadlineId,
      userId: "user_123",
    });

    const activeList = await asUser.query(api.deadlines.list, { orgId });
    expect(activeList).toHaveLength(0);

    const trashList = await asUser.query(api.deadlines.trash, { orgId });
    expect(trashList).toHaveLength(1);

    await asUser.mutation(api.deadlines.restore, {
      id: deadlineId,
      userId: "user_123",
    });

    const restoredList = await asUser.query(api.deadlines.list, { orgId });
    expect(restoredList).toHaveLength(1);
  });

  // ===== UPDATE MUTATION =====

  it("updates deadline fields", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Original Title",
      description: "Original description",
      dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
      category: "licenses",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    const newDueDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await asUser.mutation(api.deadlines.update, {
      id: deadlineId,
      title: "Updated Title",
      description: "Updated description",
      dueDate: newDueDate,
      category: "certifications",
      userId: "user_123",
    });

    const updated = await asUser.query(api.deadlines.get, { id: deadlineId });
    expect(updated).toMatchObject({
      title: "Updated Title",
      description: "Updated description",
      dueDate: newDueDate,
      category: "certifications",
    });
  });

  // ===== RECURRING DEADLINES =====

  it("creates next deadline when completing recurring deadline", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const originalDueDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Monthly Report",
      dueDate: originalDueDate,
      category: "reporting",
      recurrence: {
        type: "monthly",
        baseDate: "due_date",
      },
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    // Complete the deadline
    const nextDeadlineId = await asUser.mutation(api.deadlines.complete, {
      id: deadlineId,
      userId: "user_123",
    });

    // Verify next deadline was created
    expect(nextDeadlineId).toBeDefined();
    expect(nextDeadlineId).not.toBe(deadlineId);

    const nextDeadline = await asUser.query(api.deadlines.get, {
      id: nextDeadlineId!,
    });
    expect(nextDeadline).toMatchObject({
      title: "Monthly Report",
      category: "reporting",
    });
    // Next due date should be ~1 month later
    expect(nextDeadline!.dueDate).toBeGreaterThan(originalDueDate);
  });

  it("does not create next deadline for non-recurring", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "One-time Task",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    const result = await asUser.mutation(api.deadlines.complete, {
      id: deadlineId,
      userId: "user_123",
    });

    // No next deadline created
    expect(result).toBeNull();
  });

  // ===== HARD DELETE 30-DAY ENFORCEMENT =====

  it("allows hard delete after 30 days", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    // Create deadline directly with old deletedAt
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const deadlineId = await t.run(async (ctx) => {
      return ctx.db.insert("deadlines", {
        orgId,
        title: "Old Deleted",
        dueDate: Date.now(),
        category: "other",
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        createdBy: "user_123",
        deletedAt: thirtyOneDaysAgo,
      });
    });

    // Should succeed
    await asUser.mutation(api.deadlines.hardDelete, {
      id: deadlineId,
      userId: "user_123",
    });

    const deleted = await asUser.query(api.deadlines.get, { id: deadlineId });
    expect(deleted).toBeNull();
  });

  it("prevents hard delete before 30 days", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Recent Delete",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.softDelete, {
      id: deadlineId,
      userId: "user_123",
    });

    // Should throw error
    await expect(
      asUser.mutation(api.deadlines.hardDelete, {
        id: deadlineId,
        userId: "user_123",
      }),
    ).rejects.toThrow();
  });

  // ===== MULTI-TENANT ISOLATION =====

  it("isolates deadlines between organizations", async () => {
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

    // User 1 creates deadline in org 1
    await user1.mutation(api.deadlines.create, {
      orgId: org1Id,
      title: "Org 1 Deadline",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "licenses",
      createdBy: "user_1",
      scheduleAlerts: false,
    });

    // User 2 creates deadline in org 2
    await user2.mutation(api.deadlines.create, {
      orgId: org2Id,
      title: "Org 2 Deadline",
      dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
      category: "certifications",
      createdBy: "user_2",
      scheduleAlerts: false,
    });

    // Each org should only see their own deadlines when querying their own org
    const org1Deadlines = await user1.query(api.deadlines.list, {
      orgId: org1Id,
    });
    const org2Deadlines = await user2.query(api.deadlines.list, {
      orgId: org2Id,
    });

    expect(org1Deadlines).toHaveLength(1);
    expect(org1Deadlines[0].title).toBe("Org 1 Deadline");

    expect(org2Deadlines).toHaveLength(1);
    expect(org2Deadlines[0].title).toBe("Org 2 Deadline");

    // Data is isolated by orgId - org1's query doesn't include org2's data
    // Note: Authorization (preventing user1 from querying org2) is handled by middleware
    const org1Only = org1Deadlines.filter(
      (d: { orgId: { toString(): string } }) =>
        d.orgId.toString() === org1Id.toString(),
    );
    expect(org1Only).toHaveLength(1);
  });

  // ===== QUERY TESTS =====

  it("filters upcoming deadlines by days", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const now = Date.now();

    // Create deadlines at different times
    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Due in 3 days",
      dueDate: now + 3 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Due in 10 days",
      dueDate: now + 10 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Due in 20 days",
      dueDate: now + 20 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    // Query for 7 days
    const within7Days = await asUser.query(api.deadlines.upcoming, {
      orgId,
      days: 7,
    });
    expect(within7Days).toHaveLength(1);
    expect(within7Days[0].title).toBe("Due in 3 days");

    // Query for 14 days
    const within14Days = await asUser.query(api.deadlines.upcoming, {
      orgId,
      days: 14,
    });
    expect(within14Days).toHaveLength(2);
  });

  it("filters overdue deadlines", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const now = Date.now();

    // Create overdue deadline directly (past due date)
    await t.run(async (ctx) => {
      return ctx.db.insert("deadlines", {
        orgId,
        title: "Overdue Task",
        dueDate: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        category: "licenses",
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        createdBy: "user_123",
      });
    });

    // Create future deadline
    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Future Task",
      dueDate: now + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    const overdue = await asUser.query(api.deadlines.overdue, { orgId });
    expect(overdue).toHaveLength(1);
    expect(overdue[0].title).toBe("Overdue Task");
  });

  it("filters by category", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "License Renewal",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "licenses",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Safety Training",
      dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
      category: "training",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Another License",
      dueDate: Date.now() + 21 * 24 * 60 * 60 * 1000,
      category: "licenses",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    const licenses = await asUser.query(api.deadlines.byCategory, {
      orgId,
      category: "licenses",
    });
    expect(licenses).toHaveLength(2);
    expect(
      licenses.every((d: { category: string }) => d.category === "licenses"),
    ).toBe(true);

    const training = await asUser.query(api.deadlines.byCategory, {
      orgId,
      category: "training",
    });
    expect(training).toHaveLength(1);
    expect(training[0].title).toBe("Safety Training");
  });

  // ===== AUDIT HISTORY =====

  it("tracks audit history for deadline changes", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Audit Test",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    // Update it
    await asUser.mutation(api.deadlines.update, {
      id: deadlineId,
      title: "Updated Audit Test",
      userId: "user_123",
    });

    // Complete it
    await asUser.mutation(api.deadlines.complete, {
      id: deadlineId,
      userId: "user_123",
    });

    const history = await asUser.query(api.deadlines.auditHistory, {
      deadlineId,
    });

    // Should have create, update, and complete entries
    expect(history.length).toBeGreaterThanOrEqual(3);

    const actions = history.map((h: { action: string }) => h.action);
    expect(actions).toContain("created");
    expect(actions).toContain("updated");
    expect(actions).toContain("completed");
  });

  // ===== VALIDATION ERRORS =====

  it("throws error when completing non-existent deadline", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    // Create a fake ID format
    const fakeId = await t.run(async (ctx) => {
      const d = await ctx.db.insert("deadlines", {
        orgId,
        title: "Temp",
        dueDate: Date.now(),
        category: "other",
        createdAt: Date.now(),
        createdBy: "user_123",
      });
      await ctx.db.delete(d);
      return d;
    });

    await expect(
      asUser.mutation(api.deadlines.complete, {
        id: fakeId,
        userId: "user_123",
      }),
    ).rejects.toThrow("Deadline not found");
  });

  it("throws error when completing already completed deadline", async () => {
    const t = convexTest(schema, modules);
    const orgId = await createTestOrg(t);

    const asUser = t.withIdentity({
      subject: "user_123",
      issuer: "https://clerk.test",
    });

    const deadlineId = await asUser.mutation(api.deadlines.create, {
      orgId,
      title: "Complete Twice Test",
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      category: "other",
      createdBy: "user_123",
      scheduleAlerts: false,
    });

    await asUser.mutation(api.deadlines.complete, {
      id: deadlineId,
      userId: "user_123",
    });

    await expect(
      asUser.mutation(api.deadlines.complete, {
        id: deadlineId,
        userId: "user_123",
      }),
    ).rejects.toThrow("Already completed");
  });
});
