## AI Compliance Calendar - Technical Implementation Plans

---

## Plan 1: Core Deadline Management

```
/speckit.plan

TECH STACK:
- Frontend: Next.js 14 (App Router) + React 18 + TypeScript
- Backend: Convex (serverless database + functions)
- Auth: Clerk (multi-tenant authentication)
- Styling: Tailwind CSS
- Forms: React Hook Form + Zod validation

DATABASE SCHEMA (Convex):

organizations table:
- _id (auto)
- name: string
- industry: string (enum)
- ownerId: string (Clerk user ID)
- settings: object (JSON blob for org preferences)
- createdAt: number (timestamp)

deadlines table:
- _id (auto)
- orgId: Id<"organizations">
- title: string
- description: string
- dueDate: number (timestamp, UTC)
- category: string (enum: license, certification, training, audit, filing, other)
- status: string (enum: upcoming, due_soon, overdue, completed)
- recurrence: object | null
  - type: string (weekly, monthly, quarterly, semi_annual, annual, custom)
  - interval: number (for custom: every N days)
  - endDate: number | null (when recurrence stops)
- assignedTo: string | null (Clerk user ID)
- completedAt: number | null
- completedBy: string | null
- deletedAt: number | null (soft delete)
- createdAt: number
- createdBy: string

INDEXES:
- by_org: orgId (for fetching all org deadlines)
- by_org_status: [orgId, status] (for filtered queries)
- by_org_due: [orgId, dueDate] (for calendar/timeline)
- by_assigned: [orgId, assignedTo] (for user's deadlines)

CONVEX FUNCTIONS:

Queries:
- deadlines.list(orgId, filters?) → paginated deadline list
- deadlines.get(deadlineId) → single deadline with full details
- deadlines.upcoming(orgId, days) → deadlines due within N days
- deadlines.overdue(orgId) → all overdue deadlines
- deadlines.byCategory(orgId, category) → filtered by category
- deadlines.trash(orgId) → soft-deleted items

Mutations:
- deadlines.create(data) → creates deadline + schedules alerts
- deadlines.update(id, data) → updates deadline + reschedules alerts
- deadlines.complete(id) → marks complete, creates next if recurring
- deadlines.softDelete(id) → moves to trash
- deadlines.restore(id) → restores from trash
- deadlines.hardDelete(id) → permanent delete (30+ days in trash)

BUSINESS LOGIC:

Status Calculation (runs on read, not stored):
```typescript
function calculateStatus(deadline: Deadline): Status {
  if (deadline.completedAt) return 'completed';
  const now = Date.now();
  const daysUntilDue = (deadline.dueDate - now) / (1000 * 60 * 60 * 24);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 14) return 'due_soon';
  return 'upcoming';
}
```

Recurrence Generation:
```typescript
function generateNextDeadline(completed: Deadline): Partial<Deadline> {
  const nextDue = calculateNextDueDate(completed.dueDate, completed.recurrence);
  if (completed.recurrence.endDate && nextDue > completed.recurrence.endDate) {
    return null; // Recurrence ended
  }
  return {
    ...completed,
    _id: undefined,
    dueDate: nextDue,
    status: 'upcoming',
    completedAt: null,
    completedBy: null,
  };
}
```

FRONTEND COMPONENTS:

/app/(dashboard)/deadlines/page.tsx - List view with filters
/app/(dashboard)/deadlines/[id]/page.tsx - Detail/edit view
/app/(dashboard)/deadlines/new/page.tsx - Create form

/components/features/deadlines/
  - DeadlineCard.tsx (list item)
  - DeadlineForm.tsx (create/edit)
  - DeadlineFilters.tsx (category, status, date range)
  - DeadlineStatusBadge.tsx (colored status indicator)
  - RecurrenceSelector.tsx (recurrence pattern picker)

VALIDATION (Zod):
```typescript
const deadlineSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.date().min(new Date()),
  category: z.enum(['license', 'certification', 'training', 'audit', 'filing', 'other']),
  recurrence: z.object({
    type: z.enum(['weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'custom']),
    interval: z.number().optional(),
    endDate: z.date().optional(),
  }).optional(),
  assignedTo: z.string().optional(),
});
```

ERROR HANDLING:
- All mutations wrapped in try-catch
- Optimistic updates with rollback on failure
- Toast notifications for success/error states
- Form-level validation before submission
```

---

## Plan 2: Alert & Notification System

```
/speckit.plan

TECH STACK:
- Scheduler: Convex Cron Jobs
- Email: Resend API
- SMS: Twilio API
- Push: Web Push API (browser notifications)
- Queue: Convex internal (actions with retries)

DATABASE SCHEMA (Convex):

alerts table:
- _id (auto)
- deadlineId: Id<"deadlines">
- orgId: Id<"organizations">
- scheduledFor: number (timestamp)
- channel: string (email, sms, push, in_app)
- urgency: string (early, medium, high, critical)
- status: string (scheduled, sent, delivered, failed, acknowledged)
- sentAt: number | null
- deliveredAt: number | null
- acknowledgedAt: number | null
- errorMessage: string | null
- retryCount: number (default 0)
- snoozedUntil: number | null

alert_preferences table:
- _id (auto)
- orgId: Id<"organizations">
- userId: string | null (null = org default)
- earlyChannels: string[] (default: ['email'])
- mediumChannels: string[] (default: ['email', 'in_app'])
- highChannels: string[] (default: ['email', 'sms', 'in_app'])
- criticalChannels: string[] (default: ['email', 'sms', 'in_app'])
- alertDays: number[] (default: [30, 14, 7, 3, 1, 0])
- escalationEnabled: boolean
- escalationContacts: string[] (user IDs)

INDEXES:
- alerts_by_scheduled: [status, scheduledFor] (for cron pickup)
- alerts_by_deadline: deadlineId
- alerts_by_org: [orgId, scheduledFor]

CONVEX CRON JOB:

crons.ts:
```typescript
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Run every 15 minutes
crons.interval(
  "process-alerts",
  { minutes: 15 },
  internal.alerts.processScheduledAlerts
);

// Run daily at 2 AM UTC - cleanup and maintenance
crons.daily(
  "daily-maintenance",
  { hourUTC: 2, minuteUTC: 0 },
  internal.alerts.dailyMaintenance
);

export default crons;
```

ALERT PROCESSING LOGIC:

```typescript
// convex/alerts.ts
export const processScheduledAlerts = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    const windowEnd = now + 15 * 60 * 1000; // 15 min window
    
    // Get alerts due in this window
    const dueAlerts = await ctx.runQuery(internal.alerts.getDueAlerts, {
      from: now,
      to: windowEnd,
    });
    
    for (const alert of dueAlerts) {
      await ctx.scheduler.runAfter(0, internal.alerts.sendAlert, {
        alertId: alert._id,
      });
    }
  },
});

export const sendAlert = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.get, { alertId });
    const deadline = await ctx.runQuery(internal.deadlines.get, { 
      id: alert.deadlineId 
    });
    const user = await getClerkUser(deadline.assignedTo);
    
    try {
      switch (alert.channel) {
        case 'email':
          await sendEmailAlert(user.email, deadline, alert.urgency);
          break;
        case 'sms':
          await sendSmsAlert(user.phone, deadline, alert.urgency);
          break;
        case 'push':
          await sendPushAlert(user.pushSubscription, deadline);
          break;
        case 'in_app':
          await ctx.runMutation(internal.notifications.create, {
            userId: user.id,
            type: 'deadline_reminder',
            data: { deadlineId: deadline._id, urgency: alert.urgency },
          });
          break;
      }
      
      await ctx.runMutation(internal.alerts.markSent, { alertId });
    } catch (error) {
      await ctx.runMutation(internal.alerts.markFailed, { 
        alertId, 
        error: error.message 
      });
      
      // Retry logic
      if (alert.retryCount < 3) {
        await ctx.scheduler.runAfter(
          15 * 60 * 1000 * (alert.retryCount + 1), // Exponential backoff
          internal.alerts.sendAlert,
          { alertId }
        );
      } else {
        // Escalate to backup channel or contact
        await ctx.scheduler.runAfter(0, internal.alerts.escalate, { alertId });
      }
    }
  },
});
```

EMAIL SERVICE (Resend):

```typescript
// lib/adapters/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAlert(
  email: string, 
  deadline: Deadline, 
  urgency: string
) {
  const template = getEmailTemplate(urgency);
  const daysUntil = Math.ceil((deadline.dueDate - Date.now()) / (1000*60*60*24));
  
  await resend.emails.send({
    from: 'alerts@compliancecalendar.app',
    to: email,
    subject: template.subject(deadline.title, daysUntil),
    react: DeadlineAlertEmail({ deadline, urgency, daysUntil }),
    tags: [
      { name: 'type', value: 'deadline_alert' },
      { name: 'urgency', value: urgency },
    ],
  });
}
```

SMS SERVICE (Twilio):

```typescript
// lib/adapters/sms/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsAlert(
  phone: string,
  deadline: Deadline,
  urgency: string
) {
  const daysUntil = Math.ceil((deadline.dueDate - Date.now()) / (1000*60*60*24));
  const message = getSmsMessage(deadline.title, daysUntil, urgency);
  
  await client.messages.create({
    body: message,
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
  });
}

