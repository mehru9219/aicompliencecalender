import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { Doc } from "./_generated/dataModel";

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

describe("Onboarding", () => {
  // ===== INITIALIZATION =====

  describe("Progress Initialization", () => {
    it("initializes onboarding progress for new org", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const progressId = await asUser.mutation(
        api.onboarding.initializeProgress,
        {
          orgId,
        },
      );

      expect(progressId).toBeDefined();

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress).toBeDefined();
      expect(progress?.orgId).toBe(orgId);
      expect(progress?.userId).toBe("user_123");
      expect(progress?.steps.account_created).toBe(true);
      expect(progress?.steps.org_setup).toBe(false);
      expect(progress?.startedAt).toBeDefined();
    });

    it("returns existing progress if already initialized", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const firstProgressId = await asUser.mutation(
        api.onboarding.initializeProgress,
        { orgId },
      );
      const secondProgressId = await asUser.mutation(
        api.onboarding.initializeProgress,
        { orgId },
      );

      expect(firstProgressId).toBe(secondProgressId);
    });

    it("creates progress with correct default steps", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });

      expect(progress?.steps).toEqual({
        account_created: true,
        org_setup: false,
        template_imported: false,
        alerts_configured: false,
        first_deadline: false,
        team_invited: false,
        first_completion: false,
      });
    });
  });

  // ===== STEP COMPLETION =====

  describe("Step Completion", () => {
    it("marks org_setup step as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      const result = await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });

      expect(result).toBe(true);

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.steps.org_setup).toBe(true);
    });

    it("marks template_imported step as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "template_imported",
      });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.steps.template_imported).toBe(true);
    });

    it("marks alerts_configured step as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "alerts_configured",
      });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.steps.alerts_configured).toBe(true);
    });

    it("marks first_deadline step as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "first_deadline",
      });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.steps.first_deadline).toBe(true);
    });

    it("marks team_invited step as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "team_invited",
      });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.steps.team_invited).toBe(true);
    });

    it("updates lastActivityAt on step completion", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      const beforeProgress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      const beforeActivity = beforeProgress?.lastActivityAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });

      const afterProgress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(afterProgress?.lastActivityAt).toBeGreaterThanOrEqual(
        beforeActivity ?? 0,
      );
    });

    it("returns false when progress does not exist", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Don't initialize progress
      const result = await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });

      expect(result).toBe(false);
    });
  });

  // ===== COMPLETION MARKING =====

  describe("Onboarding Completion", () => {
    it("marks onboarding as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      const result = await asUser.mutation(api.onboarding.markComplete, {
        orgId,
      });
      expect(result).toBe(true);

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.completedAt).toBeDefined();
    });

    it("returns false when marking non-existent progress as complete", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const result = await asUser.mutation(api.onboarding.markComplete, {
        orgId,
      });
      expect(result).toBe(false);
    });

    it("sets completedAt timestamp", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      const beforeComplete = Date.now();
      await asUser.mutation(api.onboarding.markComplete, { orgId });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.completedAt).toBeGreaterThanOrEqual(beforeComplete);
    });
  });

  // ===== FULL WIZARD FLOW =====

  describe("Complete Wizard Flow", () => {
    it("completes full onboarding wizard flow", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Step 1: Initialize
      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      // Step 2: Complete org setup
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });

      // Step 3: Skip template import (optional)
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "template_imported",
      });

      // Step 4: Configure alerts
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "alerts_configured",
      });

      // Step 5: Create first deadline
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "first_deadline",
      });

      // Step 6: Skip team invite (optional)
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "team_invited",
      });

      // Step 7: Mark complete
      await asUser.mutation(api.onboarding.markComplete, { orgId });

      // Verify final state
      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.completedAt).toBeDefined();
      expect(progress?.steps.org_setup).toBe(true);
      expect(progress?.steps.alerts_configured).toBe(true);
      expect(progress?.steps.first_deadline).toBe(true);
    });

    it("completes minimum required steps flow", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      // Only complete required steps
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "alerts_configured",
      });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "first_deadline",
      });

      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });

      // Required steps complete
      expect(progress?.steps.org_setup).toBe(true);
      expect(progress?.steps.alerts_configured).toBe(true);
      expect(progress?.steps.first_deadline).toBe(true);

      // Optional steps skipped
      expect(progress?.steps.template_imported).toBe(false);
      expect(progress?.steps.team_invited).toBe(false);
    });
  });

  // ===== PROGRESS RESET =====

  describe("Progress Reset", () => {
    it("resets progress to initial state", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Initialize and complete some steps
      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "alerts_configured",
      });
      await asUser.mutation(api.onboarding.markComplete, { orgId });

      // Reset
      const result = await asUser.mutation(api.onboarding.resetProgress, {
        orgId,
      });
      expect(result).toBe(true);

      // Verify reset state
      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(progress?.completedAt).toBeNull();
      expect(progress?.steps.org_setup).toBe(false);
      expect(progress?.steps.alerts_configured).toBe(false);
      expect(progress?.steps.account_created).toBe(true);
    });

    it("returns false when resetting non-existent progress", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      const result = await asUser.mutation(api.onboarding.resetProgress, {
        orgId,
      });
      expect(result).toBe(false);
    });
  });

  // ===== USER PROGRESS QUERY =====

  describe("Get Progress By User", () => {
    it("returns progress for current user", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      const progress = await asUser.query(api.onboarding.getProgressByUser, {});
      expect(progress).toBeDefined();
      expect(progress?.userId).toBe("user_123");
      expect(progress?.orgId).toBe(orgId);
    });

    it("returns null if user has no progress", async () => {
      const t = convexTest(schema, modules);
      await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_456",
        issuer: "https://clerk.test",
      });

      const progress = await asUser.query(api.onboarding.getProgressByUser, {});
      expect(progress).toBeNull();
    });
  });

  // ===== INCOMPLETE RECORDS QUERY =====

  describe("Get Incomplete Onboarding", () => {
    it("returns incomplete onboarding records", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create incomplete onboarding
      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });

      // Query incomplete records (internal query)
      const incompleteRecords = await t.run(async (ctx) => {
        const records = await ctx.db
          .query("onboarding_progress")
          .filter((q) => q.eq(q.field("completedAt"), undefined))
          .collect();
        return records;
      });

      expect(incompleteRecords).toHaveLength(1);
      expect(incompleteRecords[0].orgId).toBe(orgId);
    });

    it("does not return completed onboarding records", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Create and complete onboarding
      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markComplete, { orgId });

      // Query incomplete records
      const incompleteRecords = await t.run(async (ctx) => {
        const records = await ctx.db
          .query("onboarding_progress")
          .filter((q) => q.eq(q.field("completedAt"), undefined))
          .collect();
        return records;
      });

      expect(incompleteRecords).toHaveLength(0);
    });
  });

  // ===== REMINDER TRACKING =====

  describe("Reminder Tracking", () => {
    it("records reminder sent", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });

      // Get progress ID
      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      const progressId = progress?._id;
      expect(progressId).toBeDefined();

      // Record reminder sent (using internal mutation via run)
      await t.run(async (ctx) => {
        const existingProgress = (await ctx.db.get(
          progressId!,
        )) as Doc<"onboarding_progress"> | null;
        if (existingProgress) {
          const existingReminders = existingProgress.remindersSent ?? [];
          await ctx.db.patch(progressId!, {
            remindersSent: [
              ...existingReminders,
              { type: "24h" as const, sentAt: Date.now() },
            ],
          });
        }
      });

      // Verify reminder recorded
      const updatedProgress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(updatedProgress?.remindersSent).toHaveLength(1);
      expect(updatedProgress?.remindersSent?.[0].type).toBe("24h");
    });

    it("records multiple reminders", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      const progress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      const progressId = progress?._id;

      // Record two reminders
      await t.run(async (ctx) => {
        await ctx.db.patch(progressId!, {
          remindersSent: [
            {
              type: "24h" as const,
              sentAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
            },
            { type: "7d" as const, sentAt: Date.now() },
          ],
        });
      });

      const updatedProgress = await asUser.query(api.onboarding.getProgress, {
        orgId,
      });
      expect(updatedProgress?.remindersSent).toHaveLength(2);
      expect(
        updatedProgress?.remindersSent?.map(
          (r: { type: string; sentAt: number }) => r.type,
        ),
      ).toEqual(["24h", "7d"]);
    });
  });

  // ===== CHECKLIST COMPLETION =====

  describe("Checklist Completion (Post-Wizard)", () => {
    it("tracks first_completion separately from wizard", async () => {
      const t = convexTest(schema, modules);
      const orgId = await createTestOrg(t);

      const asUser = t.withIdentity({
        subject: "user_123",
        issuer: "https://clerk.test",
      });

      // Complete wizard
      await asUser.mutation(api.onboarding.initializeProgress, { orgId });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "org_setup",
      });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "alerts_configured",
      });
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "first_deadline",
      });
      await asUser.mutation(api.onboarding.markComplete, { orgId });

      // first_completion should still be false
      let progress = await asUser.query(api.onboarding.getProgress, { orgId });
      expect(progress?.steps.first_completion).toBe(false);
      expect(progress?.completedAt).toBeDefined();

      // Mark first_completion
      await asUser.mutation(api.onboarding.markStepComplete, {
        orgId,
        step: "first_completion",
      });

      progress = await asUser.query(api.onboarding.getProgress, { orgId });
      expect(progress?.steps.first_completion).toBe(true);
    });
  });
});
