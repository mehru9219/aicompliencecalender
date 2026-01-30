import {
  query,
  mutation,
  internalMutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * List all active templates, optionally filtered by industry.
 */
export const list = query({
  args: {
    industry: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("industry_templates"),
      slug: v.string(),
      industry: v.string(),
      subIndustry: v.optional(v.string()),
      name: v.string(),
      description: v.string(),
      version: v.string(),
      deadlineCount: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let templates;

    if (args.industry) {
      templates = await ctx.db
        .query("industry_templates")
        .withIndex("by_industry", (q) => q.eq("industry", args.industry!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      templates = await ctx.db
        .query("industry_templates")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }

    return templates.map((t) => ({
      _id: t._id,
      slug: t.slug,
      industry: t.industry,
      subIndustry: t.subIndustry,
      name: t.name,
      description: t.description,
      version: t.version,
      deadlineCount: t.deadlines.length,
      updatedAt: t.updatedAt,
    }));
  },
});

/**
 * Get a template by its slug.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("industry_templates"),
      slug: v.string(),
      industry: v.string(),
      subIndustry: v.optional(v.string()),
      name: v.string(),
      description: v.string(),
      version: v.string(),
      deadlines: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          category: v.string(),
          recurrence: v.object({
            type: v.union(
              v.literal("weekly"),
              v.literal("monthly"),
              v.literal("quarterly"),
              v.literal("semi_annual"),
              v.literal("annual"),
              v.literal("custom"),
            ),
            interval: v.optional(v.number()),
          }),
          defaultAlertDays: v.array(v.number()),
          anchorType: v.union(
            v.literal("fixed_date"),
            v.literal("anniversary"),
            v.literal("custom"),
          ),
          defaultMonth: v.optional(v.number()),
          defaultDay: v.optional(v.number()),
          importance: v.union(
            v.literal("critical"),
            v.literal("high"),
            v.literal("medium"),
            v.literal("low"),
          ),
          penaltyRange: v.optional(v.string()),
          regulatoryBody: v.optional(v.string()),
          notes: v.optional(v.string()),
        }),
      ),
      documentCategories: v.array(v.string()),
      regulatoryReferences: v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          description: v.string(),
        }),
      ),
      formTemplateIds: v.optional(v.array(v.id("form_templates"))),
      createdAt: v.number(),
      updatedAt: v.number(),
      isActive: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("industry_templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!template || !template.isActive) {
      return null;
    }

    return template;
  },
});

/**
 * Get available industries for filtering.
 */
export const getIndustries = query({
  args: {},
  returns: v.array(
    v.object({
      industry: v.string(),
      count: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("industry_templates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const industryMap = new Map<string, number>();
    for (const t of templates) {
      industryMap.set(t.industry, (industryMap.get(t.industry) || 0) + 1);
    }

    return Array.from(industryMap.entries())
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => a.industry.localeCompare(b.industry));
  },
});

/**
 * Check if an org has imported a template.
 */
export const getOrgImport = query({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("template_imports"),
      templateVersion: v.string(),
      importedAt: v.number(),
      deadlineCount: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const importRecord = await ctx.db
      .query("template_imports")
      .withIndex("by_org_template", (q) =>
        q.eq("orgId", args.orgId).eq("templateId", args.templateId),
      )
      .first();

    if (!importRecord) {
      return null;
    }

    return {
      _id: importRecord._id,
      templateVersion: importRecord.templateVersion,
      importedAt: importRecord.importedAt,
      deadlineCount: importRecord.importedDeadlineIds.length,
    };
  },
});

/**
 * Import a template's deadlines into an organization.
 */
export const importTemplate = mutation({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
    selectedDeadlineIds: v.array(v.string()),
    customDates: v.record(v.string(), v.number()), // templateDeadlineId -> dueDate timestamp
  },
  returns: v.object({
    importId: v.id("template_imports"),
    createdDeadlineIds: v.array(v.id("deadlines")),
  }),
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check for existing import
    const existingImport = await ctx.db
      .query("template_imports")
      .withIndex("by_org_template", (q) =>
        q.eq("orgId", args.orgId).eq("templateId", args.templateId),
      )
      .first();

    if (existingImport) {
      throw new Error("Template already imported. Use updateImport instead.");
    }

    const createdDeadlineIds: Id<"deadlines">[] = [];
    const now = Date.now();

    // Create deadlines for each selected template deadline
    for (const templateDeadlineId of args.selectedDeadlineIds) {
      const templateDeadline = template.deadlines.find(
        (d) => d.id === templateDeadlineId,
      );
      if (!templateDeadline) {
        continue;
      }

      // Get due date from customDates or calculate default
      let dueDate = args.customDates[templateDeadlineId];
      if (!dueDate) {
        // Calculate default for fixed_date anchors
        if (
          templateDeadline.anchorType === "fixed_date" &&
          templateDeadline.defaultMonth !== undefined &&
          templateDeadline.defaultDay !== undefined
        ) {
          const today = new Date();
          let year = today.getFullYear();
          const targetDate = new Date(
            year,
            templateDeadline.defaultMonth - 1,
            templateDeadline.defaultDay,
          );
          // If date has passed this year, use next year
          if (targetDate <= today) {
            year++;
          }
          dueDate = new Date(
            year,
            templateDeadline.defaultMonth - 1,
            templateDeadline.defaultDay,
          ).getTime();
        } else {
          // For anniversary/custom, require custom date
          throw new Error(
            `Custom date required for deadline: ${templateDeadline.title}`,
          );
        }
      }

      // Create the deadline
      const deadlineId = await ctx.db.insert("deadlines", {
        orgId: args.orgId,
        title: templateDeadline.title,
        description: templateDeadline.description,
        category: templateDeadline.category,
        dueDate: dueDate,
        recurrence: templateDeadline.recurrence,
        alertDays: templateDeadline.defaultAlertDays,
        importance: templateDeadline.importance,
        templateDeadlineId: templateDeadlineId,
        templateId: args.templateId,
        notes: templateDeadline.notes,
        metadata: {
          penaltyRange: templateDeadline.penaltyRange,
          regulatoryBody: templateDeadline.regulatoryBody,
        },
        createdAt: now,
        createdBy: "system", // TODO: Get from auth context
      });

      createdDeadlineIds.push(deadlineId);

      // Schedule alerts for this deadline
      for (const alertDays of templateDeadline.defaultAlertDays) {
        const alertTime = dueDate - alertDays * 24 * 60 * 60 * 1000;
        if (alertTime > now) {
          await ctx.db.insert("alerts", {
            deadlineId: deadlineId,
            orgId: args.orgId,
            scheduledFor: alertTime,
            channel: "email", // Default channel
            urgency: getUrgencyForDays(alertDays),
            status: "scheduled",
            retryCount: 0,
          });
        }
      }
    }

    // Record the import
    const importId = await ctx.db.insert("template_imports", {
      orgId: args.orgId,
      templateId: args.templateId,
      templateVersion: template.version,
      importedDeadlineIds: createdDeadlineIds,
      customizations: {
        selectedDeadlineIds: args.selectedDeadlineIds,
        customDates: args.customDates,
      },
      importedAt: now,
    });

    return {
      importId,
      createdDeadlineIds,
    };
  },
});

/**
 * Seed a template into the database (internal use only).
 */
export const seedTemplate = internalMutation({
  args: {
    slug: v.string(),
    industry: v.string(),
    subIndustry: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    version: v.string(),
    deadlines: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        category: v.string(),
        recurrence: v.object({
          type: v.union(
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("quarterly"),
            v.literal("semi_annual"),
            v.literal("annual"),
            v.literal("custom"),
          ),
          interval: v.optional(v.number()),
        }),
        defaultAlertDays: v.array(v.number()),
        anchorType: v.union(
          v.literal("fixed_date"),
          v.literal("anniversary"),
          v.literal("custom"),
        ),
        defaultMonth: v.optional(v.number()),
        defaultDay: v.optional(v.number()),
        importance: v.union(
          v.literal("critical"),
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
        ),
        penaltyRange: v.optional(v.string()),
        regulatoryBody: v.optional(v.string()),
        notes: v.optional(v.string()),
      }),
    ),
    documentCategories: v.array(v.string()),
    regulatoryReferences: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        description: v.string(),
      }),
    ),
  },
  returns: v.id("industry_templates"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if template already exists
    const existing = await ctx.db
      .query("industry_templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      // Update existing template
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new template
    return await ctx.db.insert("industry_templates", {
      ...args,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  },
});

/**
 * Helper function to determine urgency based on days before deadline.
 */
function getUrgencyForDays(
  days: number,
): "early" | "medium" | "high" | "critical" {
  if (days <= 1) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return "early";
}

// Type for template import records
interface TemplateImport {
  _id: Id<"template_imports">;
  orgId: Id<"organizations">;
  templateId: Id<"industry_templates">;
  templateVersion: string;
  lastNotifiedVersion?: string;
}

// Type for template
interface Template {
  _id: Id<"industry_templates">;
  name: string;
  version: string;
}

/**
 * Check for template updates and notify organizations.
 * Called by daily cron job.
 */
export const checkForUpdates = internalAction({
  args: {},
  returns: v.object({
    checked: v.number(),
    notified: v.number(),
  }),
  handler: async (ctx): Promise<{ checked: number; notified: number }> => {
    // Get all template imports
    const imports: TemplateImport[] = await ctx.runQuery(
      internal.templates.getAllImports,
    );

    let notified = 0;

    for (const importRecord of imports) {
      // Get current template version
      const template: Template | null = await ctx.runQuery(
        internal.templates.getTemplateById,
        {
          templateId: importRecord.templateId,
        },
      );

      if (!template) continue;

      // Check if version differs from what was notified
      const lastNotified =
        importRecord.lastNotifiedVersion || importRecord.templateVersion;

      if (template.version !== lastNotified) {
        // Notify about update
        await ctx.runMutation(internal.templates.notifyTemplateUpdate, {
          importId: importRecord._id,
          orgId: importRecord.orgId,
          templateId: importRecord.templateId,
          templateName: template.name,
          oldVersion: lastNotified,
          newVersion: template.version,
        });

        notified++;
      }
    }

    return {
      checked: imports.length,
      notified,
    };
  },
});

/**
 * Internal query to get all template imports.
 */
export const getAllImports = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("template_imports"),
      orgId: v.id("organizations"),
      templateId: v.id("industry_templates"),
      templateVersion: v.string(),
      lastNotifiedVersion: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const imports = await ctx.db.query("template_imports").collect();
    return imports.map((i) => ({
      _id: i._id,
      orgId: i.orgId,
      templateId: i.templateId,
      templateVersion: i.templateVersion,
      lastNotifiedVersion: i.lastNotifiedVersion,
    }));
  },
});