function getSmsMessage(title: string, days: number, urgency: string): string {
  if (days <= 0) return `⚠️ OVERDUE: ${title} - Action required immediately`;
  if (days === 1) return `🔴 DUE TOMORROW: ${title}`;
  if (days <= 7) return `🟡 Due in ${days} days: ${title}`;
  return `📅 Reminder: ${title} due in ${days} days`;
}
```

ALERT SCHEDULING (on deadline create/update):

```typescript
// convex/deadlines.ts
async function scheduleAlertsForDeadline(
  ctx: MutationCtx,
  deadline: Deadline,
  prefs: AlertPreferences
) {
  // Clear existing scheduled alerts
  await ctx.runMutation(internal.alerts.clearForDeadline, {
    deadlineId: deadline._id,
  });
  
  const now = Date.now();
  
  for (const daysBefore of prefs.alertDays) {
    const alertTime = deadline.dueDate - (daysBefore * 24 * 60 * 60 * 1000);
    if (alertTime <= now) continue; // Don't schedule past alerts
    
    const urgency = getUrgencyLevel(daysBefore);
    const channels = prefs[`${urgency}Channels`];
    
    for (const channel of channels) {
      await ctx.runMutation(internal.alerts.schedule, {
        deadlineId: deadline._id,
        orgId: deadline.orgId,
        scheduledFor: alertTime,
        channel,
        urgency,
      });
    }
  }
}

function getUrgencyLevel(daysBefore: number): string {
  if (daysBefore >= 14) return 'early';
  if (daysBefore >= 7) return 'medium';
  if (daysBefore >= 1) return 'high';
  return 'critical';
}
```

FRONTEND COMPONENTS:

/components/features/alerts/
  - AlertPreferencesForm.tsx
  - AlertHistory.tsx
  - SnoozeButton.tsx
  - AlertStatusBadge.tsx

/app/(dashboard)/settings/alerts/page.tsx - Preferences UI

MONITORING:
- Log all alert attempts with timestamps
- Dashboard showing alert delivery rate
- Failed alert notifications to admin
- Weekly digest of alert statistics
```

---

## Plan 3: Document Vault

```
/speckit.plan

TECH STACK:
- Storage: Convex File Storage (primary) or AWS S3 (if >50GB needed)
- OCR: Claude API (vision) for text extraction
- Search: Convex full-text search
- Preview: react-pdf for PDFs, native for images
- Compression: sharp for image optimization

DATABASE SCHEMA (Convex):

documents table:
- _id (auto)
- orgId: Id<"organizations">
- deadlineIds: Id<"deadlines">[] (can link to multiple)
- fileName: string
- fileType: string (pdf, docx, xlsx, jpg, png, etc.)
- fileSize: number (bytes)
- storageId: Id<"_storage"> (Convex file reference)
- category: string (enum)
- extractedText: string | null (for search)
- metadata: object (custom fields)
- version: number (1, 2, 3...)
- previousVersionId: Id<"documents"> | null
- uploadedAt: number
- uploadedBy: string
- lastAccessedAt: number
- lastAccessedBy: string
- deletedAt: number | null

document_access_log table:
- _id (auto)
- documentId: Id<"documents">
- userId: string
- action: string (view, download, update, delete)
- timestamp: number
- ipAddress: string | null

INDEXES:
- by_org: orgId
- by_org_category: [orgId, category]
- by_deadline: deadlineIds (array index)
- by_org_search: [orgId, extractedText] (full-text search)
- by_org_deleted: [orgId, deletedAt]

FILE UPLOAD FLOW:

```typescript
// convex/documents.ts
export const generateUploadUrl = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await verifyOrgAccess(ctx, orgId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    orgId: v.id("organizations"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: v.string(),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Check for existing document with same name (versioning)
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("fileName"), args.fileName))
      .filter((q) => q.eq(q.field("deletedAt"), null))
      .first();
    
    const version = existing ? existing.version + 1 : 1;
    const previousVersionId = existing?._id ?? null;
    
    const docId = await ctx.db.insert("documents", {
      ...args,
      version,
      previousVersionId,
      extractedText: null, // Will be filled by background job
      uploadedAt: Date.now(),
      uploadedBy: user.id,
      lastAccessedAt: Date.now(),
      lastAccessedBy: user.id,
      deletedAt: null,
    });
    
    // Trigger text extraction
    await ctx.scheduler.runAfter(0, internal.documents.extractText, { docId });
    
    return docId;
  },
});
```

TEXT EXTRACTION (Claude Vision):

```typescript
// convex/documents.ts
export const extractText = internalAction({
  args: { docId: v.id("documents") },
  handler: async (ctx, { docId }) => {
    const doc = await ctx.runQuery(internal.documents.get, { docId });
    const fileUrl = await ctx.storage.getUrl(doc.storageId);
    
    let extractedText = '';
    
    if (doc.fileType === 'pdf') {
      // Use pdf-parse for text PDFs
      const response = await fetch(fileUrl);
      const buffer = await response.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(buffer));
      extractedText = pdfData.text;
      
      // If no text (scanned PDF), use Claude Vision
      if (!extractedText.trim()) {
        extractedText = await extractWithClaude(fileUrl, 'pdf');
      }
    } else if (['jpg', 'jpeg', 'png'].includes(doc.fileType)) {
      extractedText = await extractWithClaude(fileUrl, 'image');
    } else if (doc.fileType === 'docx') {
      extractedText = await extractFromDocx(fileUrl);
    }
    
    await ctx.runMutation(internal.documents.updateExtractedText, {
      docId,
      extractedText: extractedText.slice(0, 100000), // Limit size
    });
  },
});

