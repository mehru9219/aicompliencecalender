import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Import all templates from the library
import { allTemplates } from "../lib/templates";

/**
 * Seed all industry templates into the database.
 * Can be run idempotently - will update existing templates.
 */
export const seedAllTemplates = internalAction({
  args: {},
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    let processed = 0;

    for (const template of allTemplates) {
      await ctx.runMutation(internal.templates.seedTemplate, {
        slug: template.slug,
        industry: template.industry,
        subIndustry: template.subIndustry,
        name: template.name,
        description: template.description,
        version: template.version,
        deadlines: template.deadlines,
        documentCategories: template.documentCategories,
        regulatoryReferences: template.regulatoryReferences,
      });

      console.log(`Seeded template: ${template.name} (${template.slug})`);
      processed++;
    }

    console.log(`Seeding complete: ${processed} templates processed`);

    return {
      created: processed,
      updated: 0,
      total: allTemplates.length,
    };
  },
});

/**
 * Seed a single template by slug.
 */
export const seedTemplateBySlug = internalAction({
  args: {
    slug: v.string(),
  },
  returns: v.union(v.id("industry_templates"), v.null()),
  handler: async (ctx, args): Promise<Id<"industry_templates"> | null> => {
    const template = allTemplates.find((t) => t.slug === args.slug);

    if (!template) {
      console.error(`Template not found: ${args.slug}`);
      return null;
    }

    const result: Id<"industry_templates"> = await ctx.runMutation(
      internal.templates.seedTemplate,
      {
        slug: template.slug,
        industry: template.industry,
        subIndustry: template.subIndustry,
        name: template.name,
        description: template.description,
        version: template.version,
        deadlines: template.deadlines,
        documentCategories: template.documentCategories,
        regulatoryReferences: template.regulatoryReferences,
      },
    );

    console.log(`Seeded template: ${template.name}`);
    return result;
  },
});

/**
 * List all available template slugs in the library.
 */
export const listAvailableTemplates = internalAction({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
      industry: v.string(),
      deadlineCount: v.number(),
    }),
  ),
  handler: async () => {
    return allTemplates.map((t) => ({
      slug: t.slug,
      name: t.name,
      industry: t.industry,
      deadlineCount: t.deadlines.length,
    }));
  },
});
