# Implementation Plan: AI-Powered Form Pre-filling

**Branch**: `004-ai-form-prefill` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-form-prefill/spec.md`

## Summary

Build an intelligent form assistant that analyzes uploaded compliance forms, uses AI to understand field semantics, matches fields to stored organization data, and generates pre-filled documents ready for signature.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Claude API (claude-sonnet-4-20250514), pdf-lib, pdf-parse, mammoth.js
**Storage**: Convex (organization profiles, form templates, fill history)
**Testing**: Vitest (unit), mocked Claude API
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Form analysis < 30s, template fill < 30s
**Constraints**: Rate limiting on AI features, form fill limits per plan
**Scale/Scope**: 10 form pre-fills/month (Pro), unlimited (Business)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Form fill history preserved, org profile versioned
- [x] **Alert Reliability**: N/A for this feature
- [x] **Clarity**: Preview shows confidence levels (green/yellow/red) before generation

Additional checks:
- [x] **Security**: Sensitive data (EIN) encrypted, org isolation
- [x] **Code Quality**: TypeScript strict, Zod validation
- [x] **Testing**: 80% coverage for field matching logic
- [x] **Performance**: Async processing with progress indication
- [x] **External Services**: Claude API adapter with timeout, rate limiting

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── forms/
│           ├── page.tsx              # Template library
│           ├── fill/page.tsx         # Form filling wizard
│           └── history/page.tsx      # Past fills
├── components/
│   └── features/
│       └── forms/
│           ├── FormUploader.tsx
│           ├── FormAnalysisPreview.tsx
│           ├── FieldMappingEditor.tsx
│           ├── FormFillReview.tsx
│           ├── OrgProfileEditor.tsx
│           └── FormTemplateCard.tsx
├── convex/
│   ├── forms.ts                      # Form analysis and filling
│   ├── profiles.ts                   # Organization profiles
│   └── schema.ts
└── lib/
    ├── adapters/
    │   └── ai/
    │       └── claude.ts             # Claude API wrapper
    └── pdf/
        └── filler.ts                 # PDF manipulation
```

## Database Schema

```typescript
// convex/schema.ts (additions)
organization_profiles: defineTable({
  orgId: v.id("organizations"),
  legalName: v.string(),
  dbaNames: v.array(v.string()),
  ein: v.string(),                    // Encrypted
  addresses: v.array(v.object({
    type: v.string(),
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    country: v.string(),
  })),
  phones: v.array(v.object({ type: v.string(), number: v.string() })),
  emails: v.array(v.object({ type: v.string(), address: v.string() })),
  website: v.optional(v.string()),
  licenseNumbers: v.array(v.object({
    type: v.string(),
    number: v.string(),
    state: v.optional(v.string()),
    expiry: v.optional(v.number()),
  })),
  npiNumber: v.optional(v.string()),
  officers: v.array(v.object({ name: v.string(), title: v.string(), email: v.string() })),
  incorporationDate: v.optional(v.number()),
  customFields: v.optional(v.object({})),
  updatedAt: v.number(),
}),

form_templates: defineTable({
  orgId: v.optional(v.id("organizations")),  // null = system template
  name: v.string(),
  industry: v.string(),
  originalStorageId: v.id("_storage"),
  fieldMappings: v.array(v.object({
    fieldName: v.string(),
    fieldType: v.string(),
    profileKey: v.string(),
    position: v.optional(v.object({ page: v.number(), x: v.number(), y: v.number() })),
  })),
  timesUsed: v.number(),
  createdAt: v.number(),
}),

form_fills: defineTable({
  orgId: v.id("organizations"),
  templateId: v.id("form_templates"),
  filledStorageId: v.id("_storage"),
  valuesUsed: v.object({}),
  filledAt: v.number(),
  filledBy: v.string(),
}),
```

## Form Analysis Flow

