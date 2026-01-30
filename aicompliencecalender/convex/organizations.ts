/**
 * Organization queries and mutations.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

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
