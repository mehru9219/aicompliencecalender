# Implementation Plan: Industry Compliance Templates

**Branch**: `005-industry-templates` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-industry-templates/spec.md`

## Summary

Build a library of pre-configured compliance templates for regulated industries (healthcare, legal, financial) with versioned deadline definitions, customizable import, and automatic update notifications when regulations change.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Convex, Resend (update notifications)
**Storage**: Static JSON (template definitions) + Convex (user customizations, imports)
**Testing**: Vitest (unit), template validation tests
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Template list < 500ms, import < 2s
**Constraints**: Semantic versioning for templates, track customizations vs originals
**Scale/Scope**: 20+ industry templates, unlimited orgs per template

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Imported deadlines track source template ID, version preserved
- [x] **Alert Reliability**: Default alert schedules defined per template deadline
- [x] **Clarity**: Template descriptions include regulatory references and penalty info

Additional checks:
- [x] **Security**: System templates read-only, org isolation on customizations
- [x] **Code Quality**: TypeScript strict, Zod validation for template structure
- [x] **Testing**: 100% coverage for import logic and date calculation
- [x] **Performance**: Lazy load template details, indexed queries
- [x] **External Services**: Resend for update notifications

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── templates/
│           ├── page.tsx              # Template library browser
│           ├── [slug]/page.tsx       # Template detail view
│           └── import/page.tsx       # Import wizard
├── components/
│   └── features/
│       └── templates/
│           ├── TemplateCard.tsx
│           ├── TemplateDeadlineList.tsx
│           ├── TemplateImportWizard.tsx
│           ├── DateCustomizer.tsx
│           ├── TemplateUpdateNotice.tsx
│           └── RegulatoryReferenceLinks.tsx
├── convex/
│   ├── templates.ts                  # Template queries/mutations
│   └── schema.ts
├── lib/
│   └── templates/
│       ├── healthcare-medical-practice.ts
│       ├── healthcare-dental.ts
│       ├── legal-law-firm.ts
│       ├── financial-advisor.ts
│       └── index.ts                  # Template registry
└── types/
    └── template.ts
```

## Database Schema

```typescript
// convex/schema.ts (additions)
industry_templates: defineTable({
  slug: v.string(),
  industry: v.string(),
  subIndustry: v.optional(v.string()),
  name: v.string(),
  description: v.string(),
  version: v.string(),
  deadlines: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    recurrence: v.object({
      type: v.string(),
      interval: v.optional(v.number()),
    }),
    defaultAlertDays: v.array(v.number()),
    anchorType: v.string(),
    defaultMonth: v.optional(v.number()),
    defaultDay: v.optional(v.number()),
    importance: v.string(),
    penaltyRange: v.optional(v.string()),
    regulatoryBody: v.optional(v.string()),
    notes: v.optional(v.string()),
  })),
  documentCategories: v.array(v.string()),
  regulatoryReferences: v.array(v.object({
    name: v.string(),
    url: v.string(),
    description: v.string(),
  })),
  formTemplateIds: v.optional(v.array(v.id("form_templates"))),
  createdAt: v.number(),
  updatedAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_industry", ["industry"]),

template_imports: defineTable({
  orgId: v.id("organizations"),
  templateId: v.id("industry_templates"),
  templateVersion: v.string(),
  importedDeadlineIds: v.array(v.id("deadlines")),
  customizations: v.object({}),
  importedAt: v.number(),
  lastNotifiedVersion: v.optional(v.string()),
})
  .index("by_org", ["orgId"])
  .index("by_template", ["templateId"]),
```

## Template Structure

```typescript
interface IndustryTemplate {
  slug: string;
  industry: string;
  name: string;
  description: string;
  version: string;
  deadlines: TemplateDeadline[];
  documentCategories: string[];
  regulatoryReferences: RegulatoryReference[];
}

interface TemplateDeadline {
  id: string;
  title: string;
  description: string;
  category: string;
  recurrence: RecurrencePattern;
  defaultAlertDays: number[];
  anchorType: 'fixed_date' | 'anniversary' | 'custom';
  defaultMonth?: number;
  defaultDay?: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  penaltyRange?: string;
  regulatoryBody?: string;
  notes?: string;
}
```

## Healthcare Template Example