```typescript
// convex/forms.ts
export const analyzeForm = action({
  args: {
    orgId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // Extract form fields
    const formFields = await extractFormFields(buffer, args.fileName);

    // Use Claude to understand field semantics
    const fieldAnalysis = await analyzeFieldsWithClaude(formFields);

    // Get org profile for matching
    const profile = await ctx.runQuery(internal.profiles.get, { orgId: args.orgId });

    // Match fields to profile data
    const mappings = matchFieldsToProfile(fieldAnalysis, profile);

    return {
      fields: formFields,
      analysis: fieldAnalysis,
      mappings,
      unmatchedFields: fieldAnalysis.filter(f => !mappings[f.name]),
    };
  },
});
```

## AI Field Analysis

```typescript
async function analyzeFieldsWithClaude(fields: FormField[]): Promise<FieldAnalysis[]> {
  const anthropic = new Anthropic();

  const prompt = `Analyze these form fields and determine what data they expect.
For each field, provide:
- fieldName: the original field name
- semanticType: what kind of data (business_name, ein, address_street, address_city, phone, email, license_number, date, signature, other)
- confidence: high/medium/low
- notes: any special formatting requirements

Fields:
${JSON.stringify(fields, null, 2)}

Respond with JSON array only.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(response.content[0].text);
}
```

## Field Mapping Logic

```typescript
function matchFieldsToProfile(
  analysis: FieldAnalysis[],
  profile: OrgProfile
): Record<string, { value: string; source: string }> {
  const mappings: Record<string, { value: string; source: string }> = {};

  const typeToProfileKey: Record<string, string> = {
    'business_name': 'legalName',
    'ein': 'ein',
    'address_street': 'addresses[0].street',
    'address_city': 'addresses[0].city',
    'address_state': 'addresses[0].state',
    'address_zip': 'addresses[0].zip',
    'phone': 'phones[0].number',
    'email': 'emails[0].address',
    'website': 'website',
  };

  for (const field of analysis) {
    const profileKey = typeToProfileKey[field.semanticType];
    if (profileKey) {
      const value = getNestedValue(profile, profileKey);
      if (value) {
        mappings[field.fieldName] = { value, source: profileKey };
      }
    }
  }

  return mappings;
}
```

## PDF Filling

```typescript
// lib/pdf/filler.ts
import { PDFDocument } from 'pdf-lib';

export async function fillPdfForm(
  pdfBuffer: ArrayBuffer,
  mappings: Record<string, string>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();

  for (const [fieldName, value] of Object.entries(mappings)) {
    try {
      const field = form.getField(fieldName);

      if (field.constructor.name === 'PDFTextField') {
        (field as PDFTextField).setText(value);
      } else if (field.constructor.name === 'PDFCheckBox') {
        if (value === 'true' || value === 'yes') {
          (field as PDFCheckBox).check();
        }
      } else if (field.constructor.name === 'PDFDropdown') {
        (field as PDFDropdown).select(value);
      }
    } catch (e) {
      console.warn(`Could not fill field ${fieldName}:`, e);
    }
  }

  return await pdfDoc.save();
}
```

## Template Reuse

```typescript
// convex/forms.ts
export const fillFromTemplate = action({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("form_templates"),
    overrides: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.runQuery(internal.forms.getTemplate, { id: args.templateId });
    const profile = await ctx.runQuery(internal.profiles.get, { orgId: args.orgId });

    // Build values from profile + overrides
    const values: Record<string, string> = {};
    for (const mapping of template.fieldMappings) {
      const profileValue = getNestedValue(profile, mapping.profileKey);
      values[mapping.fieldName] = args.overrides?.[mapping.fieldName] ?? profileValue ?? '';
    }

    // Get original PDF and fill
    const originalUrl = await ctx.storage.getUrl(template.originalStorageId);
    const response = await fetch(originalUrl);
    const buffer = await response.arrayBuffer();

    const filledPdf = await fillPdfForm(buffer, values);

    // Store filled PDF
    const filledStorageId = await ctx.storage.store(new Blob([filledPdf]));

    // Record the fill
    await ctx.runMutation(internal.forms.recordFill, {
      orgId: args.orgId,
      templateId: args.templateId,
      filledStorageId,
      valuesUsed: values,
    });

    return await ctx.storage.getUrl(filledStorageId);
  },
});
```

## Complexity Tracking

No constitution violations - implements rate limiting and proper error handling for AI features.
