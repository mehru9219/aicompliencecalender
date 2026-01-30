import { v, ConvexError } from "convex/values";
import {
  action,
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import Anthropic from "@anthropic-ai/sdk";

// Rate limiting state (in-memory, resets on deploy)
const rateLimitState: Map<string, number[]> = new Map();
const MAX_CALLS_PER_MINUTE = 10;

/**
 * Check rate limit for an organization.
 */
function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  const history = rateLimitState.get(orgId) ?? [];
  const recentCalls = history.filter((t) => t > oneMinuteAgo);

  rateLimitState.set(orgId, recentCalls);

  return recentCalls.length < MAX_CALLS_PER_MINUTE;
}

/**
 * Record a call for rate limiting.
 */
function recordCall(orgId: string): void {
  const history = rateLimitState.get(orgId) ?? [];
  history.push(Date.now());
  rateLimitState.set(orgId, history);
}

/** Field analysis result type */
interface FieldAnalysis {
  fieldName: string;
  semanticType: string;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

/**
 * Use Claude to analyze form fields and determine their semantic types.
 */
async function analyzeFieldsWithClaude(
  fields: Array<{ name: string; type: string; options?: string[] }>,
): Promise<FieldAnalysis[]> {
  const anthropic = new Anthropic();

  const prompt = `Analyze these form fields and determine what data they expect.
For each field, provide:
- fieldName: the original field name
- semanticType: one of [business_name, ein, address_street, address_city, address_state, address_zip, address_country, phone, fax, email, website, license_number, npi_number, officer_name, officer_title, date, signature, other]
- confidence: high/medium/low based on how certain you are
- notes: any special formatting requirements or notes (optional)

Fields:
${JSON.stringify(fields, null, 2)}

Respond with a JSON array only. No markdown, no explanations.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract text content
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse JSON, handling potential markdown wrapping
  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  return JSON.parse(jsonStr) as FieldAnalysis[];
}

/**
 * Internal mutation to increment form pre-fill usage.
 */
export const incrementFormPreFillUsage = internalMutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_org_month", (q) =>
        q.eq("orgId", args.orgId).eq("month", currentMonth),
      )
      .first();

    if (!usage) {
      await ctx.db.insert("usage", {
        orgId: args.orgId,
        month: currentMonth,
        deadlinesCreated: 0,
        documentsUploaded: 0,
        storageUsedBytes: 0,
        formPreFills: 1,
        alertsSent: 0,
      });
    } else {
      await ctx.db.patch(usage._id, {
        formPreFills: (usage.formPreFills || 0) + 1,
      });
    }

    return null;
  },
});

/**
 * Analyze a form PDF and return field mappings.
 */
export const analyzeForm = action({
  args: {
    orgId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    fields: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          options: v.optional(v.array(v.string())),
        }),
      ),
    ),
    analysis: v.optional(
      v.array(
        v.object({
          fieldName: v.string(),
          semanticType: v.string(),
          confidence: v.string(),
          notes: v.optional(v.string()),
        }),
      ),
    ),
    mappings: v.optional(v.any()),
    unmatchedFields: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    fields?: { name: string; type: string; options?: string[] }[];
    analysis?: {
      fieldName: string;
      semanticType: string;
      confidence: string;
      notes?: string;
    }[];
    mappings?: Record<
      string,
      { value: string; source: string; confidence: string }
    >;
    unmatchedFields?: string[];
    error?: string;
  }> => {
    // Check plan limit for form pre-fills
    const limitCheck: { allowed: boolean; limit: number | "unlimited" } =
      await ctx.runQuery(api.billing.checkLimit, {
        orgId: args.orgId,
        limitType: "formPreFills",
      });

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `You have reached your plan limit of ${limitCheck.limit} form pre-fills this month. Upgrade your plan for more.`,
      };
    }

    // Check rate limit
    if (!checkRateLimit(args.orgId)) {
      return {
        success: false,
        error: `Rate limit exceeded: Maximum ${MAX_CALLS_PER_MINUTE} form analyses per minute.`,
      };
    }

    try {
      // Get file from storage
      const fileUrl = await ctx.storage.getUrl(args.storageId);
      if (!fileUrl) {
        return { success: false, error: "File not found in storage" };
      }

      // Fetch the file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return { success: false, error: "Failed to fetch file" };
      }

      const buffer = await response.arrayBuffer();

      // Import pdf-lib dynamically
      const { PDFDocument } = await import("pdf-lib");

      // Load PDF and extract form fields
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      const pdfFields = form.getFields();

      if (pdfFields.length === 0) {
        return {
          success: true,
          fields: [],
          analysis: [],
          mappings: {},
          unmatchedFields: [],
        };
      }

      // Extract field info
      const fields = pdfFields.map((field) => {
        const constructorName = field.constructor.name;
        let type = "text";
        const options: string[] = [];

        switch (constructorName) {
          case "PDFTextField":
            type = "text";
            break;
          case "PDFCheckBox":
            type = "checkbox";
            break;
          case "PDFDropdown":
          case "PDFOptionList":
            type = "dropdown";
            try {
              const dropdown = field as unknown as {
                getOptions: () => string[];
              };
              if (typeof dropdown.getOptions === "function") {
                options.push(...dropdown.getOptions());
              }
            } catch {
              /* ignore */
            }
            break;
          case "PDFRadioGroup":
            type = "radio";
            try {
              const radio = field as unknown as { getOptions: () => string[] };
              if (typeof radio.getOptions === "function") {
                options.push(...radio.getOptions());
              }
            } catch {
              /* ignore */
            }
            break;
          case "PDFSignature":
            type = "signature";
            break;
        }

        return {
          name: field.getName(),
          type,
          options: options.length > 0 ? options : undefined,
        };
      });

      // Record the API call
      recordCall(args.orgId);

      // Analyze fields with Claude
      const analysis = await analyzeFieldsWithClaude(fields);

      // Get org profile for matching
      const profile = await ctx.runQuery(internal.profiles.getInternal, {
        orgId: args.orgId,
      });

      // Build mappings
      const mappings: Record<
        string,
        { value: string; source: string; confidence: string }
      > = {};
      const unmatchedFields: string[] = [];

      const profileKeyMap: Record<string, string> = {
        business_name: "legalName",
        ein: "ein",
        address_street: "addresses[0].street",
        address_city: "addresses[0].city",
        address_state: "addresses[0].state",
        address_zip: "addresses[0].zip",
        address_country: "addresses[0].country",
        phone: "phones[0].number",
        email: "emails[0].address",
        website: "website",
        license_number: "licenseNumbers[0].number",
        npi_number: "npiNumber",
        officer_name: "officers[0].name",
        officer_title: "officers[0].title",
      };

      for (const fieldAnalysis of analysis) {
        const profileKey = profileKeyMap[fieldAnalysis.semanticType];

        if (!profileKey || !profile) {
          unmatchedFields.push(fieldAnalysis.fieldName);
          continue;
        }

        // Get value from profile using path
        let value: string | undefined;
        const parts = profileKey.match(/([^[\].]+|\[\d+\])/g);

        if (parts) {
          let current: unknown = profile;
          for (const part of parts) {
            if (current === null || current === undefined) break;
            if (part.startsWith("[")) {
              const idx = parseInt(part.slice(1, -1), 10);
              if (Array.isArray(current)) current = current[idx];
              else current = undefined;
            } else {
              if (typeof current === "object" && current !== null) {
                current = (current as Record<string, unknown>)[part];
              } else {
                current = undefined;
              }
            }
          }
          if (typeof current === "string") value = current;
          else if (typeof current === "number") value = String(current);
        }

        if (value) {
          mappings[fieldAnalysis.fieldName] = {
            value,
            source: profileKey,
            confidence: fieldAnalysis.confidence,
          };
        } else {
          unmatchedFields.push(fieldAnalysis.fieldName);
        }
      }

      // Increment form pre-fill usage on success
      await ctx.runMutation(internal.forms.incrementFormPreFillUsage, {
        orgId: args.orgId,
      });

      return {
        success: true,
        fields,
        analysis,
        mappings,
        unmatchedFields,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      };
    }
  },
});

/**
 * Get form template by ID.
 */
export const getTemplate = query({
  args: {
    templateId: v.id("form_templates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("form_templates"),
      _creationTime: v.number(),
      orgId: v.optional(v.id("organizations")),
      name: v.string(),
      industry: v.string(),
      originalStorageId: v.id("_storage"),
      fieldMappings: v.array(
        v.object({
          fieldName: v.string(),
          fieldType: v.string(),
          profileKey: v.string(),
          position: v.optional(
            v.object({
              page: v.number(),
              x: v.number(),
              y: v.number(),
            }),
          ),
        }),
      ),
      timesUsed: v.number(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Internal query for getting template.
 */
export const getTemplateInternal = internalQuery({
  args: {
    templateId: v.id("form_templates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("form_templates"),
      _creationTime: v.number(),
      orgId: v.optional(v.id("organizations")),
      name: v.string(),
      industry: v.string(),
      originalStorageId: v.id("_storage"),
      fieldMappings: v.array(
        v.object({
          fieldName: v.string(),
          fieldType: v.string(),
          profileKey: v.string(),
          position: v.optional(
            v.object({
              page: v.number(),
              x: v.number(),
              y: v.number(),
            }),
          ),
        }),
      ),
      timesUsed: v.number(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * List templates for an organization.
 */
export const listTemplates = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    industry: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("form_templates"),
      _creationTime: v.number(),
      orgId: v.optional(v.id("organizations")),
      name: v.string(),
      industry: v.string(),
      originalStorageId: v.id("_storage"),
      fieldMappings: v.array(
        v.object({
          fieldName: v.string(),
          fieldType: v.string(),
          profileKey: v.string(),
          position: v.optional(
            v.object({
              page: v.number(),
              x: v.number(),
              y: v.number(),
            }),
          ),
        }),
      ),
      timesUsed: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    let templates;

    if (args.orgId) {
      templates = await ctx.db
        .query("form_templates")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
    } else {
      templates = await ctx.db.query("form_templates").collect();
    }

    if (args.industry) {
      templates = templates.filter((t) => t.industry === args.industry);
    }

    templates.sort((a, b) => b.timesUsed - a.timesUsed);

    return templates.slice(0, args.limit ?? 50);
  },
});

/**
 * Create a new form template.
 */
export const createTemplate = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    name: v.string(),
    industry: v.string(),
    originalStorageId: v.id("_storage"),
    fieldMappings: v.array(
      v.object({
        fieldName: v.string(),
        fieldType: v.string(),
        profileKey: v.string(),
        position: v.optional(
          v.object({
            page: v.number(),
            x: v.number(),
            y: v.number(),
          }),
        ),
      }),
    ),
  },
  returns: v.id("form_templates"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("form_templates", {
      ...args,
      timesUsed: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Record a form fill in the database.
 */
export const recordFill = internalMutation({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("form_templates"),
    filledStorageId: v.id("_storage"),
    valuesUsed: v.any(),
    filledBy: v.string(),
  },
  returns: v.id("form_fills"),
  handler: async (ctx, args) => {
    // Increment timesUsed on template
    const template = await ctx.db.get(args.templateId);
    if (template) {
      await ctx.db.patch(args.templateId, {
        timesUsed: template.timesUsed + 1,
      });
    }

    return await ctx.db.insert("form_fills", {
      orgId: args.orgId,
      templateId: args.templateId,
      filledStorageId: args.filledStorageId,
      valuesUsed: args.valuesUsed,
      filledAt: Date.now(),
      filledBy: args.filledBy,
    });
  },
});

/**
 * List form fill history for an organization.
 */
export const listFills = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("form_fills"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      templateId: v.id("form_templates"),
      filledStorageId: v.id("_storage"),
      valuesUsed: v.any(),
      filledAt: v.number(),
      filledBy: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const fills = await ctx.db
      .query("form_fills")
      .withIndex("by_org_filled", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);

    return fills;
  },
});

/**
 * Fill a form template with profile data and optional overrides.
 */
export const fillFromTemplate = action({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("form_templates"),
    overrides: v.optional(v.record(v.string(), v.string())),
    filledBy: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    filledStorageId: v.optional(v.id("_storage")),
    downloadUrl: v.optional(v.string()),
    fillId: v.optional(v.id("form_fills")),
    filledFields: v.optional(v.array(v.string())),
    skippedFields: v.optional(v.array(v.string())),
    signatureFields: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check plan limit for form pre-fills
    const limitCheck: { allowed: boolean; limit: number | "unlimited" } =
      (await ctx.runQuery(api.billing.checkLimit, {
        orgId: args.orgId,
        limitType: "formPreFills",
      })) as { allowed: boolean; limit: number | "unlimited" };

    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `You have reached your plan limit of ${limitCheck.limit} form pre-fills this month. Upgrade your plan for more.`,
      };
    }

    try {
      // Fetch template
      const template = await ctx.runQuery(internal.forms.getTemplateInternal, {
        templateId: args.templateId,
      });

      if (!template) {
        return { success: false, error: "Template not found" };
      }

      // Fetch org profile
      const profile = await ctx.runQuery(internal.profiles.getInternal, {
        orgId: args.orgId,
      });

      if (!profile) {
        return {
          success: false,
          error:
            "Organization profile not found. Please complete your profile first.",
        };
      }

      // Get original PDF from storage
      const pdfUrl = await ctx.storage.getUrl(template.originalStorageId);
      if (!pdfUrl) {
        return {
          success: false,
          error: "Original form PDF not found in storage",
        };
      }

      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        return { success: false, error: "Failed to fetch original PDF" };
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();

      // Build values from template mappings and profile
      const values: Record<string, string> = {};
      const profileKeyMap: Record<string, string> = {
        legalName: profile.legalName,
        ein: profile.ein,
        website: profile.website || "",
        npiNumber: profile.npiNumber || "",
      };

      // Add array values
      if (profile.addresses?.[0]) {
        profileKeyMap["addresses[0].street"] = profile.addresses[0].street;
        profileKeyMap["addresses[0].city"] = profile.addresses[0].city;
        profileKeyMap["addresses[0].state"] = profile.addresses[0].state;
        profileKeyMap["addresses[0].zip"] = profile.addresses[0].zip;
        profileKeyMap["addresses[0].country"] =
          profile.addresses[0].country || "USA";
      }
      if (profile.phones?.[0]) {
        profileKeyMap["phones[0].number"] = profile.phones[0].number;
      }
      if (profile.emails?.[0]) {
        profileKeyMap["emails[0].address"] = profile.emails[0].address;
      }
      if (profile.licenseNumbers?.[0]) {
        profileKeyMap["licenseNumbers[0].number"] =
          profile.licenseNumbers[0].number;
      }
      if (profile.officers?.[0]) {
        profileKeyMap["officers[0].name"] = profile.officers[0].name;
        profileKeyMap["officers[0].title"] = profile.officers[0].title;
      }

      // Map template fields to profile values
      for (const mapping of template.fieldMappings) {
        const profileValue = profileKeyMap[mapping.profileKey];
        if (profileValue) {
          values[mapping.fieldName] = profileValue;
        }
      }

      // Apply overrides
      if (args.overrides) {
        for (const [key, value] of Object.entries(args.overrides)) {
          values[key] = value;
        }
      }

      // Fill the PDF
      const {
        PDFDocument,
        PDFTextField,
        PDFCheckBox,
        PDFDropdown,
        PDFRadioGroup,
      } = await import("pdf-lib");

      const pdfDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      });
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const filledFields: string[] = [];
      const skippedFields: string[] = [];
      const signatureFields: string[] = [];
      const warnings: string[] = [];

      for (const field of fields) {
        const fieldName = field.getName();
        const constructorName = field.constructor.name;

        if (constructorName === "PDFSignature") {
          signatureFields.push(fieldName);
          continue;
        }

        const value = values[fieldName];
        if (!value) {
          skippedFields.push(fieldName);
          continue;
        }

        try {
          if (field instanceof PDFTextField) {
            field.setText(value);
            filledFields.push(fieldName);
          } else if (field instanceof PDFCheckBox) {
            const isChecked = ["true", "yes", "1", "on", "x"].includes(
              value.toLowerCase(),
            );
            if (isChecked) field.check();
            else field.uncheck();
            filledFields.push(fieldName);
          } else if (field instanceof PDFDropdown) {
            const options = field.getOptions();
            if (options.includes(value)) {
              field.select(value);
              filledFields.push(fieldName);
            } else {
              const match = options.find(
                (o) => o.toLowerCase() === value.toLowerCase(),
              );
              if (match) {
                field.select(match);
                filledFields.push(fieldName);
              } else {
                warnings.push(
                  `Dropdown "${fieldName}": value "${value}" not in options`,
                );
                skippedFields.push(fieldName);
              }
            }
          } else if (field instanceof PDFRadioGroup) {
            const options = field.getOptions();
            if (options.includes(value)) {
              field.select(value);
              filledFields.push(fieldName);
            } else {
              const match = options.find(
                (o) => o.toLowerCase() === value.toLowerCase(),
              );
              if (match) {
                field.select(match);
                filledFields.push(fieldName);
              } else {
                warnings.push(
                  `Radio "${fieldName}": value "${value}" not in options`,
                );
                skippedFields.push(fieldName);
              }
            }
          } else {
            skippedFields.push(fieldName);
          }
        } catch (err) {
          warnings.push(
            `Failed to fill "${fieldName}": ${err instanceof Error ? err.message : "unknown error"}`,
          );
          skippedFields.push(fieldName);
        }
      }

      // Save filled PDF
      const filledPdfBytes = await pdfDoc.save();

      // Store in Convex storage
      const blob = new Blob([new Uint8Array(filledPdfBytes)], {
        type: "application/pdf",
      });
      const filledStorageId = await ctx.storage.store(blob);

      // Get download URL
      const downloadUrl = await ctx.storage.getUrl(filledStorageId);

      // Record the fill
      const fillId: Id<"form_fills"> = await ctx.runMutation(
        internal.forms.recordFill,
        {
          orgId: args.orgId,
          templateId: args.templateId,
          filledStorageId,
          valuesUsed: values,
          filledBy: args.filledBy,
        },
      );

      // Increment form pre-fill usage on success
      await ctx.runMutation(internal.forms.incrementFormPreFillUsage, {
        orgId: args.orgId,
      });

      return {
        success: true,
        filledStorageId,
        downloadUrl: downloadUrl || undefined,
        fillId,
        filledFields,
        skippedFields,
        signatureFields,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fill form",
      };
    }
  },
});

/**
 * Get download URL for a filled form.
 */
export const getFilledFormUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
