import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get unread notifications for a user.
 */
export const getUnread = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      userId: v.string(),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
      createdAt: v.number(),
      readAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("readAt", undefined),
      )
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .order("desc")
      .take(args.limit ?? 50);

    return notifications;
  },
});

/**
 * Get all notifications for a user (paginated).
 */
export const list = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      userId: v.string(),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
      createdAt: v.number(),
      readAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .order("desc")
      .take(args.limit ?? 100);

    return notifications;
  },
});

/**
 * Get unread notification count.
 */
export const getUnreadCount = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("readAt", undefined),
      )
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();

    return notifications.length;
  },
});

/**
 * Create a notification.
 */
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      orgId: args.orgId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mark a notification as read.
 */
export const markRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (!notification.readAt) {
      await ctx.db.patch(args.id, { readAt: Date.now() });
    }

    return null;
  },
});

/**
 * Mark all notifications as read for a user.
 */
export const markAllRead = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("readAt", undefined),
      )
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .collect();

    const now = Date.now();
    await Promise.all(
      unread.map((notification) =>
        ctx.db.patch(notification._id, { readAt: now }),
      ),
    );

    return unread.length;
  },
});

/**
 * Delete a notification.
 */
export const remove = mutation({
  args: {
    id: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.id);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