async function extractWithClaude(fileUrl: string, type: string): Promise<string> {
  const anthropic = new Anthropic();
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'url', url: fileUrl },
        },
        {
          type: 'text',
          text: 'Extract all text from this document. Return only the extracted text, no commentary.',
        },
      ],
    }],
  });
  
  return response.content[0].text;
}
```

SEARCH IMPLEMENTATION:

```typescript
// convex/documents.ts
export const search = query({
  args: {
    orgId: v.id("organizations"),
    query: v.string(),
    category: v.optional(v.string()),
    deadlineId: v.optional(v.id("deadlines")),
    dateRange: v.optional(v.object({
      from: v.number(),
      to: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("documents")
      .withSearchIndex("search_text", (q) =>
        q.search("extractedText", args.query).eq("orgId", args.orgId)
      )
      .take(50);
    
    // Apply additional filters
    if (args.category) {
      results = results.filter((d) => d.category === args.category);
    }
    if (args.deadlineId) {
      results = results.filter((d) => d.deadlineIds.includes(args.deadlineId));
    }
    if (args.dateRange) {
      results = results.filter(
        (d) => d.uploadedAt >= args.dateRange.from && 
               d.uploadedAt <= args.dateRange.to
      );
    }
    
    return results.filter((d) => d.deletedAt === null);
  },
});
```

BULK EXPORT (Audit Mode):

```typescript
// convex/documents.ts
export const generateAuditExport = action({
  args: {
    orgId: v.id("organizations"),
    category: v.optional(v.string()),
    deadlineIds: v.optional(v.array(v.id("deadlines"))),
    dateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.runQuery(internal.documents.listForExport, args);
    
    // Create ZIP file
    const zip = new JSZip();
    
    // Organize by category
    for (const doc of documents) {
      const folder = zip.folder(doc.category);
      const fileUrl = await ctx.storage.getUrl(doc.storageId);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      folder.file(doc.fileName, blob);
    }
    
    // Add cover sheet
    const coverSheet = generateCoverSheet(documents, args);
    zip.file('00_Cover_Sheet.pdf', coverSheet);
    
    // Add table of contents
    const toc = generateTableOfContents(documents);
    zip.file('00_Table_of_Contents.pdf', toc);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const storageId = await ctx.storage.store(zipBlob);
    
    return await ctx.storage.getUrl(storageId);
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/documents/page.tsx - Document list with search
/app/(dashboard)/documents/[id]/page.tsx - Document detail/preview

/components/features/documents/
  - DocumentUploader.tsx (drag-drop upload)
  - DocumentCard.tsx (list item with preview)
  - DocumentPreview.tsx (PDF/image viewer)
  - DocumentSearch.tsx (search bar + filters)
  - DocumentCategorySelector.tsx
  - DocumentVersionHistory.tsx
  - AuditExportWizard.tsx

ACCESS LOGGING:

```typescript
// Wrapper for all document access
async function logDocumentAccess(
  ctx: QueryCtx,
  documentId: Id<"documents">,
  action: string
) {
  const user = await getCurrentUser(ctx);
  await ctx.db.insert("document_access_log", {
    documentId,
    userId: user.id,
    action,
    timestamp: Date.now(),
    ipAddress: null, // Could capture from request headers
  });
}
```
```

---

## Plan 4: AI-Powered Form Pre-filling

```
/speckit.plan

TECH STACK:
- AI: Claude API (claude-sonnet-4-20250514)
- PDF Manipulation: pdf-lib (reading/writing)
- PDF Parsing: pdf-parse (text extraction)
- DOCX: mammoth.js (reading), docx (writing)
- Form Storage: Convex

DATABASE SCHEMA (Convex):

organization_profile table:
- _id (auto)
- orgId: Id<"organizations">
- legalName: string
- dbaNames: string[]
- ein: string (encrypted)
- addresses: object[] ({ type, street, city, state, zip, country })
- phones: object[] ({ type, number })
- emails: object[] ({ type, address })
- website: string
- licenseNumbers: object[] ({ type, number, state, expiry })
- npiNumber: string | null
- officers: object[] ({ name, title, email })
- incorporationDate: number
- customFields: object (key-value for industry-specific)
- updatedAt: number

form_templates table:
- _id (auto)
- orgId: Id<"organizations"> | null (null = system template)
- name: string
- industry: string
- originalStorageId: Id<"_storage">
- fieldMappings: object[] ({ fieldName, fieldType, profileKey, position })
- timesUsed: number
- createdAt: number

form_fills table:
- _id (auto)
- orgId: Id<"organizations">
- templateId: Id<"form_templates">
- filledStorageId: Id<"_storage">
- valuesUsed: object (snapshot of values at fill time)
- filledAt: number
- filledBy: string

FORM ANALYSIS FLOW:

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
    
    // Extract form structure
    const formFields = await extractFormFields(buffer, args.fileName);
    
    // Use Claude to understand field semantics
    const fieldAnalysis = await analyzeFieldsWithClaude(formFields);
    
    // Get org profile for matching
    const profile = await ctx.runQuery(internal.profiles.get, { 
      orgId: args.orgId 
    });
    
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
    // ... more mappings
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

PDF FILLING:

```typescript
// lib/pdf-filler.ts
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
      } else if (field.constructor.name === 'PDFRadioGroup') {
        (field as PDFRadioGroup).select(value);
      }
    } catch (e) {
      console.warn(`Could not fill field ${fieldName}:`, e);
    }
  }
  
  // Leave signature fields empty but mark them
  const signatureFields = form.getFields().filter(
    f => f.getName().toLowerCase().includes('signature')
  );
  
  return await pdfDoc.save();
}
```

TEMPLATE SAVING:

```typescript
// convex/forms.ts
export const saveTemplate = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    industry: v.string(),
    originalStorageId: v.id("_storage"),
    fieldMappings: v.array(v.object({
      fieldName: v.string(),
      fieldType: v.string(),
      profileKey: v.string(),
      position: v.optional(v.object({ page: v.number(), x: v.number(), y: v.number() })),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("form_templates", {
      ...args,
      timesUsed: 0,
      createdAt: Date.now(),
    });
  },
});

export const fillFromTemplate = action({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("form_templates"),
    overrides: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.runQuery(internal.forms.getTemplate, {
      id: args.templateId,
    });
    const profile = await ctx.runQuery(internal.profiles.get, {
      orgId: args.orgId,
    });
    
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
    
    // Increment template usage
    await ctx.runMutation(internal.forms.incrementUsage, {
      templateId: args.templateId,
    });
    
    return await ctx.storage.getUrl(filledStorageId);
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/forms/page.tsx - Template library
/app/(dashboard)/forms/fill/page.tsx - Form filling wizard
/app/(dashboard)/forms/history/page.tsx - Past fills

/components/features/forms/
  - FormUploader.tsx
  - FormAnalysisPreview.tsx (shows field detection results)
  - FieldMappingEditor.tsx (manual mapping adjustment)
  - FormFillReview.tsx (preview before generating)
  - OrgProfileEditor.tsx (manage stored data)
  - FormTemplateCard.tsx

ORGANIZATION PROFILE UI:

```typescript
// Structured form for org profile data
const profileSections = [
  {
    title: 'Business Information',
    fields: ['legalName', 'dbaNames', 'ein', 'incorporationDate', 'website'],
  },
  {
    title: 'Addresses',
    fields: ['addresses'], // Array editor
  },
  {
    title: 'Contact Information',
    fields: ['phones', 'emails'],
  },
  {
    title: 'Licenses & Certifications',
    fields: ['licenseNumbers', 'npiNumber'],
  },
  {
    title: 'Officers & Contacts',
    fields: ['officers'],
  },
];
```
```

---

## Plan 5: Industry Compliance Templates

```
/speckit.plan

TECH STACK:
- Data: Static JSON + Convex for user customizations
- Versioning: Semantic versioning for template updates
- Notifications: Convex + Resend for update alerts

DATABASE SCHEMA (Convex):

industry_templates table:
- _id (auto)
- slug: string (unique, e.g., "healthcare-medical-practice")
- industry: string
- subIndustry: string | null
- name: string
- description: string
- version: string (semver: "1.2.0")
- deadlines: object[] (template deadline definitions)
- documentCategories: string[]
- formTemplateIds: Id<"form_templates">[]
- regulatoryReferences: object[] ({ name, url, description })
- createdAt: number
- updatedAt: number
- isActive: boolean

template_imports table:
- _id (auto)
- orgId: Id<"organizations">
- templateId: Id<"industry_templates">
- templateVersion: string (version at import time)
- importedDeadlineIds: Id<"deadlines">[]
- customizations: object (track user modifications)
- importedAt: number
- lastNotifiedVersion: string | null

TEMPLATE STRUCTURE:

```typescript
// Static template definition
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
  id: string; // Stable ID for tracking across versions
  title: string;
  description: string;
  category: string;
  recurrence: RecurrencePattern;
  defaultAlertDays: number[];
  anchorType: 'fixed_date' | 'anniversary' | 'custom';
  // For fixed_date: specific month/day
  // For anniversary: relative to business start/license issue
  // For custom: user enters date
  defaultMonth?: number; // 1-12
  defaultDay?: number; // 1-31
  importance: 'critical' | 'high' | 'medium' | 'low';
  penaltyRange?: string; // "$1,000 - $10,000"
  regulatoryBody?: string;
  notes?: string;
}

interface RegulatoryReference {
  name: string;
  url: string;
  description: string;
}
```

HEALTHCARE TEMPLATE EXAMPLE:

```typescript
// templates/healthcare-medical-practice.ts
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
      recurrence: { type: 'custom', interval: 730 }, // ~2 years, varies by state
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: 'custom',
      importance: 'critical',
      penaltyRange: 'License suspension, practice closure',
      regulatoryBody: 'State Medical Board',
      notes: 'Check your specific state requirements - renewal periods vary',
    },
    {
      id: 'dea-registration',
      title: 'DEA Registration Renewal',
      description: 'Renew DEA registration for prescribing controlled substances',
      category: 'license',
      recurrence: { type: 'custom', interval: 1095 }, // 3 years
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: 'custom',
      importance: 'critical',
      penaltyRange: 'Loss of prescribing privileges, practice impact',
      regulatoryBody: 'Drug Enforcement Administration',
    },
    {
      id: 'clia-certificate',
      title: 'CLIA Certificate Renewal',
      description: 'Clinical Laboratory Improvement Amendments certificate for in-office lab testing',
      category: 'certification',
      recurrence: { type: 'custom', interval: 730 }, // 2 years
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: 'custom',
      importance: 'high',
      penaltyRange: '$10,000+ per day of non-compliance',
      regulatoryBody: 'CMS',
      notes: 'Required if performing any lab tests in office',
    },
    {
      id: 'malpractice-insurance',
      title: 'Malpractice Insurance Renewal',
      description: 'Professional liability insurance policy renewal',
      category: 'insurance',
      recurrence: { type: 'annual' },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: 'custom',
      importance: 'critical',
      notes: 'Check for rate changes, coverage adjustments',
    },
    {
      id: 'business-license',
      title: 'Business License Renewal',
      description: 'Local business operating license',
      category: 'license',
      recurrence: { type: 'annual' },
      defaultAlertDays: [30, 14, 7],
      anchorType: 'fixed_date',
      defaultMonth: 12,
      defaultDay: 31,
      importance: 'medium',
      regulatoryBody: 'Local Government',
    },
    {
      id: 'fire-safety-inspection',
      title: 'Fire Safety Inspection',
      description: 'Annual fire marshal inspection and certification',
      category: 'audit',
      recurrence: { type: 'annual' },
      defaultAlertDays: [30, 14, 7],
      anchorType: 'anniversary',
      importance: 'medium',
      regulatoryBody: 'Local Fire Department',
    },
    {
      id: 'osha-review',
      title: 'OSHA Compliance Review',
      description: 'Annual workplace safety review and documentation update',
      category: 'audit',
      recurrence: { type: 'annual' },
      defaultAlertDays: [30, 14, 7],
      anchorType: 'anniversary',
      importance: 'medium',
      penaltyRange: '$15,625 - $156,259 per violation',
      regulatoryBody: 'OSHA',
    },
    {
      id: 'medicare-revalidation',
      title: 'Medicare/Medicaid Revalidation',
      description: 'CMS provider enrollment revalidation',
      category: 'certification',
      recurrence: { type: 'custom', interval: 1825 }, // 5 years
      defaultAlertDays: [120, 90, 60, 30, 14],
      anchorType: 'custom',
      importance: 'critical',
      penaltyRange: 'Loss of Medicare/Medicaid billing privileges',
      regulatoryBody: 'CMS',
    },
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
    {
      name: 'CMS CLIA Program',
      url: 'https://www.cms.gov/Regulations-and-Guidance/Legislation/CLIA',
      description: 'Clinical laboratory certification requirements',
    },
  ],
};
```

TEMPLATE IMPORT FLOW:

```typescript
// convex/templates.ts
export const importTemplate = mutation({
  args: {
    orgId: v.id("organizations"),
    templateId: v.id("industry_templates"),
    selectedDeadlineIds: v.array(v.string()), // Which template deadlines to import
    customDates: v.record(v.string(), v.number()), // deadline.id -> timestamp
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
        status: 'upcoming',
        assignedTo: null,
        completedAt: null,
        completedBy: null,
        deletedAt: null,
        createdAt: Date.now(),
        createdBy: user.id,
        templateDeadlineId: templateDeadline.id, // Track source
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

VERSION UPDATE NOTIFICATIONS:

```typescript
// convex/templates.ts
export const checkForUpdates = internalMutation({
  handler: async (ctx) => {
    const imports = await ctx.db.query("template_imports").collect();
    
    for (const imp of imports) {
      const template = await ctx.db.get(imp.templateId);
      
      if (template.version !== imp.lastNotifiedVersion) {
        // Check what changed
        const changes = compareVersions(imp.templateVersion, template.version, template);
        
        if (changes.length > 0) {
          // Notify org admin
          const org = await ctx.db.get(imp.orgId);
          const owner = await getClerkUser(org.ownerId);
          
          await sendTemplateUpdateEmail(owner.email, {
            templateName: template.name,
            oldVersion: imp.templateVersion,
            newVersion: template.version,
            changes,
          });
          
          // Create in-app notification
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
          
          // Update last notified
          await ctx.db.patch(imp._id, {
            lastNotifiedVersion: template.version,
          });
        }
      }
    }
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/templates/page.tsx - Template library browser
/app/(dashboard)/templates/[slug]/page.tsx - Template detail view
/app/(dashboard)/templates/import/page.tsx - Import wizard

/components/features/templates/
  - TemplateCard.tsx
  - TemplateDeadlineList.tsx
  - TemplateImportWizard.tsx
  - DateCustomizer.tsx (set actual due dates)
  - TemplateUpdateNotice.tsx
  - RegulatoryReferenceLinks.tsx

AVAILABLE TEMPLATES:

```
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
```

---

## Plan 6: Dashboard & Overview

```
/speckit.plan

TECH STACK:
- Charting: Recharts (React-native, lightweight)
- Real-time: Convex reactive queries
- State: React Query for caching + Convex live updates
- Icons: Lucide React

DASHBOARD DATA QUERIES:

```typescript
// convex/dashboard.ts
export const getDashboardData = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    const allDeadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), null))
      .collect();
    
    // Categorize deadlines
    const overdue = allDeadlines.filter(
      d => !d.completedAt && d.dueDate < now
    );
    const dueToday = allDeadlines.filter(
      d => !d.completedAt && 
           d.dueDate >= now && 
           d.dueDate < now + 24*60*60*1000
    );
    const dueThisWeek = allDeadlines.filter(
      d => !d.completedAt && 
           d.dueDate >= now && 
           d.dueDate < now + sevenDays
    );
    const upcoming = allDeadlines.filter(
      d => !d.completedAt && 
           d.dueDate >= now + sevenDays && 
           d.dueDate < now + thirtyDays
    );
    const completedThisMonth = allDeadlines.filter(
      d => d.completedAt && d.completedAt >= now - thirtyDays
    );
    
    // Calculate compliance score
    const score = calculateComplianceScore(allDeadlines, now);
    
    // Recent activity
    const recentActivity = await getRecentActivity(ctx, orgId, 10);
    
    // Category breakdown
    const byCategory = groupByCategory(allDeadlines.filter(d => !d.completedAt));
    
    return {
      score,
      overdue: overdue.sort((a, b) => a.dueDate - b.dueDate),
      dueToday,
      dueThisWeek: dueThisWeek.sort((a, b) => a.dueDate - b.dueDate),
      upcoming: upcoming.sort((a, b) => a.dueDate - b.dueDate),
      stats: {
        totalActive: allDeadlines.filter(d => !d.completedAt).length,
        completedThisMonth: completedThisMonth.length,
        documentsStored: await getDocumentCount(ctx, orgId),
      },
      byCategory,
      recentActivity,
    };
  },
});

function calculateComplianceScore(deadlines: Deadline[], now: number): number {
  if (deadlines.length === 0) return 100;
  
  let score = 100;
  const activeDeadlines = deadlines.filter(d => !d.completedAt);
  
  for (const d of activeDeadlines) {
    const daysUntilDue = (d.dueDate - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDue < 0) {
      // Overdue: heavy penalty
      score -= Math.min(20, Math.abs(daysUntilDue) * 2);
    } else if (daysUntilDue <= 7) {
      // Due soon: moderate penalty
      score -= 5;
    } else if (daysUntilDue <= 30) {
      // Upcoming: light penalty
      score -= 1;
    }
  }
  
  // Bonus for on-time completions
  const recentCompletions = deadlines.filter(
    d => d.completedAt && d.completedAt <= d.dueDate
  );
  score += Math.min(10, recentCompletions.length);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

DASHBOARD LAYOUT:

```typescript
// app/(dashboard)/page.tsx
export default function DashboardPage() {
  const { orgId } = useOrg();
  const dashboard = useQuery(api.dashboard.getDashboardData, { orgId });
  
  if (!dashboard) return <DashboardSkeleton />;
  
  return (
    <div className="space-y-6">
      {/* Compliance Score - Hero */}
      <ComplianceScoreCard score={dashboard.score} />
      
      {/* Critical Alerts - Red Zone */}
      {(dashboard.overdue.length > 0 || dashboard.dueToday.length > 0) && (
        <CriticalAlertsSection 
          overdue={dashboard.overdue}
          dueToday={dashboard.dueToday}
        />
      )}
      
      {/* Due This Week - Yellow Zone */}
      {dashboard.dueThisWeek.length > 0 && (
        <DueThisWeekSection deadlines={dashboard.dueThisWeek} />
      )}
      
      {/* Stats Bar */}
      <QuickStatsBar stats={dashboard.stats} />
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <UpcomingSection deadlines={dashboard.upcoming} />
        
        {/* Recent Activity */}
        <RecentActivityFeed activities={dashboard.recentActivity} />
      </div>
      
      {/* Category Breakdown */}
      <CategoryBreakdownChart data={dashboard.byCategory} />
      
      {/* Quick Actions */}
      <QuickActionsBar />
    </div>
  );
}
```

COMPONENT DESIGNS:

```typescript
// components/features/dashboard/ComplianceScoreCard.tsx
function ComplianceScoreCard({ score }: { score: number }) {
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Needs Attention' : 'At Risk';
  
  return (
    <Card className={`bg-${color}-50 border-${color}-200`}>
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-gray-600">Compliance Score</p>
          <p className={`text-5xl font-bold text-${color}-600`}>{score}%</p>
          <p className={`text-sm text-${color}-600`}>{label}</p>
        </div>
        <div className="w-32 h-32">
          <CircularProgress value={score} color={color} />
        </div>
      </div>
    </Card>
  );
}

// components/features/dashboard/CriticalAlertsSection.tsx
function CriticalAlertsSection({ overdue, dueToday }) {
  return (
    <Card className="bg-red-50 border-red-300 border-2">
      <CardHeader className="bg-red-100">
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Requires Immediate Attention
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {overdue.map(d => (
          <DeadlineAlertItem 
            key={d._id} 
            deadline={d} 
            urgency="overdue"
            daysText={`${Math.abs(daysDiff(d.dueDate))} days overdue`}
          />
        ))}
        {dueToday.map(d => (
          <DeadlineAlertItem 
            key={d._id} 
            deadline={d} 
            urgency="today"
            daysText="Due today"
          />
        ))}
      </CardContent>
    </Card>
  );
}

// components/features/dashboard/QuickStatsBar.tsx
function QuickStatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard 
        icon={<Clock />} 
        label="Active Deadlines" 
        value={stats.totalActive} 
      />
      <StatCard 
        icon={<CheckCircle />} 
        label="Completed This Month" 
        value={stats.completedThisMonth} 
      />
      <StatCard 
        icon={<FileText />} 
        label="Documents Stored" 
        value={stats.documentsStored} 
      />
      <StatCard 
        icon={<TrendingUp />} 
        label="On-Time Rate" 
        value={`${stats.onTimeRate}%`} 
      />
    </div>
  );
}
```

REAL-TIME UPDATES:

```typescript
// Dashboard auto-refreshes via Convex reactive queries
// No polling needed - updates push automatically

// For activity feed, subscribe to recent changes
export const subscribeToActivity = query({
  args: { orgId: v.id("organizations"), limit: v.number() },
  handler: async (ctx, { orgId, limit }) => {
    return await ctx.db
      .query("activity_log")
      .withIndex("by_org_time", (q) => q.eq("orgId", orgId))
      .order("desc")
      .take(limit);
  },
});
```

VIEW MODES:

```typescript
// Support different dashboard views
type DashboardView = 'my_items' | 'team' | 'category';

function DashboardPage() {
  const [view, setView] = useState<DashboardView>('team');
  const user = useUser();
  
  const filters = useMemo(() => {
    switch (view) {
      case 'my_items':
        return { assignedTo: user.id };
      case 'category':
        return { groupBy: 'category' };
      default:
        return {};
    }
  }, [view, user.id]);
  
  // ... rest of dashboard with filters applied
}
```

MOBILE RESPONSIVENESS:

```typescript
// Responsive grid adjustments
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stats collapse to 2 cols on tablet, 1 on mobile */}
</div>

// Critical section always full width
<Card className="col-span-full">
  {/* Overdue items */}
</Card>

// Hide non-essential on mobile
<div className="hidden md:block">
  <CategoryBreakdownChart />
</div>
```
```

---

## Plan 7: Calendar View

```
/speckit.plan

TECH STACK:
- Calendar: FullCalendar React (@fullcalendar/react)
- Drag & Drop: Built into FullCalendar
- Export: ical.js for iCal generation
- Print: @react-to-print

FULLCALENDAR SETUP:

```typescript
// app/(dashboard)/calendar/page.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarPage() {
  const { orgId } = useOrg();
  const deadlines = useQuery(api.deadlines.listForCalendar, { orgId });
  const updateDeadline = useMutation(api.deadlines.update);
  
  const [filters, setFilters] = useState({
    categories: [],
    assignedTo: null,
    showCompleted: false,
  });
  
  const events = useMemo(() => {
    if (!deadlines) return [];
    
    return deadlines
      .filter(d => applyFilters(d, filters))
      .map(d => ({
        id: d._id,
        title: d.title,
        start: new Date(d.dueDate),
        allDay: true,
        backgroundColor: getStatusColor(d),
        borderColor: getStatusColor(d),
        extendedProps: {
          deadline: d,
        },
      }));
  }, [deadlines, filters]);
  
  const handleEventDrop = async (info: EventDropArg) => {
    const confirmed = await confirm(
      `Move "${info.event.title}" to ${format(info.event.start, 'MMM d, yyyy')}?`
    );
    
    if (confirmed) {
      await updateDeadline({
        id: info.event.id as Id<"deadlines">,
        dueDate: info.event.start.getTime(),
      });
      toast.success('Deadline rescheduled');
    } else {
      info.revert();
    }
  };
  
  return (
    <div className="h-[calc(100vh-200px)]">
      {/* Filters */}
      <CalendarFilters filters={filters} onChange={setFilters} />
      
      {/* Calendar */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listMonth',
        }}
        events={events}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        height="100%"
      />
    </div>
  );
}

