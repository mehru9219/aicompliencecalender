/**
 * Organization queries and mutations.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync organization from Clerk.
 * Creates new org if clerkOrgId doesn't exist, returns existing if it does.
 */
export const syncFromClerk = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    userId: v.string(),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    // Check if org already exists by clerkOrgId
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      industry: "other",
      ownerId: args.userId,
      clerkOrgId: args.clerkOrgId,
      settings: {},
      createdAt: Date.now(),
    });

    // Create user_organizations membership as owner
    await ctx.db.insert("user_organizations", {
      userId: args.userId,
      orgId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return orgId;
  },
});

/**
 * Get organization by Clerk org ID.
 */
export const getByClerkId = query({
  args: { clerkOrgId: v.string() },
  returns: v.union(v.id("organizations"), v.null()),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();
    return org?._id ?? null;
  },
});

/**
 * List organizations a user belongs to.
 */
export const listByUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizations"),
      name: v.string(),
      industry: v.string(),
      ownerId: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get user's organization memberships
    const memberships = await ctx.db
      .query("user_organizations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get each organization
    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.orgId);
        return org;
      }),
    );

    // Filter out nulls and return
    return orgs
      .filter((org): org is NonNullable<typeof org> => org !== null)
      .map((org) => ({
        _id: org._id,
        name: org.name,
        industry: org.industry,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
      }));
  },
});
