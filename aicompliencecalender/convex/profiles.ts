import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";

// Simple encryption/decryption for EIN (in production, use proper key management)
// This is a basic XOR cipher - in production, use AES encryption with secure key storage
const ENCRYPTION_KEY = "comp1iance-k3y-$ecure"; // TODO: Move to environment variable

function encryptEIN(ein: string): string {
  let result = "";
  for (let i = 0; i < ein.length; i++) {
    const charCode =
      ein.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  // Encode as base64 for storage
  return Buffer.from(result, "binary").toString("base64");
}

function decryptEIN(encrypted: string): string {
  // Decode from base64
  const decoded = Buffer.from(encrypted, "base64").toString("binary");
  let result = "";
  for (let i = 0; i < decoded.length; i++) {
    const charCode =
      decoded.charCodeAt(i) ^
      ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/** Get organization profile by orgId */
export const get = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("organization_profiles"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      legalName: v.string(),
      dbaNames: v.array(v.string()),
      ein: v.string(),
      addresses: v.array(
        v.object({
          type: v.string(),
          street: v.string(),
          city: v.string(),
          state: v.string(),
          zip: v.string(),
          country: v.string(),
        }),
      ),
      phones: v.array(
        v.object({
          type: v.string(),
          number: v.string(),
        }),
      ),
      emails: v.array(
        v.object({
          type: v.string(),
          address: v.string(),
        }),
      ),
      website: v.optional(v.string()),
      licenseNumbers: v.array(
        v.object({
          type: v.string(),
          number: v.string(),
          state: v.optional(v.string()),
          expiry: v.optional(v.number()),
        }),
      ),
      npiNumber: v.optional(v.string()),
      officers: v.array(
        v.object({
          name: v.string(),
          title: v.string(),
          email: v.string(),
        }),
      ),
      incorporationDate: v.optional(v.number()),
      customFields: v.optional(v.any()),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!profile) {
      return null;
    }

    // Decrypt EIN before returning
    return {
      ...profile,
      ein: decryptEIN(profile.ein),
    };
  },
});

/** Internal query for getting profile (used by actions) */
export const getInternal = internalQuery({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("organization_profiles"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      legalName: v.string(),
      dbaNames: v.array(v.string()),
      ein: v.string(),
      addresses: v.array(
        v.object({
          type: v.string(),
          street: v.string(),
          city: v.string(),
          state: v.string(),
          zip: v.string(),
          country: v.string(),
        }),
      ),
      phones: v.array(
        v.object({
          type: v.string(),
          number: v.string(),
        }),
      ),
      emails: v.array(
        v.object({
          type: v.string(),
          address: v.string(),
        }),
      ),
      website: v.optional(v.string()),
      licenseNumbers: v.array(
        v.object({
          type: v.string(),
          number: v.string(),
          state: v.optional(v.string()),
          expiry: v.optional(v.number()),
        }),
      ),
      npiNumber: v.optional(v.string()),
      officers: v.array(
        v.object({
          name: v.string(),
          title: v.string(),
          email: v.string(),
        }),
      ),
      incorporationDate: v.optional(v.number()),
      customFields: v.optional(v.any()),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!profile) {
      return null;
    }

    // Decrypt EIN before returning
    return {
      ...profile,
      ein: decryptEIN(profile.ein),
    };
  },
});

/** Address object validator */
const addressObject = v.object({
  type: v.string(),
  street: v.string(),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
  country: v.string(),
});

/** Phone object validator */
const phoneObject = v.object({
  type: v.string(),
  number: v.string(),
});

/** Email object validator */
const emailObject = v.object({
  type: v.string(),
  address: v.string(),
});

/** License number object validator */
const licenseObject = v.object({
  type: v.string(),
  number: v.string(),
  state: v.optional(v.string()),
  expiry: v.optional(v.number()),
});

/** Officer object validator */
const officerObject = v.object({
  name: v.string(),
  title: v.string(),
  email: v.string(),
});