function renderEventContent(eventInfo: EventContentArg) {
  const deadline = eventInfo.event.extendedProps.deadline;
  
  return (
    <div className="flex items-center gap-1 px-1 overflow-hidden">
      <StatusDot status={deadline.status} />
      <span className="truncate text-xs">{eventInfo.event.title}</span>
    </div>
  );
}

function getStatusColor(deadline: Deadline): string {
  if (deadline.completedAt) return '#22c55e'; // green
  const daysUntil = (deadline.dueDate - Date.now()) / (1000*60*60*24);
  if (daysUntil < 0) return '#ef4444'; // red
  if (daysUntil <= 7) return '#f97316'; // orange
  return '#3b82f6'; // blue
}
```

CALENDAR DETAIL PANEL:

```typescript
// components/features/calendar/DeadlineQuickView.tsx
function DeadlineQuickView({ deadline, onClose }) {
  const complete = useMutation(api.deadlines.complete);
  
  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{deadline.title}</SheetTitle>
          <StatusBadge status={deadline.status} />
        </SheetHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label>Due Date</Label>
            <p>{format(deadline.dueDate, 'MMMM d, yyyy')}</p>
          </div>
          
          <div>
            <Label>Category</Label>
            <p>{deadline.category}</p>
          </div>
          
          <div>
            <Label>Assigned To</Label>
            <UserAvatar userId={deadline.assignedTo} />
          </div>
          
          {deadline.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{deadline.description}</p>
            </div>
          )}
          
          {/* Linked Documents */}
          <LinkedDocuments deadlineId={deadline._id} />
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={() => complete({ id: deadline._id })}>
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/deadlines/${deadline._id}`}>
                Edit Details
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

ICAL EXPORT:

```typescript
// convex/calendar.ts
export const generateICalFeed = action({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const deadlines = await ctx.runQuery(api.deadlines.list, { 
      orgId, 
      includeCompleted: false 
    });
    
    const calendar = new ICAL.Component(['vcalendar', [], []]);
    calendar.updatePropertyWithValue('prodid', '-//Compliance Calendar//EN');
    calendar.updatePropertyWithValue('version', '2.0');
    calendar.updatePropertyWithValue('x-wr-calname', 'Compliance Deadlines');
    
    for (const d of deadlines) {
      const event = new ICAL.Component('vevent');
      event.updatePropertyWithValue('uid', `${d._id}@compliancecalendar.app`);
      event.updatePropertyWithValue('summary', d.title);
      event.updatePropertyWithValue('description', d.description || '');
      event.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date(d.dueDate)));
      event.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date(d.dueDate)));
      
      // Add alarms based on alert preferences
      const alarmDays = [7, 1];
      for (const days of alarmDays) {
        const alarm = new ICAL.Component('valarm');
        alarm.updatePropertyWithValue('action', 'DISPLAY');
        alarm.updatePropertyWithValue('trigger', `-P${days}D`);
        alarm.updatePropertyWithValue('description', `${d.title} due in ${days} days`);
        event.addSubcomponent(alarm);
      }
      
      calendar.addSubcomponent(event);
    }
    
    return calendar.toString();
  },
});