```typescript
// lib/templates/healthcare-medical-practice.ts
export const healthcareMedicalPractice: IndustryTemplate = {
  slug: 'healthcare-medical-practice',
  industry: 'Healthcare',
  name: 'Medical Practice',
  description: 'Comprehensive compliance template for medical practices, clinics, and physician offices',
  version: '2.1.0',
  deadlines: [
    {
      id: 'hipaa-risk-assessment',
      title: 'HIPAA Annual Risk Assessment',
      description: 'Conduct and document annual security risk assessment as required by HIPAA Security Rule',
      category: 'certification',
      recurrence: { type: 'annual' },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: 'anniversary',
      importance: 'critical',
      penaltyRange: '$100 - $50,000 per violation',
      regulatoryBody: 'HHS Office for Civil Rights',
      notes: 'Must document findings and remediation plan',
    },
    {
      id: 'hipaa-workforce-training',
      title: 'HIPAA Workforce Training',
      description: 'Annual HIPAA privacy and security training for all workforce members',
      category: 'training',
      recurrence: { type: 'annual' },
      defaultAlertDays: [30, 14, 7],
      anchorType: 'anniversary',
      importance: 'high',
      penaltyRange: '$100 - $50,000 per violation',
      regulatoryBody: 'HHS Office for Civil Rights',
    },
    {
      id: 'medical-license-renewal',
      title: 'Medical License Renewal',
      description: 'State medical board license renewal for practicing physicians',
      category: 'license',
      recurrence: { type: 'custom', interval: 730 },
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: 'custom',
      importance: 'critical',
      penaltyRange: 'License suspension, practice closure',
      regulatoryBody: 'State Medical Board',
      notes: 'Check your specific state requirements - renewal periods vary',
    },
    // ... more deadlines
  ],
  documentCategories: [
    'licenses',
    'certifications',
    'training_records',
    'policies',
    'insurance',
    'audit_reports',
    'hipaa_documentation',
  ],
  regulatoryReferences: [
    {
      name: 'HIPAA Security Rule',
      url: 'https://www.hhs.gov/hipaa/for-professionals/security/index.html',
      description: 'HHS guidance on HIPAA security requirements',
    },
    {
      name: 'DEA Diversion Control',
      url: 'https://www.deadiversion.usdoj.gov/',
      description: 'DEA registration and compliance information',
    },
  ],
};
```

## Template Import Flow

```typescript
// convex/templates.ts
export const importTemplate = mutation({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
    selectedDeadlineIds: v.array(v.string()),
    customDates: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    const user = await getCurrentUser(ctx);

    const importedDeadlineIds: Id<"deadlines">[] = [];

    for (const templateDeadline of template.deadlines) {
      if (!args.selectedDeadlineIds.includes(templateDeadline.id)) continue;

      const dueDate = args.customDates[templateDeadline.id] ??
        calculateDefaultDueDate(templateDeadline);

      const deadlineId = await ctx.db.insert("deadlines", {
        orgId: args.orgId,
        title: templateDeadline.title,
        description: templateDeadline.description,
        category: templateDeadline.category,
        dueDate,
        recurrence: templateDeadline.recurrence,
        assignedTo: null,
        completedAt: null,
        completedBy: null,
        deletedAt: null,
        createdAt: Date.now(),
        createdBy: user.id,
        templateDeadlineId: templateDeadline.id,
      });

      importedDeadlineIds.push(deadlineId);

      // Schedule alerts
      await scheduleAlertsForDeadline(ctx, deadlineId, templateDeadline.defaultAlertDays);
    }

    // Record the import
    await ctx.db.insert("template_imports", {
      orgId: args.orgId,
      templateId: args.templateId,
      templateVersion: template.version,
      importedDeadlineIds,
      customizations: {},
      importedAt: Date.now(),
      lastNotifiedVersion: template.version,
    });

    return importedDeadlineIds;
  },
});
```

## Version Update Notifications

```typescript
// convex/templates.ts
export const checkForUpdates = internalMutation({
  handler: async (ctx) => {
    const imports = await ctx.db.query("template_imports").collect();

    for (const imp of imports) {
      const template = await ctx.db.get(imp.templateId);

      if (template.version !== imp.lastNotifiedVersion) {
        const changes = compareVersions(imp.templateVersion, template.version, template);

        if (changes.length > 0) {
          const org = await ctx.db.get(imp.orgId);
          const owner = await getClerkUser(org.ownerId);

          await sendTemplateUpdateEmail(owner.email, {
            templateName: template.name,
            oldVersion: imp.templateVersion,
            newVersion: template.version,
            changes,
          });

          await ctx.db.insert("notifications", {
            orgId: imp.orgId,
            type: 'template_update',
            data: {
              templateId: imp.templateId,
              changes,
            },
            createdAt: Date.now(),
            read: false,
          });

          await ctx.db.patch(imp._id, {
            lastNotifiedVersion: template.version,
          });
        }
      }
    }
  },
});
```

## Available Templates

```text
Healthcare:
- healthcare-medical-practice
- healthcare-dental
- healthcare-mental-health
- healthcare-pharmacy
- healthcare-laboratory
- healthcare-home-health

Legal:
- legal-law-firm
- legal-solo-practitioner

Financial:
- financial-advisor
- financial-cpa-firm
- financial-insurance-agency

Other Regulated:
- real-estate-brokerage
- construction-contractor
```

## Complexity Tracking

No constitution violations - implements versioning, update notifications, and regulatory references.