/** Create or update organization profile */
export const upsert = mutation({
  args: {
    orgId: v.id("organizations"),
    legalName: v.string(),
    dbaNames: v.optional(v.array(v.string())),
    ein: v.string(),
    addresses: v.optional(v.array(addressObject)),
    phones: v.optional(v.array(phoneObject)),
    emails: v.optional(v.array(emailObject)),
    website: v.optional(v.string()),
    licenseNumbers: v.optional(v.array(licenseObject)),
    npiNumber: v.optional(v.string()),
    officers: v.optional(v.array(officerObject)),
    incorporationDate: v.optional(v.number()),
    customFields: v.optional(v.any()),
  },
  returns: v.id("organization_profiles"),
  handler: async (ctx, args) => {
    // Validate EIN format
    const einRegex = /^\d{2}-\d{7}$/;
    if (!einRegex.test(args.ein)) {
      throw new Error("EIN must be in format XX-XXXXXXX (e.g., 12-3456789)");
    }

    // Verify organization exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Check for existing profile
    const existing = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const now = Date.now();

    // Encrypt EIN before storage
    const encryptedEIN = encryptEIN(args.ein);

    const profileData = {
      orgId: args.orgId,
      legalName: args.legalName,
      dbaNames: args.dbaNames ?? [],
      ein: encryptedEIN,
      addresses: args.addresses ?? [],
      phones: args.phones ?? [],
      emails: args.emails ?? [],
      website: args.website,
      licenseNumbers: args.licenseNumbers ?? [],
      npiNumber: args.npiNumber,
      officers: args.officers ?? [],
      incorporationDate: args.incorporationDate,
      customFields: args.customFields,
      updatedAt: now,
    };

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, profileData);
      return existing._id;
    } else {
      // Create new profile
      return await ctx.db.insert("organization_profiles", profileData);
    }
  },
});

/** Internal mutation for upserting profile (used by actions) */
export const upsertInternal = internalMutation({
  args: {
    orgId: v.id("organizations"),
    legalName: v.string(),
    dbaNames: v.optional(v.array(v.string())),
    ein: v.string(),
    addresses: v.optional(v.array(addressObject)),
    phones: v.optional(v.array(phoneObject)),
    emails: v.optional(v.array(emailObject)),
    website: v.optional(v.string()),
    licenseNumbers: v.optional(v.array(licenseObject)),
    npiNumber: v.optional(v.string()),
    officers: v.optional(v.array(officerObject)),
    incorporationDate: v.optional(v.number()),
    customFields: v.optional(v.any()),
  },
  returns: v.id("organization_profiles"),
  handler: async (ctx, args) => {
    // Check for existing profile
    const existing = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const now = Date.now();

    // Encrypt EIN before storage
    const encryptedEIN = encryptEIN(args.ein);

    const profileData = {
      orgId: args.orgId,
      legalName: args.legalName,
      dbaNames: args.dbaNames ?? [],
      ein: encryptedEIN,
      addresses: args.addresses ?? [],
      phones: args.phones ?? [],
      emails: args.emails ?? [],
      website: args.website,
      licenseNumbers: args.licenseNumbers ?? [],
      npiNumber: args.npiNumber,
      officers: args.officers ?? [],
      incorporationDate: args.incorporationDate,
      customFields: args.customFields,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profileData);
      return existing._id;
    } else {
      return await ctx.db.insert("organization_profiles", profileData);
    }
  },
});

/** Delete organization profile */
export const deleteProfile = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!existing) {
      return false;
    }

    await ctx.db.delete(existing._id);
    return true;
  },
});

/** Get profile completion status */
export const getCompletionStatus = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.object({
    hasProfile: v.boolean(),
    completionPercentage: v.number(),
    missingFields: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("organization_profiles")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!profile) {
      return {
        hasProfile: false,
        completionPercentage: 0,
        missingFields: ["legalName", "ein", "addresses", "phones", "emails"],
      };
    }

    const requiredFields = [
      { field: "legalName", check: profile.legalName?.length > 0 },
      { field: "ein", check: profile.ein?.length > 0 },
      { field: "addresses", check: profile.addresses?.length > 0 },
      { field: "phones", check: profile.phones?.length > 0 },
      { field: "emails", check: profile.emails?.length > 0 },
    ];

    const optionalFields = [
      { field: "dbaNames", check: profile.dbaNames?.length > 0 },
      { field: "website", check: !!profile.website },
      { field: "licenseNumbers", check: profile.licenseNumbers?.length > 0 },
      { field: "npiNumber", check: !!profile.npiNumber },
      { field: "officers", check: profile.officers?.length > 0 },
      { field: "incorporationDate", check: !!profile.incorporationDate },
    ];

    const requiredComplete = requiredFields.filter((f) => f.check).length;
    const optionalComplete = optionalFields.filter((f) => f.check).length;

    // Required fields count for 60%, optional for 40%
    const requiredWeight = 0.6;
    const optionalWeight = 0.4;

    const completionPercentage = Math.round(
      (requiredComplete / requiredFields.length) * requiredWeight * 100 +
        (optionalComplete / optionalFields.length) * optionalWeight * 100,
    );

    const missingFields = [
      ...requiredFields.filter((f) => !f.check).map((f) => f.field),
      ...optionalFields.filter((f) => !f.check).map((f) => f.field),
    ];

    return {
      hasProfile: true,
      completionPercentage,
      missingFields,
    };
  },
});