// Subscribe URL endpoint
// /api/calendar/[orgId]/feed.ics
export async function GET(req: Request, { params }: { params: { orgId: string } }) {
  const ical = await generateICalFeed({ orgId: params.orgId });
  
  return new Response(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="compliance.ics"',
    },
  });
}
```

PRINT VIEW:

```typescript
// components/features/calendar/CalendarPrintView.tsx
const CalendarPrintView = forwardRef<HTMLDivElement, Props>(
  ({ deadlines, month }, ref) => {
    const weeks = getWeeksInMonth(month);
    
    return (
      <div ref={ref} className="p-8 bg-white">
        <h1 className="text-2xl font-bold mb-4">
          Compliance Calendar - {format(month, 'MMMM yyyy')}
        </h1>
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <th key={day} className="border p-2 bg-gray-100">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map(date => (
                  <td key={date.toISOString()} className="border p-2 h-24 align-top">
                    <span className="text-sm text-gray-500">
                      {format(date, 'd')}
                    </span>
                    {getDeadlinesForDate(deadlines, date).map(d => (
                      <div key={d._id} className="text-xs mt-1 truncate">
                        • {d.title}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <footer className="mt-4 text-xs text-gray-500">
          Generated on {format(new Date(), 'PPP')}
        </footer>
      </div>
    );
  }
);
```

FRONTEND COMPONENTS:

/app/(dashboard)/calendar/page.tsx - Main calendar view

/components/features/calendar/
  - CalendarFilters.tsx
  - DeadlineQuickView.tsx
  - CalendarPrintView.tsx
  - CalendarExportMenu.tsx
  - MiniCalendar.tsx (for sidebar/widgets)
```

---

## Plan 8: Organization & Team Management

```
/speckit.plan

TECH STACK:
- Auth: Clerk (organizations, invitations, roles)
- RBAC: Custom role definitions + Clerk metadata
- Audit: Convex activity logging

CLERK ORGANIZATION SETUP:

```typescript
// Clerk organization with custom roles
const roles = {
  owner: {
    permissions: ['*'], // All permissions
  },
  admin: {
    permissions: [
      'deadlines:*',
      'documents:*',
      'alerts:*',
      'users:read',
      'users:invite',
      'users:remove',
      'settings:read',
      'settings:write',
      'audit:read',
    ],
  },
  manager: {
    permissions: [
      'deadlines:create',
      'deadlines:read',
      'deadlines:update',
      'deadlines:complete',
      'deadlines:assign',
      'documents:create',
      'documents:read',
      'documents:update',
      'alerts:read',
      'users:read',
    ],
  },
  member: {
    permissions: [
      'deadlines:read',
      'deadlines:complete:own',
      'documents:create',
      'documents:read',
      'alerts:read:own',
    ],
  },
  viewer: {
    permissions: [
      'deadlines:read',
      'documents:read',
    ],
  },
};
```

PERMISSION CHECKING:

```typescript
// lib/permissions.ts
type Permission = 
  | 'deadlines:create' | 'deadlines:read' | 'deadlines:update' 
  | 'deadlines:delete' | 'deadlines:complete' | 'deadlines:complete:own'
  | 'documents:create' | 'documents:read' | 'documents:update' | 'documents:delete'
  | 'users:read' | 'users:invite' | 'users:remove'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'billing:read' | 'billing:write';

export function hasPermission(
  userRole: string,
  permission: Permission,
  context?: { resourceOwnerId?: string; userId?: string }
): boolean {
  const rolePermissions = roles[userRole]?.permissions || [];
  
  // Check for wildcard
  if (rolePermissions.includes('*')) return true;
  
  // Check for category wildcard (e.g., 'deadlines:*')
  const [category] = permission.split(':');
  if (rolePermissions.includes(`${category}:*`)) return true;
  
  // Check for exact permission
  if (rolePermissions.includes(permission)) return true;
  
  // Check for :own variant
  if (permission.endsWith(':own') && context?.resourceOwnerId === context?.userId) {
    const basePermission = permission.replace(':own', '');
    if (rolePermissions.includes(basePermission)) return true;
  }
  
  return false;
}

// Convex middleware for permission checking
export function withPermission(permission: Permission) {
  return async (ctx: QueryCtx | MutationCtx, args: any) => {
    const user = await getCurrentUser(ctx);
    const orgMembership = await getOrgMembership(ctx, user.id, args.orgId);
    
    if (!hasPermission(orgMembership.role, permission, { 
      userId: user.id,
      resourceOwnerId: args.resourceOwnerId,
    })) {
      throw new ConvexError('Permission denied');
    }
  };
}
```

INVITATION FLOW:

```typescript
// convex/invitations.ts
export const invite = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { orgId, email, role }) => {
    await withPermission('users:invite')(ctx, { orgId });
    
    // Create Clerk invitation
    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role,
      redirectUrl: `${process.env.NEXT_PUBLIC_URL}/accept-invite`,
    });
    
    // Log the action
    await logActivity(ctx, {
      orgId,
      action: 'user_invited',
      data: { email, role },
    });
    
    return invitation;
  },
});

// Accept invitation handler
// /app/accept-invite/page.tsx
export default function AcceptInvitePage() {
  const { isLoaded, organization } = useOrganization();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && organization) {
      // Redirect to dashboard after accepting
      router.push('/');
    }
  }, [isLoaded, organization]);
  
  return <div>Accepting invitation...</div>;
}
```

AUDIT LOGGING:

```typescript
// convex/audit.ts
const activity_log = defineTable({
  orgId: v.id("organizations"),
  userId: v.string(),
  action: v.string(),
  resourceType: v.string(),
  resourceId: v.optional(v.string()),
  data: v.optional(v.any()),
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
});