/**
 * Internal query to get a template by ID.
 */
export const getTemplateById = internalQuery({
  args: {
    templateId: v.id("industry_templates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("industry_templates"),
      name: v.string(),
      version: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;
    return {
      _id: template._id,
      name: template.name,
      version: template.version,
    };
  },
});

/**
 * Notify organization of template update.
 */
export const notifyTemplateUpdate = internalMutation({
  args: {
    importId: v.id("template_imports"),
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
    templateName: v.string(),
    oldVersion: v.string(),
    newVersion: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get org owner for notification
    const org = await ctx.db.get(args.orgId);
    if (!org) return null;

    // Create in-app notification
    await ctx.db.insert("notifications", {
      orgId: args.orgId,
      userId: org.ownerId,
      type: "template_update",
      title: `Template Update Available: ${args.templateName}`,
      message: `The ${args.templateName} template has been updated from version ${args.oldVersion} to ${args.newVersion}. Review the changes to keep your compliance deadlines up to date.`,
      data: {
        templateId: args.templateId,
        oldVersion: args.oldVersion,
        newVersion: args.newVersion,
      },
      createdAt: now,
    });

    // Update lastNotifiedVersion
    await ctx.db.patch(args.importId, {
      lastNotifiedVersion: args.newVersion,
    });

    return null;
  },
});
