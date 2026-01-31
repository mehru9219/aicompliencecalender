import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    industry: v.string(),
    ownerId: v.string(),
    clerkOrgId: v.optional(v.string()), // Maps to Clerk Organization ID
    settings: v.object({
      timezone: v.optional(v.string()),
      dueSoonDays: v.optional(v.number()),
      ssoEnabled: v.optional(v.boolean()),
      ssoProvider: v.optional(v.string()),
      ssoOnly: v.optional(v.boolean()),
    }),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_clerk_org", ["clerkOrgId"]),

  // User-Organization membership junction table (supports multi-org future)
  user_organizations: defineTable({
    userId: v.string(),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("manager"),
      v.literal("member"),
      v.literal("viewer"),
    ),
    joinedAt: v.number(),
    invitedBy: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_user_org", ["userId", "orgId"]),

  // Pending invitations
  invitations: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("member"),
      v.literal("viewer"),
    ),
    invitedBy: v.string(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked"),
    ),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedBy: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_org_status", ["orgId", "status"]),

  deadlines: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    category: v.string(),
    recurrence: v.optional(
      v.object({
        type: v.union(
          v.literal("weekly"),
          v.literal("monthly"),
          v.literal("quarterly"),
          v.literal("semi_annual"),
          v.literal("annual"),
          v.literal("custom"),
        ),
        interval: v.optional(v.number()),
        endDate: v.optional(v.number()),
        baseDate: v.optional(
          v.union(v.literal("due_date"), v.literal("completion_date")),
        ),
      }),
    ),
    assignedTo: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.string(),
    // Template import fields
    alertDays: v.optional(v.array(v.number())),
    importance: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
      ),
    ),
    templateId: v.optional(v.id("industry_templates")),
    templateDeadlineId: v.optional(v.string()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_due", ["orgId", "dueDate"])
    .index("by_org_category", ["orgId", "category"])
    .index("by_org_assigned", ["orgId", "assignedTo"])
    .index("by_org_deleted", ["orgId", "deletedAt"])
    .index("by_template", ["templateId"]),

  deadline_audit_log: defineTable({
    deadlineId: v.id("deadlines"),
    orgId: v.id("organizations"),
    userId: v.string(),
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("completed"),
      v.literal("deleted"),
      v.literal("restored"),
    ),
    changes: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_deadline", ["deadlineId"])
    .index("by_org", ["orgId"])
    .index("by_org_timestamp", ["orgId", "timestamp"]),

  // Alert & Notification System tables
  alerts: defineTable({
    deadlineId: v.id("deadlines"),
    orgId: v.id("organizations"),
    userId: v.optional(v.string()),
    scheduledFor: v.number(),
    channel: v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("push"),
      v.literal("in_app"),
    ),
    urgency: v.union(
      v.literal("early"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
    ),
    status: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("acknowledged"),
    ),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    acknowledgedAt: v.optional(v.number()),
    acknowledgedVia: v.optional(
      v.union(
        v.literal("email_link"),
        v.literal("sms_reply"),
        v.literal("in_app_button"),
      ),
    ),
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
    snoozedUntil: v.optional(v.number()),
  })
    .index("by_scheduled", ["status", "scheduledFor"])
    .index("by_deadline", ["deadlineId"])
    .index("by_org", ["orgId", "scheduledFor"])
    .index("by_org_status", ["orgId", "status"]),

  alert_preferences: defineTable({
    orgId: v.id("organizations"),
    userId: v.optional(v.string()),
    earlyChannels: v.array(v.string()),
    mediumChannels: v.array(v.string()),
    highChannels: v.array(v.string()),
    criticalChannels: v.array(v.string()),
    alertDays: v.array(v.number()),
    escalationEnabled: v.boolean(),
    escalationContacts: v.array(v.string()),
    phoneNumber: v.optional(v.string()),
    emailOverride: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_org_user", ["orgId", "userId"]),

  notifications: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId", "readAt"])
    .index("by_org_user", ["orgId", "userId"]),

  alert_audit_log: defineTable({
    alertId: v.id("alerts"),
    orgId: v.id("organizations"),
    action: v.union(
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("acknowledged"),
      v.literal("snoozed"),
      v.literal("cancelled"),
      v.literal("escalated"),
    ),
    details: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_alert", ["alertId"])
    .index("by_org", ["orgId", "timestamp"]),

  // Document Vault tables
  documents: defineTable({
    orgId: v.id("organizations"),
    deadlineIds: v.array(v.id("deadlines")),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    category: v.union(
      v.literal("licenses"),
      v.literal("certifications"),
      v.literal("training_records"),
      v.literal("audit_reports"),
      v.literal("policies"),
      v.literal("insurance"),
      v.literal("contracts"),
      v.literal("other"),
    ),
    extractedText: v.optional(v.string()),
    metadata: v.optional(v.any()),
    version: v.number(),
    previousVersionId: v.optional(v.id("documents")),
    uploadedAt: v.number(),
    uploadedBy: v.string(),
    lastAccessedAt: v.number(),
    lastAccessedBy: v.string(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_category", ["orgId", "category"])
    .index("by_org_deleted", ["orgId", "deletedAt"])
    .index("by_org_filename", ["orgId", "fileName"])
    .searchIndex("search_text", {
      searchField: "extractedText",
      filterFields: ["orgId", "category"],
    }),

  document_access_log: defineTable({
    documentId: v.id("documents"),
    orgId: v.id("organizations"),
    userId: v.string(),
    action: v.union(
      v.literal("view"),
      v.literal("download"),
      v.literal("update"),
      v.literal("delete"),
    ),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_document", ["documentId"])
    .index("by_org", ["orgId", "timestamp"]),

  // AI Form Pre-fill tables
  organization_profiles: defineTable({
    orgId: v.id("organizations"),
    legalName: v.string(),
    dbaNames: v.array(v.string()),
    ein: v.string(), // Encrypted at rest
    addresses: v.array(
      v.object({
        type: v.string(), // 'primary', 'mailing', 'billing'
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
    ),
    phones: v.array(
      v.object({
        type: v.string(), // 'main', 'fax', 'mobile'
        number: v.string(),
      }),
    ),
    emails: v.array(
      v.object({
        type: v.string(), // 'primary', 'billing', 'compliance'
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
  }).index("by_org", ["orgId"]),

  form_templates: defineTable({
    orgId: v.optional(v.id("organizations")), // null = system template
    name: v.string(),
    industry: v.string(),
    originalStorageId: v.id("_storage"),
    fieldMappings: v.array(
      v.object({
        fieldName: v.string(),
        fieldType: v.string(), // 'text', 'checkbox', 'dropdown', 'radio', 'date', 'signature'
        profileKey: v.string(), // e.g., 'legalName', 'addresses[0].street'
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
  })
    .index("by_org", ["orgId"])
    .index("by_industry", ["industry"]),

  form_fills: defineTable({
    orgId: v.id("organizations"),
    templateId: v.id("form_templates"),
    filledStorageId: v.id("_storage"),
    valuesUsed: v.any(), // Snapshot of values for audit
    filledAt: v.number(),
    filledBy: v.string(),
  })
    .index("by_org", ["orgId"])
    .index("by_template", ["templateId"])
    .index("by_org_filled", ["orgId", "filledAt"]),

  // Industry Compliance Templates
  industry_templates: defineTable({
    slug: v.string(),
    industry: v.string(),
    subIndustry: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    version: v.string(), // semver format
    deadlines: v.array(
      v.object({
        id: v.string(), // stable across versions
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
        defaultMonth: v.optional(v.number()), // 1-12 for fixed_date
        defaultDay: v.optional(v.number()), // 1-31 for fixed_date
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
  })
    .index("by_slug", ["slug"])
    .index("by_industry", ["industry"])
    .index("by_active", ["isActive"]),

  template_imports: defineTable({
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
    templateVersion: v.string(),
    importedDeadlineIds: v.array(v.id("deadlines")),
    customizations: v.any(), // track any user customizations
    importedAt: v.number(),
    lastNotifiedVersion: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_template", ["templateId"])
    .index("by_org_template", ["orgId", "templateId"]),

  // Activity Log for dashboard feed and audit trail (immutable)
  activity_log: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    action: v.union(
      v.literal("deadline_created"),
      v.literal("deadline_completed"),
      v.literal("deadline_updated"),
      v.literal("deadline_deleted"),
      v.literal("document_uploaded"),
      v.literal("document_deleted"),
      v.literal("alert_sent"),
      v.literal("alert_acknowledged"),
      v.literal("template_imported"),
      v.literal("settings_updated"),
      // Team management actions
      v.literal("user_invited"),
      v.literal("user_joined"),
      v.literal("user_removed"),
      v.literal("role_changed"),
      v.literal("invitation_revoked"),
      v.literal("ownership_transferred"),
    ),
    targetType: v.union(
      v.literal("deadline"),
      v.literal("document"),
      v.literal("alert"),
      v.literal("template"),
      v.literal("organization"),
      v.literal("user"),
      v.literal("invitation"),
    ),
    targetId: v.optional(v.string()),
    targetTitle: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_timestamp", ["orgId", "timestamp"])
    .index("by_user", ["userId", "timestamp"]),

  // Onboarding progress tracking
  onboarding_progress: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    steps: v.object({
      account_created: v.boolean(),
      org_setup: v.boolean(),
      template_imported: v.boolean(),
      alerts_configured: v.boolean(),
      first_deadline: v.boolean(),
      team_invited: v.boolean(),
      first_completion: v.boolean(),
    }),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    lastActivityAt: v.number(),
    // Re-engagement tracking
    remindersSent: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("24h"), v.literal("7d")),
          sentAt: v.number(),
        }),
      ),
    ),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_incomplete", ["completedAt", "lastActivityAt"]),

  // Subscription billing
  subscriptions: defineTable({
    orgId: v.id("organizations"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("business"),
    ),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("paused"),
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    trialEnd: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // Usage tracking per org per month
  usage: defineTable({
    orgId: v.id("organizations"),
    month: v.string(), // "YYYY-MM" format
    deadlinesCreated: v.number(),
    documentsUploaded: v.number(),
    storageUsedBytes: v.number(),
    formPreFills: v.number(),
    alertsSent: v.number(),
  }).index("by_org_month", ["orgId", "month"]),

  // Trial warning tracking
  trial_warnings: defineTable({
    orgId: v.id("organizations"),
    daysRemaining: v.number(),
    sentAt: v.number(),
  }).index("by_org", ["orgId"]),

  // User dashboard preferences
  dashboard_preferences: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    viewMode: v.union(
      v.literal("team"),
      v.literal("my_items"),
      v.literal("category"),
    ),
    sectionsOrder: v.optional(v.array(v.string())),
    hiddenSections: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  }).index("by_org_user", ["orgId", "userId"]),

  // Saved reports for custom report builder and scheduled reports
  saved_reports: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    reportType: v.union(
      v.literal("compliance_summary"),
      v.literal("team_performance"),
      v.literal("cost_avoidance"),
      v.literal("custom"),
    ),
    config: v.object({
      dateRangeType: v.union(
        v.literal("last_7_days"),
        v.literal("last_30_days"),
        v.literal("last_quarter"),
        v.literal("last_year"),
        v.literal("custom"),
      ),
      customDateRange: v.optional(
        v.object({ from: v.number(), to: v.number() }),
      ),
      categories: v.array(v.string()),
      metrics: v.array(v.string()),
      chartTypes: v.array(v.string()),
      groupBy: v.optional(v.string()),
    }),
    schedule: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
        ),
        recipients: v.array(v.string()),
        dayOfWeek: v.optional(v.number()), // 0-6 for weekly
        dayOfMonth: v.optional(v.number()), // 1-31 for monthly
        hour: v.optional(v.number()), // 0-23
        timezone: v.optional(v.string()),
        lastRun: v.optional(v.number()),
        nextRun: v.optional(v.number()),
      }),
    ),
    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_type", ["orgId", "reportType"])
    .index("by_created_by", ["createdBy"]),
});