export async function logActivity(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    action: string;
    resourceType?: string;
    resourceId?: string;
    data?: any;
  }
) {
  const user = await getCurrentUser(ctx);
  
  await ctx.db.insert("activity_log", {
    orgId: params.orgId,
    userId: user.id,
    action: params.action,
    resourceType: params.resourceType || 'system',
    resourceId: params.resourceId,
    data: params.data,
    timestamp: Date.now(),
    ipAddress: null, // Would need to pass from API route
  });
}

// Immutable - no update or delete mutations for activity_log

export const getAuditLog = query({
  args: {
    orgId: v.id("organizations"),
    filters: v.optional(v.object({
      userId: v.optional(v.string()),
      action: v.optional(v.string()),
      resourceType: v.optional(v.string()),
      dateRange: v.optional(v.object({
        from: v.number(),
        to: v.number(),
      })),
    })),
    pagination: v.object({
      limit: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await withPermission('audit:read')(ctx, { orgId: args.orgId });
    
    let query = ctx.db
      .query("activity_log")
      .withIndex("by_org_time", (q) => q.eq("orgId", args.orgId))
      .order("desc");
    
    // Apply filters...
    
    return await query.paginate(args.pagination);
  },
});
```

TEAM MANAGEMENT UI:

```typescript
// app/(dashboard)/settings/team/page.tsx
export default function TeamSettingsPage() {
  const { organization, membership } = useOrganization();
  const members = useQuery(api.team.listMembers, { orgId: organization.id });
  
  const canInvite = hasPermission(membership.role, 'users:invite');
  const canRemove = hasPermission(membership.role, 'users:remove');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Team Members</h1>
        {canInvite && <InviteButton />}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Active Deadlines</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar src={member.imageUrl} />
                  <div>
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleSelector 
                  value={member.role} 
                  onChange={(role) => updateRole(member.id, role)}
                  disabled={!canRemove || member.role === 'owner'}
                />
              </TableCell>
              <TableCell>{member.deadlineCount}</TableCell>
              <TableCell>{format(member.joinedAt, 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {canRemove && member.role !== 'owner' && (
                  <RemoveMemberButton memberId={member.id} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pending Invitations */}
      <PendingInvitations orgId={organization.id} />
    </div>
  );
}
```

SSO CONFIGURATION:

```typescript
// Clerk handles SSO configuration in their dashboard
// We just need to detect and respect SSO-only orgs

// convex/auth.ts
export const getAuthConfig = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const org = await ctx.db.get(orgId);
    
    return {
      ssoEnabled: org.settings.ssoEnabled,
      ssoProvider: org.settings.ssoProvider,
      ssoOnly: org.settings.ssoOnly, // Disable password auth
    };
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/settings/team/page.tsx - Team management
/app/(dashboard)/settings/roles/page.tsx - Role configuration
/app/(dashboard)/settings/audit/page.tsx - Audit log viewer

/components/features/team/
  - InviteModal.tsx
  - RoleSelector.tsx
  - MemberCard.tsx
  - PendingInvitations.tsx
  - RemoveMemberDialog.tsx
  - WorkloadChart.tsx (deadlines per member)
```

---

## Plan 9: Onboarding Experience

```
/speckit.plan

TECH STACK:
- State: Convex for progress tracking
- UI: Custom wizard components
- Email: Resend for re-engagement

ONBOARDING STATE:

```typescript
// convex/schema.ts
const onboarding_progress = defineTable({
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
});
```

ONBOARDING WIZARD:

```typescript
// components/features/onboarding/OnboardingWizard.tsx
const STEPS = [
  { id: 'org_setup', title: 'Set Up Organization', required: true },
  { id: 'template_imported', title: 'Import Templates', required: false },
  { id: 'alerts_configured', title: 'Configure Alerts', required: true },
  { id: 'first_deadline', title: 'Create First Deadline', required: true },
  { id: 'team_invited', title: 'Invite Team', required: false },
];

export function OnboardingWizard() {
  const { orgId } = useOrg();
  const progress = useQuery(api.onboarding.getProgress, { orgId });
  const [currentStep, setCurrentStep] = useState(0);
  
  const completedSteps = STEPS.filter(s => progress?.steps[s.id]).length;
  const isComplete = STEPS.filter(s => s.required).every(s => progress?.steps[s.id]);
  
  if (isComplete && progress?.completedAt) {
    return null; // Don't show wizard
  }
  
  return (
    <Dialog open={!isComplete}>
      <DialogContent className="max-w-2xl">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((step, i) => (
            <div 
              key={step.id}
              className={cn(
                'flex-1 h-2 rounded',
                progress?.steps[step.id] ? 'bg-green-500' : 
                i === currentStep ? 'bg-blue-500' : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        
        {/* Step content */}
        {currentStep === 0 && <OrgSetupStep onComplete={() => advance()} />}
        {currentStep === 1 && <TemplateImportStep onComplete={() => advance()} onSkip={() => advance()} />}
        {currentStep === 2 && <AlertSetupStep onComplete={() => advance()} />}
        {currentStep === 3 && <FirstDeadlineStep onComplete={() => advance()} />}
        {currentStep === 4 && <TeamInviteStep onComplete={() => finish()} onSkip={() => finish()} />}
      </DialogContent>
    </Dialog>
  );
}
```

STEP COMPONENTS:

```typescript
// Step 1: Organization Setup
function OrgSetupStep({ onComplete }) {
  const updateOrg = useMutation(api.organizations.update);
  const markStep = useMutation(api.onboarding.markStepComplete);
  
  const form = useForm({
    defaultValues: {
      name: '',
      industry: '',
      address: '',
    },
  });
  
  const onSubmit = async (data) => {
    await updateOrg(data);
    await markStep({ step: 'org_setup' });
    onComplete();
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold">Tell us about your organization</h2>
      
      <FormField name="name" label="Business Name" required />
      
      <FormField name="industry" label="Industry" required>
        <Select>
          <SelectItem value="healthcare">Healthcare</SelectItem>
          <SelectItem value="dental">Dental</SelectItem>
          <SelectItem value="legal">Legal</SelectItem>
          <SelectItem value="financial">Financial Services</SelectItem>
          {/* ... more industries */}
        </Select>
      </FormField>
      
      <FormField name="address" label="Business Address" />
      
      <Button type="submit">Continue</Button>
    </form>
  );
}

// Step 2: Template Import
function TemplateImportStep({ onComplete, onSkip }) {
  const { orgId } = useOrg();
  const org = useQuery(api.organizations.get, { orgId });
  const templates = useQuery(api.templates.listByIndustry, { 
    industry: org?.industry 
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDeadlines, setSelectedDeadlines] = useState([]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Start with a template</h2>
      <p className="text-gray-600">
        We've prepared compliance checklists for {org?.industry}. 
        Select the items relevant to your business.
      </p>
      
      {templates?.map(template => (
        <TemplatePreview 
          key={template._id}
          template={template}
          selected={selectedTemplate === template._id}
          onSelect={() => setSelectedTemplate(template._id)}
        />
      ))}
      
      {selectedTemplate && (
        <DeadlineSelector
          templateId={selectedTemplate}
          selected={selectedDeadlines}
          onChange={setSelectedDeadlines}
        />
      )}
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onSkip}>Skip for now</Button>
        <Button 
          onClick={() => importAndContinue()}
          disabled={!selectedTemplate}
        >
          Import {selectedDeadlines.length} deadlines
        </Button>
      </div>
    </div>
  );
}

// Step 3: Alert Configuration
function AlertSetupStep({ onComplete }) {
  const [channel, setChannel] = useState('email');
  const [phone, setPhone] = useState('');
  const sendTestAlert = useMutation(api.alerts.sendTest);
  const [testSent, setTestSent] = useState(false);
  
  const handleTest = async () => {
    await sendTestAlert({ channel, phone });
    setTestSent(true);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">How should we alert you?</h2>
      
      <RadioGroup value={channel} onValueChange={setChannel}>
        <RadioItem value="email">
          <Mail className="w-4 h-4" />
          Email only
        </RadioItem>
        <RadioItem value="email_sms">
          <Smartphone className="w-4 h-4" />
          Email + SMS for urgent alerts
        </RadioItem>
      </RadioGroup>
      
      {channel === 'email_sms' && (
        <FormField name="phone" label="Phone Number">
          <PhoneInput value={phone} onChange={setPhone} />
        </FormField>
      )}
      
      <Button variant="outline" onClick={handleTest}>
        Send Test Alert
      </Button>
      
      {testSent && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          Test alert sent! Check your {channel === 'email_sms' ? 'email and phone' : 'email'}.
        </Alert>
      )}
      
      <Button onClick={onComplete} disabled={!testSent}>
        Alerts configured, continue
      </Button>
    </div>
  );
}
```

POST-ONBOARDING CHECKLIST:

```typescript
// components/features/onboarding/OnboardingChecklist.tsx
const CHECKLIST_ITEMS = [
  { id: 'first_deadline', label: 'Create your first deadline', icon: CalendarPlus },
  { id: 'first_document', label: 'Upload your first document', icon: FileUp },
  { id: 'alerts_configured', label: 'Configure alert preferences', icon: Bell },
  { id: 'team_invited', label: 'Invite a team member', icon: UserPlus },
  { id: 'first_completion', label: 'Complete a deadline', icon: CheckCircle },
];

export function OnboardingChecklist() {
  const { orgId } = useOrg();
  const progress = useQuery(api.onboarding.getProgress, { orgId });
  
  const completedCount = CHECKLIST_ITEMS.filter(
    item => progress?.steps[item.id]
  ).length;
  
  const allComplete = completedCount === CHECKLIST_ITEMS.length;
  
  if (allComplete) return null;
  
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Getting Started ({completedCount}/{CHECKLIST_ITEMS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {CHECKLIST_ITEMS.map(item => (
            <li 
              key={item.id}
              className={cn(
                'flex items-center gap-2 text-sm',
                progress?.steps[item.id] && 'line-through text-gray-400'
              )}
            >
              {progress?.steps[item.id] ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <item.icon className="w-4 h-4 text-gray-400" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

RE-ENGAGEMENT EMAILS:

```typescript
// convex/crons.ts
crons.daily(
  "onboarding-reminders",
  { hourUTC: 14, minuteUTC: 0 }, // 2 PM UTC
  internal.onboarding.sendReminders
);

// convex/onboarding.ts
export const sendReminders = internalAction({
  handler: async (ctx) => {
    const incompleteOnboarding = await ctx.runQuery(
      internal.onboarding.getIncomplete
    );
    
    for (const progress of incompleteOnboarding) {
      const hoursSinceActivity = 
        (Date.now() - progress.lastActivityAt) / (1000 * 60 * 60);
      
      // 24 hour reminder
      if (hoursSinceActivity >= 24 && hoursSinceActivity < 48) {
        await sendOnboardingReminder(progress, '24h');
      }
      
      // 7 day reminder
      if (hoursSinceActivity >= 168 && hoursSinceActivity < 192) {
        await sendOnboardingReminder(progress, '7d');
      }
    }
  },
});

async function sendOnboardingReminder(progress, type: '24h' | '7d') {
  const user = await getClerkUser(progress.userId);
  const org = await getOrg(progress.orgId);
  
  const nextStep = getNextIncompleteStep(progress.steps);
  
  await resend.emails.send({
    to: user.email,
    subject: type === '24h' 
      ? `Complete your ${org.name} compliance setup`
      : `Your compliance calendar is waiting`,
    react: OnboardingReminderEmail({
      userName: user.firstName,
      orgName: org.name,
      nextStep,
      completedSteps: countCompletedSteps(progress.steps),
      totalSteps: STEPS.length,
    }),
  });
}
```
```

---

## Plan 10: Billing & Subscription

```
/speckit.plan

TECH STACK:
- Payments: Stripe (Subscriptions, Checkout, Billing Portal)
- Webhooks: Next.js API routes
- Metering: Convex for usage tracking

STRIPE PRODUCTS SETUP:

```typescript
// Stripe product/price configuration
const PLANS = {
  starter: {
    name: 'Starter',
    priceMonthly: 4900, // $49 in cents
    priceYearly: 49000, // $490 (2 months free)
    features: {
      users: 1,
      deadlines: 25,
      storage: 1, // GB
      emailAlerts: true,
      smsAlerts: false,
      formPreFills: 0,
    },
  },
  professional: {
    name: 'Professional',
    priceMonthly: 14900,
    priceYearly: 149000,
    features: {
      users: 5,
      deadlines: -1, // unlimited
      storage: 10,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: 10,
    },
  },
  business: {
    name: 'Business',
    priceMonthly: 29900,
    priceYearly: 299000,
    features: {
      users: 15,
      deadlines: -1,
      storage: 50,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: -1,
    },
  },
};
```

DATABASE SCHEMA:

```typescript
// convex/schema.ts
const subscriptions = defineTable({
  orgId: v.id("organizations"),
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.string(),
  stripePriceId: v.string(),
  plan: v.string(), // 'starter', 'professional', 'business'
  billingCycle: v.string(), // 'monthly', 'yearly'
  status: v.string(), // 'active', 'past_due', 'canceled', 'trialing'
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  trialEnd: v.optional(v.number()),
});

const usage = defineTable({
  orgId: v.id("organizations"),
  month: v.string(), // '2024-01'
  deadlinesCreated: v.number(),
  documentsUploaded: v.number(),
  storageUsedBytes: v.number(),
  formPreFills: v.number(),
  alertsSent: v.number(),
});
```

CHECKOUT FLOW:

```typescript
// app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  const { orgId, priceId, billingCycle } = await req.json();
  const user = await getCurrentUser();
  
  // Get or create Stripe customer
  let stripeCustomerId = await getStripeCustomerId(orgId);
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { orgId },
    });
    stripeCustomerId = customer.id;
    await saveStripeCustomerId(orgId, stripeCustomerId);
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?canceled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { orgId },
    },
    allow_promotion_codes: true,
  });
  
  return NextResponse.json({ url: session.url });
}
```

WEBHOOK HANDLER:

```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
    
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.orgId;
  
  await convex.mutation(api.billing.updateSubscription, {
    orgId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}
```

USAGE ENFORCEMENT:

```typescript
// convex/billing.ts
export const checkLimit = query({
  args: {
    orgId: v.id("organizations"),
    limitType: v.string(), // 'deadlines', 'users', 'storage', 'formPreFills'
  },
  handler: async (ctx, { orgId, limitType }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .first();
    
    if (!subscription) {
      // Free trial or no subscription
      return { allowed: true, remaining: null, limit: null };
    }
    
    const plan = PLANS[subscription.plan];
    const limit = plan.features[limitType];
    
    if (limit === -1) {
      return { allowed: true, remaining: null, limit: 'unlimited' };
    }
    
    const currentUsage = await getCurrentUsage(ctx, orgId, limitType);
    
    return {
      allowed: currentUsage < limit,
      remaining: Math.max(0, limit - currentUsage),
      limit,
      current: currentUsage,
    };
  },
});

// Middleware for enforcing limits
export async function enforceLimit(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  limitType: string
) {
  const check = await ctx.runQuery(api.billing.checkLimit, { orgId, limitType });
  
  if (!check.allowed) {
    throw new ConvexError({
      code: 'LIMIT_EXCEEDED',
      message: `You've reached your ${limitType} limit. Please upgrade your plan.`,
      limit: check.limit,
      current: check.current,
    });
  }
}
```

BILLING PORTAL:

```typescript
// app/api/stripe/portal/route.ts
export async function POST(req: Request) {
  const { orgId } = await req.json();
  const stripeCustomerId = await getStripeCustomerId(orgId);
  
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

TRIAL MANAGEMENT:

```typescript
// convex/billing.ts
export const getTrialStatus = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .first();
    
    if (!subscription) {
      // Check if org is in trial period (14 days from creation)
      const org = await ctx.db.get(orgId);
      const trialEnd = org.createdAt + 14 * 24 * 60 * 60 * 1000;
      const daysRemaining = Math.ceil((trialEnd - Date.now()) / (24*60*60*1000));
      
      return {
        inTrial: Date.now() < trialEnd,
        daysRemaining: Math.max(0, daysRemaining),
        trialEnd,
        expired: Date.now() >= trialEnd,
      };
    }
    
    if (subscription.status === 'trialing') {
      const daysRemaining = Math.ceil(
        (subscription.trialEnd - Date.now()) / (24*60*60*1000)
      );
      
      return {
        inTrial: true,
        daysRemaining,
        trialEnd: subscription.trialEnd,
        expired: false,
      };
    }
    
    return { inTrial: false, expired: false };
  },
});

// Trial expiry warnings
crons.daily(
  "trial-expiry-warnings",
  { hourUTC: 10, minuteUTC: 0 },
  internal.billing.sendTrialWarnings
);

export const sendTrialWarnings = internalAction({
  handler: async (ctx) => {
    const trialing = await ctx.runQuery(internal.billing.getTrialingOrgs);
    
    for (const org of trialing) {
      const daysRemaining = Math.ceil(
        (org.trialEnd - Date.now()) / (24*60*60*1000)
      );
      
      if ([7, 3, 1, 0].includes(daysRemaining)) {
        await sendTrialWarningEmail(org, daysRemaining);
      }
    }
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/settings/billing/page.tsx - Billing overview
/app/(dashboard)/pricing/page.tsx - Pricing comparison

/components/features/billing/
  - PlanCard.tsx
  - UsageBar.tsx
  - BillingHistory.tsx
  - TrialBanner.tsx
  - UpgradeModal.tsx
  - PlanComparisonTable.tsx
```

---

## Plan 11: Reporting & Analytics

```
/speckit.plan

TECH STACK:
- Charts: Recharts
- PDF Generation: @react-pdf/renderer
- Export: xlsx for Excel, json2csv for CSV

REPORT DATA QUERIES:

```typescript
// convex/reports.ts
export const getComplianceSummary = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.object({
      from: v.number(),
      to: v.number(),
    }),
  },
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .collect();
    
    const inRange = deadlines.filter(
      d => d.dueDate >= dateRange.from && d.dueDate <= dateRange.to
    );
    
    const completed = inRange.filter(d => d.completedAt);
    const onTime = completed.filter(d => d.completedAt <= d.dueDate);
    const late = completed.filter(d => d.completedAt > d.dueDate);
    const overdue = inRange.filter(d => !d.completedAt && d.dueDate < Date.now());
    const pending = inRange.filter(d => !d.completedAt && d.dueDate >= Date.now());
    
    // Score history (monthly)
    const scoreHistory = await getMonthlyScores(ctx, orgId, 12);
    
    // Category breakdown
    const byCategory = groupBy(inRange.filter(d => !d.completedAt), 'category');
    
    return {
      summary: {
        total: inRange.length,
        completed: completed.length,
        onTime: onTime.length,
        late: late.length,
        overdue: overdue.length,
        pending: pending.length,
        completionRate: completed.length / inRange.length * 100,
        onTimeRate: onTime.length / completed.length * 100,
      },
      scoreHistory,
      byCategory: Object.entries(byCategory).map(([category, items]) => ({
        category,
        count: items.length,
        overdue: items.filter(i => i.dueDate < Date.now()).length,
      })),
      upcoming: pending.slice(0, 10).sort((a, b) => a.dueDate - b.dueDate),
      overdueItems: overdue.sort((a, b) => a.dueDate - b.dueDate),
    };
  },
});

export const getTeamPerformance = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await withPermission('audit:read')(ctx, { orgId });
    
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => q.neq(q.field("completedAt"), null))
      .collect();
    
    const byUser = groupBy(deadlines, 'completedBy');
    
    const members = await getOrgMembers(ctx, orgId);
    
    return members.map(member => {
      const userDeadlines = byUser[member.id] || [];
      const onTime = userDeadlines.filter(d => d.completedAt <= d.dueDate);
      
      // Average days before due at completion
      const avgDaysBefore = userDeadlines.reduce((sum, d) => {
        return sum + (d.dueDate - d.completedAt) / (24*60*60*1000);
      }, 0) / userDeadlines.length;
      
      return {
        user: member,
        completed: userDeadlines.length,
        onTimeRate: userDeadlines.length ? onTime.length / userDeadlines.length * 100 : 0,
        avgDaysBefore: Math.round(avgDaysBefore),
        activeAssignments: deadlines.filter(
          d => d.assignedTo === member.id && !d.completedAt
        ).length,
      };
    });
  },
});
```

AUDIT EXPORT:

```typescript
// convex/reports.ts
export const generateAuditReport = action({
  args: {
    orgId: v.id("organizations"),
    complianceArea: v.string(), // 'hipaa', 'licensing', etc.
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  handler: async (ctx, args) => {
    // Get all relevant data
    const deadlines = await ctx.runQuery(internal.deadlines.byCategory, {
      orgId: args.orgId,
      category: args.complianceArea,
      dateRange: args.dateRange,
    });
    
    const documents = await ctx.runQuery(internal.documents.byCategory, {
      orgId: args.orgId,
      category: args.complianceArea,
    });
    
    const alertLog = await ctx.runQuery(internal.alerts.getLog, {
      orgId: args.orgId,
      deadlineIds: deadlines.map(d => d._id),
    });
    
    const activityLog = await ctx.runQuery(internal.audit.getByResource, {
      orgId: args.orgId,
      resourceType: 'deadline',
      resourceIds: deadlines.map(d => d._id),
    });
    
    // Generate PDF report
    const pdf = await generateAuditPdf({
      org: await ctx.runQuery(api.organizations.get, { id: args.orgId }),
      complianceArea: args.complianceArea,
      dateRange: args.dateRange,
      deadlines,
      documents,
      alertLog,
      activityLog,
    });
    
    // Store and return URL
    const storageId = await ctx.storage.store(pdf);
    return await ctx.storage.getUrl(storageId);
  },
});

// PDF generation with @react-pdf/renderer
async function generateAuditPdf(data) {
  const AuditReport = () => (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Compliance Audit Report</Text>
          <Text style={styles.subtitle}>{data.complianceArea.toUpperCase()}</Text>
          <Text style={styles.date}>
            {format(data.dateRange.from, 'MMM d, yyyy')} - 
            {format(data.dateRange.to, 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.orgInfo}>
          <Text>{data.org.name}</Text>
          <Text>Generated: {format(new Date(), 'PPP')}</Text>
        </View>
      </Page>
      
      {/* Table of Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Table of Contents</Text>
        <Text>1. Executive Summary</Text>
        <Text>2. Deadline Compliance History</Text>
        <Text>3. Documentation Inventory</Text>
        <Text>4. Alert Delivery Log</Text>
        <Text>5. Activity Timeline</Text>
      </Page>
      
      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>1. Executive Summary</Text>
        <View style={styles.stats}>
          <Text>Total Requirements: {data.deadlines.length}</Text>
          <Text>Completed On-Time: {data.stats.onTime}</Text>
          <Text>Documents on File: {data.documents.length}</Text>
        </View>
      </Page>
      
      {/* Deadline History */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>2. Deadline Compliance History</Text>
        <View style={styles.table}>
          {data.deadlines.map(d => (
            <View key={d._id} style={styles.tableRow}>
              <Text style={styles.cell}>{d.title}</Text>
              <Text style={styles.cell}>{format(d.dueDate, 'MMM d, yyyy')}</Text>
              <Text style={styles.cell}>
                {d.completedAt ? format(d.completedAt, 'MMM d, yyyy') : 'Pending'}
              </Text>
              <Text style={styles.cell}>
                {d.completedAt && d.completedAt <= d.dueDate ? '✓ On Time' : 
                 d.completedAt ? '⚠ Late' : '—'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
      
      {/* ... more pages for documents, alerts, activity */}
    </Document>
  );
  
  return await renderToBuffer(<AuditReport />);
}
```

CUSTOM REPORT BUILDER:

```typescript
// convex/reports.ts
const saved_reports = defineTable({
  orgId: v.id("organizations"),
  name: v.string(),
  config: v.object({
    dateRangeType: v.string(), // 'last30', 'lastQuarter', 'custom'
    customDateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
    categories: v.array(v.string()),
    metrics: v.array(v.string()), // which data points to include
    chartTypes: v.array(v.string()),
    groupBy: v.optional(v.string()),
  }),
  schedule: v.optional(v.object({
    frequency: v.string(), // 'weekly', 'monthly', 'quarterly'
    recipients: v.array(v.string()),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
  })),
  createdAt: v.number(),
  createdBy: v.string(),
});

export const runCustomReport = query({
  args: {
    orgId: v.id("organizations"),
    config: v.object({/* ... */}),
  },
  handler: async (ctx, { orgId, config }) => {
    const dateRange = resolveDateRange(config.dateRangeType, config.customDateRange);
    
    let deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => 
        q.and(
          q.gte(q.field("dueDate"), dateRange.from),
          q.lte(q.field("dueDate"), dateRange.to)
        )
      )
      .collect();
    
    if (config.categories.length > 0) {
      deadlines = deadlines.filter(d => config.categories.includes(d.category));
    }
    
    const result: any = {};
    
    for (const metric of config.metrics) {
      switch (metric) {
        case 'completion_rate':
          result.completionRate = calculateCompletionRate(deadlines);
          break;
        case 'on_time_rate':
          result.onTimeRate = calculateOnTimeRate(deadlines);
          break;
        case 'by_category':
          result.byCategory = groupAndCount(deadlines, 'category');
          break;
        case 'by_status':
          result.byStatus = groupAndCount(deadlines, 'status');
          break;
        case 'trend':
          result.trend = calculateTrend(deadlines, config.groupBy || 'month');
          break;
      }
    }
    
    return result;
  },
});
```

COST AVOIDANCE ESTIMATE:

```typescript
// convex/reports.ts
export const getCostAvoidance = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.object({ from: v.number(), to: v.number() }),
  },
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => q.neq(q.field("completedAt"), null))
      .collect();
    
    const onTimeCompletions = deadlines.filter(
      d => d.completedAt <= d.dueDate &&
           d.completedAt >= dateRange.from &&
           d.completedAt <= dateRange.to
    );
    
    // Estimate based on category
    const penalties = {
      license: 5000,      // Average license violation
      certification: 3000,
      training: 1000,
      audit: 10000,
      filing: 2000,
    };
    
    let totalAvoided = 0;
    const breakdown = [];
    
    for (const d of onTimeCompletions) {
      const penalty = penalties[d.category] || 1000;
      totalAvoided += penalty;
      breakdown.push({
        deadline: d.title,
        category: d.category,
        estimatedPenalty: penalty,
      });
    }
    
    return {
      totalAvoided,
      deadlinesCompletedOnTime: onTimeCompletions.length,
      breakdown,
      disclaimer: 'Estimates based on average industry penalties. Actual penalties vary.',
    };
  },
});
```

FRONTEND COMPONENTS:

/app/(dashboard)/reports/page.tsx - Report dashboard
/app/(dashboard)/reports/compliance/page.tsx - Compliance summary
/app/(dashboard)/reports/team/page.tsx - Team performance
/app/(dashboard)/reports/audit/page.tsx - Audit export wizard
/app/(dashboard)/reports/custom/page.tsx - Report builder

/components/features/reports/
  - ComplianceScoreChart.tsx (line chart over time)
  - CategoryBreakdownChart.tsx (pie/bar)
  - TeamPerformanceTable.tsx
  - AuditExportWizard.tsx
  - ReportBuilder.tsx
  - CostAvoidanceCard.tsx
  - ReportScheduler.tsx
  - ExportButtons.tsx (PDF, Excel, CSV)
```

---

## Summary: All Plans

| Spec | Key Technologies | Estimated Complexity |
|------|------------------|---------------------|
| 1. Deadline Management | Convex CRUD, Zod, React Hook Form | Medium |
| 2. Alert System | Convex Cron, Resend, Twilio | High |
| 3. Document Vault | Convex Storage, Claude Vision OCR | High |
| 4. AI Form Pre-fill | Claude API, pdf-lib | High |
| 5. Industry Templates | Static JSON, Convex versioning | Medium |
| 6. Dashboard | Recharts, Convex reactive queries | Medium |
| 7. Calendar View | FullCalendar, ical.js | Medium |
| 8. Team Management | Clerk Organizations, RBAC | Medium |
| 9. Onboarding | Custom wizard, Resend | Low-Medium |
| 10. Billing | Stripe Subscriptions, Webhooks | Medium-High |
| 11. Reporting | Recharts, @react-pdf/renderer | Medium |

---

Ready for task breakdown with `/speckit.tasks`?