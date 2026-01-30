# Implementation Documentation

Track all implementations to prevent code duplication, mismatches, and maintain consistency.

---

## Shared Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `cn()` | `src/lib/utils.ts` | Merge Tailwind classes (clsx + twMerge) |
| `calculateStatus()` | `src/lib/utils/status.ts` | Deadline status from dueDate/completedAt |
| `getStatusColor()` | `src/lib/utils/status.ts` | Status → Tailwind color classes |
| `getStatusLabel()` | `src/lib/utils/status.ts` | Status → human-readable label |
| `calculateNextDueDate()` | `src/lib/utils/recurrence.ts` | Next occurrence from recurrence pattern |
| `generateNextDeadline()` | `src/lib/utils/recurrence.ts` | Clone deadline for next recurrence |
| `addDays()`, `addMonths()` | `src/lib/utils/recurrence.ts` | Date math with edge case handling |
| `ClaudeOCRAdapter` | `lib/adapters/ocr/claude.ts` | Text extraction from images via Claude Vision API |
| `OCRAdapter` interface | `lib/adapters/ocr/interface.ts` | Adapter pattern for swappable OCR providers |
| `formatFileSize()` | `types/document.ts` | Human-readable file size formatting (KB/MB/GB) |
| `getFileType()` | `types/document.ts` | Extract file extension from filename |
| `isAllowedFileType()` | `types/document.ts` | Validate file type against ALLOWED_FILE_TYPES |
| `validateFile()` | `lib/validations/document.ts` | Combined file validation (type, size, name) |
| `DEFAULT_PREFERENCES` | `convex/alerts.ts` | Canonical alert defaults - alertDays: [30,14,7,3,1,0], channel mappings per urgency |
| `URGENCY_THRESHOLDS` | `convex/alerts.ts` | Urgency boundaries (early:14d, medium:7d, high:1d, critical:0d) |
| `getUrgencyFromDays()` | `convex/alerts.ts` | Calculate alert urgency from days before deadline |
| `getChannelsForUrgency()` | `convex/alerts.ts` | Map urgency level to notification channels from preferences |
| `MAX_RETRY_ATTEMPTS` | `convex/alerts.ts` | 3 retries before escalation (constant) |
| `RETRY_DELAYS` | `convex/alerts.ts` | [15min, 30min, 45min] exponential backoff delays |
| `getUrgencyForDays()` | `convex/templates.ts` | Calculate alert urgency from days (duplicate of alerts.ts version) |
| `EmailAdapter` interface | `src/lib/adapters/email/interface.ts` | Adapter pattern for swappable email providers |
| `ResendEmailAdapter` | `src/lib/adapters/email/resend.ts` | Resend impl with 30s timeout, 3 retries, exp backoff |
| `createResendAdapter()` | `src/lib/adapters/email/resend.ts` | Factory from env vars (RESEND_API_KEY, RESEND_FROM_EMAIL) |
| `SMSAdapter` interface | `src/lib/adapters/sms/interface.ts` | Adapter pattern for swappable SMS providers |
| `TwilioSMSAdapter` | `src/lib/adapters/sms/twilio.ts` | Twilio impl with 30s timeout, 3 retries, exp backoff |
| `createTwilioAdapter()` | `src/lib/adapters/sms/twilio.ts` | Factory from env vars (TWILIO_ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER) |
| `formatSMSByUrgency()` | `src/lib/adapters/sms/interface.ts` | Urgency → SMS message text with emoji prefix |
| `renderDeadlineAlertEmail()` | `src/lib/email/templates/DeadlineAlertEmail.tsx` | Render HTML email with urgency banner |
| `renderDeadlineAlertPlainText()` | `src/lib/email/templates/DeadlineAlertEmail.tsx` | Plain text version of alert email |
| `getEmailSubject()` | `src/lib/email/templates/DeadlineAlertEmail.tsx` | Urgency-aware email subject with emoji |
| `extractFormFields()` | `lib/pdf/extractor.ts` | Extract fillable fields from PDF using pdf-lib |
| `getFormFieldSummary()` | `lib/pdf/extractor.ts` | Count fields by type, signature/required fields |
| `fillPdfForm()` | `lib/pdf/filler.ts` | Fill PDF form fields by type (text/checkbox/dropdown/radio) |
| `validatePdfHasForm()` | `lib/pdf/filler.ts` | Check if PDF has fillable AcroForm |
| `getMappingCoverage()` | `lib/pdf/filler.ts` | Calculate fill coverage percentage |
| `matchFieldsToProfile()` | `lib/forms/matcher.ts` | Map AI field analysis to org profile values |
| `buildFormValues()` | `lib/forms/matcher.ts` | Combine profile data + user overrides |
| `getMatchStats()` | `lib/forms/matcher.ts` | Match percentage and confidence breakdown |
| `suggestProfileKey()` | `lib/forms/matcher.ts` | Heuristic field name → profile key matching |
| `validateEINChecksum()` | `lib/validations/profile.ts` | IRS EIN format + prefix validation |
| `formatPhoneNumber()` | `lib/validations/profile.ts` | Normalize phone to standard format |
| `formatEIN()` | `lib/validations/profile.ts` | Format EIN as XX-XXXXXXX |
| `calculateComplianceScore()` | `lib/utils/score.ts` | 0-100 score based on deadline statuses (overdue=-30, due_today=-10, due_soon=0, on_track=+5, completed=+10) |
| `deadlinesToCalendarEvents()` | `lib/calendar/transformer.ts` | Convert deadlines to FullCalendar EventInput format |
| `generateICalFeed()` | `lib/calendar/ical.ts` | Generate .ics file with VEVENT and VALARM components |
| `PLANS` | `lib/billing/plans.ts` | Plan definitions: starter, professional, business with limits/prices |
| `getPlanById()` | `lib/billing/plans.ts` | Get plan config by plan ID |
| `getPlanByPriceId()` | `lib/billing/plans.ts` | Get plan config by Stripe price ID |
| `formatTemplateDueDate()` | `lib/utils/template-dates.ts` | Format template deadline due date based on anchor type |
| `calculateSuggestedDate()` | `lib/utils/template-dates.ts` | Suggest due date for anniversary/custom anchor types |
| `compareVersions()` | `lib/utils/template-version.ts` | Semver comparison for template version updates |
| `renderOnboardingReminderEmail()` | `lib/email/templates/OnboardingReminderEmail.tsx` | HTML email for incomplete onboarding |
| `renderTrialWarningEmail()` | `lib/email/templates/TrialWarningEmail.tsx` | HTML email for trial expiring warnings |
| `resolveDateRange()` | `convex/reports.ts` | Convert dateRangeType (last_7_days, etc.) to {from, to} timestamps |
| `groupBy()` | `convex/reports.ts` | Group array items by key for category/user aggregation |
| `calculateNextRunTime()` | `convex/reports.ts` | Calculate next scheduled report run based on frequency |
| `generatePdfDocument()` | `convex/auditReports.ts` | Multi-page PDF generation with pdf-lib (cover, TOC, sections) |
| `convertToCSV()` | `components/features/reports/ExportButtons.tsx` | Convert data to CSV format with escaping |

---

## Implemented Features

### Spec 001: Deadline Management
| Task | Files | Notes |
|------|-------|-------|
| Schema | `convex/schema.ts` | deadlines + deadline_audit_log tables; indexes: by_org, by_org_due, by_org_category, by_org_assigned, by_org_deleted |
| Types | `src/types/deadline.ts` | DeadlineStatus, DeadlineCategory, RecurrencePattern, Deadline, DeadlineWithStatus, filters, audit types; DUE_SOON_DAYS=14 |
| Validation | `src/lib/validations/deadline.ts` | Zod: createDeadlineSchema, updateDeadlineSchema, deadlineFiltersSchema, recurrenceSchema |
| Queries | `convex/deadlines.ts` | list, get, upcoming, overdue, byCategory, trash, auditHistory |
| Mutations | `convex/deadlines.ts` | create, update, complete, softDelete, restore, hardDelete + internal alert helpers |
| StatusBadge | `src/components/features/deadlines/DeadlineStatusBadge.tsx` | Color+icon badges (red/amber/blue/green), sizes: sm/md/lg |
| DeadlineCard | `src/components/features/deadlines/DeadlineCard.tsx` | Card display + skeleton loader, onComplete action |
| DeadlineForm | `src/components/features/deadlines/DeadlineForm.tsx` | react-hook-form + Zod, create/edit modes |
| RecurrenceSelector | `src/components/features/deadlines/RecurrenceSelector.tsx` | Toggle, frequency dropdown, interval, end date, preview text |
| DeadlineFilters | `src/components/features/deadlines/DeadlineFilters.tsx` | Popover with status/category checkboxes, clear button |
| List Page | `src/app/(dashboard)/deadlines/page.tsx` | Filtered list, skeleton loading, empty state |
| Create Page | `src/app/(dashboard)/deadlines/new/page.tsx` | Form wrapper, redirect on success |
| Detail Page | `src/app/(dashboard)/deadlines/[id]/page.tsx` | View/edit modes, complete/delete dialogs, audit history |

### Spec 002: Alert/Notification System
| Task | Files | Notes |
|------|-------|-------|
| Schema: alerts, alert_preferences, notifications, alert_audit_log | `convex/schema.ts` | Indexes: by_scheduled, by_deadline, by_org, by_org_status, by_org_user, by_user, by_alert |
| Alert scheduling | `convex/alerts.ts` | `scheduleAlertsForDeadline`, `rescheduleAlerts`, `cancelPendingAlerts` |
| Alert processing | `convex/alerts.ts` | `processAlert`, `processDueAlerts` (cron), `escalateAlert`; email via Resend, SMS via Twilio |
| Alert state mgmt | `convex/alerts.ts` | `markSent`, `markDelivered`, `markFailed`, `acknowledge`, `snooze`, `unsnooze`, `retry` |
| Alert queries | `convex/alerts.ts` | `get`, `listByDeadline`, `listByOrg`, `getFailedAlerts`, `getPreferences`, `getAlertHistory` |
| Preferences | `convex/alerts.ts` | `savePreferences`, `DEFAULT_PREFERENCES` (alertDays: [30,14,7,3,1,0]) |
| Notifications | `convex/notifications.ts` | `getUnread`, `list`, `getUnreadCount`, `create`, `markRead`, `markAllRead`, `remove` |
| Cron job | `convex/crons.ts` | `process-due-alerts` every 15 min → `internal.alerts.processDueAlerts` |
| Urgency mapping | `convex/alerts.ts` | `getUrgencyFromDays()`, `URGENCY_THRESHOLDS` (early:14d, medium:7d, high:1d, critical:0d) |
| Channel routing | `convex/alerts.ts` | `getChannelsForUrgency()` maps urgency to channels per preferences |
| Types | `types/alert.ts` | AlertChannel, AlertUrgency, AlertStatus, Alert, AlertPreferences, DEFAULT_ALERT_PREFERENCES, SNOOZE_OPTIONS |
| Email adapter | `src/lib/adapters/email/` | `EmailAdapter` interface, `ResendEmailAdapter` impl; 30s timeout, 3 retries w/ exponential backoff |
| SMS adapter | `src/lib/adapters/sms/` | `SMSAdapter` interface, `TwilioSMSAdapter` impl; `formatSMSByUrgency()` for message templates |
| Email template | `src/lib/email/templates/DeadlineAlertEmail.tsx` | Urgency-aware HTML/text; `renderDeadlineAlertEmail()`, `getEmailSubject()` |
| AlertStatusBadge | `components/features/alerts/AlertStatusBadge.tsx` | Status+urgency badges with color coding |
| AlertHistory | `components/features/alerts/AlertHistory.tsx` | Lists alerts by deadline/org with status, channel, timestamps |
| SnoozeButton | `components/features/alerts/SnoozeButton.tsx` | Dropdown: 1h/4h/1d/1w snooze options |
| AlertPreferencesForm | `components/features/alerts/AlertPreferencesForm.tsx` | Channel selection per urgency, alert days, phone, escalation |
| Alert Settings page | `app/(dashboard)/settings/alerts/page.tsx` | Tabs: Preferences + History |
| Unit tests | `tests/unit/email-adapter.test.ts`, `tests/unit/sms-adapter.test.ts` | 27 tests: retry logic, timeout, batch sending |

### Spec 003: Document Vault
| Task | Files | Notes |
|------|-------|-------|
| Schema: documents, document_access_log | `convex/schema.ts` | Indexes: by_org, by_org_category, by_org_deleted, by_org_filename; Search index on extractedText |
| TypeScript types & constants | `types/document.ts` | Document, DocumentAccessLog, DocumentCategory, DOCUMENT_CATEGORIES, ALLOWED_FILE_TYPES, helpers |
| Zod validation schemas | `lib/validations/document.ts` | File upload, search, category validation; path traversal protection |
| Upload/save mutations | `convex/documents.ts` | generateUploadUrl, saveDocument (auto-versioning), logAccess |
| Text extraction | `convex/documents.ts`, `lib/adapters/ocr/` | extractText action, ClaudeOCRAdapter (adapter pattern for OCR) |
| Document queries | `convex/documents.ts` | get, getWithUrl, list, listDeleted, search, getVersionHistory, getAccessLog |
| Soft-delete & retention | `convex/documents.ts`, `convex/crons.ts` | softDelete, restore, hardDelete; daily purge cron (30-day retention) |
| Audit export | `convex/documents.ts` | generateAuditExport action (ZIP with cover sheet, TOC) |
| DocumentUploader | `components/features/documents/DocumentUploader.tsx` | Drag-drop, multi-file, progress, category selector |
| DocumentCard | `components/features/documents/DocumentCard.tsx` | File icon, metadata, version badge, quick actions |
| DocumentPreview | `components/features/documents/DocumentPreview.tsx` | PDF/image preview, zoom, download, print |
| DocumentSearch | `components/features/documents/DocumentSearch.tsx` | Full-text search, category/date filters, debounced |
| DocumentVersionHistory | `components/features/documents/DocumentVersionHistory.tsx` | Version list, per-version download |
| DocumentCategorySelector | `components/features/documents/DocumentCategorySelector.tsx` | Multi-select dropdown with icons |
| AuditExportWizard | `components/features/documents/AuditExportWizard.tsx` | 5-step wizard for audit package generation |
| Documents list page | `app/(dashboard)/documents/page.tsx` | Grid/list toggle, search, upload dialog |
| Document detail page | `app/(dashboard)/documents/[id]/page.tsx` | Preview, metadata sidebar, version history |

### Spec 004: AI Form Prefill
| Task | Files | Notes |
|------|-------|-------|
| Schema | `convex/schema.ts` | organization_profiles (EIN encrypted), form_templates (orgId null=system), form_fills; indexes by_org |
| Types: forms | `types/form.ts` | FormFieldType, SemanticFieldType (18 types), ConfidenceLevel, FieldMapping, FieldAnalysis, FormTemplate, FormFill |
| Types: profiles | `types/profile.ts` | OrganizationProfile, Address, Phone, Email, LicenseNumber, Officer; address types: primary/mailing/billing |
| Validation | `lib/validations/profile.ts` | Zod: einSchema (XX-XXXXXXX), phoneNumberSchema, emailAddressSchema, stateSchema (50 states+), organizationProfileSchema |
| PDF extractor | `lib/pdf/extractor.ts` | extractFormFields, getFormFieldSummary; uses pdf-lib |
| PDF filler | `lib/pdf/filler.ts` | fillPdfForm (text/checkbox/dropdown/radio), dropdown matching: exact→case-insensitive→partial→editable |
| Field matcher | `lib/forms/matcher.ts` | matchFieldsToProfile, buildFormValues, getMatchStats, suggestProfileKey |
| Profiles backend | `convex/profiles.ts` | get, upsert, getCompletionStatus; EIN encryption (XOR+base64, TODO: AES) |
| Forms backend | `convex/forms.ts` | analyzeForm (Claude+pdf-lib), fillFromTemplate, createTemplate, recordFill, listTemplates, listFills |
| API route | `app/api/forms/analyze/route.ts` | POST: bridge frontend→Convex analyzeForm action |
| FormUploader | `components/features/forms/FormUploader.tsx` | Drag-drop PDF, 10MB limit, progress tracking |
| FormAnalysisPreview | `components/features/forms/FormAnalysisPreview.tsx` | Field list with confidence indicators (high/medium/low) |
| FieldMappingEditor | `components/features/forms/FieldMappingEditor.tsx` | Edit mappings, dropdown options, manual values, reset/clear |
| FormFillReview | `components/features/forms/FormFillReview.tsx` | Final review, inline edit, signature field callout, download |
| OrgProfileEditor | `components/features/forms/OrgProfileEditor.tsx` | Full profile form with dynamic arrays, auto-save, completion % |
| FormTemplateCard | `components/features/forms/FormTemplateCard.tsx` | Template card: name, industry, usage count, quick actions |
| Forms list page | `app/(dashboard)/forms/page.tsx` | Template grid, upload button, empty state |
| Fill wizard page | `app/(dashboard)/forms/fill/page.tsx` | 4-step: upload→analyze→edit→review+generate |
| History page | `app/(dashboard)/forms/history/page.tsx` | Audit trail: template, date, user, download |

### Spec 005: Industry Templates
| Task | Files | Notes |
|------|-------|-------|
| Schema: industry_templates, template_imports | `convex/schema.ts` | Indexes: by_slug, by_industry, by_active, by_org, by_template, by_org_template |
| Template queries | `convex/templates.ts` | `list`, `getBySlug`, `getIndustries`, `getOrgImport` |
| Template import | `convex/templates.ts` | `importTemplate` creates deadlines + schedules alerts from template |
| Template seeding | `convex/templates.ts` | `seedTemplate` (internal) for populating/updating templates idempotently |
| Update notifications | `convex/templates.ts` | `checkForUpdates` (cron), `notifyTemplateUpdate` creates in-app notification |
| Internal queries | `convex/templates.ts` | `getAllImports`, `getTemplateById` for cron job |
| Cron job | `convex/crons.ts` | `check-template-updates` daily at 6 AM UTC |
| TemplateCard | `components/features/templates/TemplateCard.tsx` | Display individual template with deadline count, industry badge |
| TemplateDeadlineList | `components/features/templates/TemplateDeadlineList.tsx` | List deadlines within template with recurrence, importance |
| TemplateImportWizard | `components/features/templates/TemplateImportWizard.tsx` | Multi-step wizard: select deadlines → customize dates → confirm |
| DateCustomizer | `components/features/templates/DateCustomizer.tsx` | Date picker for anniversary/custom anchor types |
| TemplateUpdateNotice | `components/features/templates/TemplateUpdateNotice.tsx` | Banner when newer template version available |
| RegulatoryReferenceLinks | `components/features/templates/RegulatoryReferenceLinks.tsx` | Display regulatory body links |
| Templates list page | `app/(dashboard)/templates/page.tsx` | Grid view with industry filter, search |
| Template detail page | `app/(dashboard)/templates/[slug]/page.tsx` | Full template view with import button |
| Import page | `app/(dashboard)/templates/import/page.tsx` | Import wizard wrapper |

### Spec 006: Dashboard Overview
| Task | Files | Notes |
|------|-------|-------|
| Dashboard queries | `convex/dashboard.ts` | `getDashboardData` (stats, score, categories), `getRecentActivity`, `getStatsSummary` |
| Dashboard prefs | `convex/dashboard.ts` | `getPreferences`, `savePreferences`; `logActivity` for audit trail |
| ComplianceScoreCard | `components/features/dashboard/ComplianceScoreCard.tsx` | Circular progress with score 0-100, color-coded |
| CriticalAlertsSection | `components/features/dashboard/CriticalAlertsSection.tsx` | List critical/high urgency alerts with actions |
| DueThisWeekSection | `components/features/dashboard/DueThisWeekSection.tsx` | Deadlines due within 7 days with complete action |
| DeadlineAlertItem | `components/features/dashboard/DeadlineAlertItem.tsx` | Individual alert row with snooze/acknowledge |
| QuickStatsBar | `components/features/dashboard/QuickStatsBar.tsx` | Row of stat cards (overdue, due today, due week) |
| StatCard | `components/features/dashboard/StatCard.tsx` | Individual stat with icon, value, trend |
| RecentActivityFeed | `components/features/dashboard/RecentActivityFeed.tsx` | Activity log with 20 action types, links to targets |
| UpcomingSection | `components/features/dashboard/UpcomingSection.tsx` | Upcoming deadlines list view |
| CategoryBreakdownChart | `components/features/dashboard/CategoryBreakdownChart.tsx` | Recharts pie/bar chart by category |
| QuickActionsBar | `components/features/dashboard/QuickActionsBar.tsx` | Create deadline, upload doc, invite team buttons |
| DashboardSkeleton | `components/features/dashboard/DashboardSkeleton.tsx` | Loading state skeleton |
| Dashboard page | `app/(dashboard)/page.tsx` | Main dashboard combining all sections + onboarding checklist |

### Spec 007: Calendar View
| Task | Files | Notes |
|------|-------|-------|
| Calendar queries | `convex/calendar.ts` | `listForCalendar` (date range), `getDeadlinesForDate`, `getCategories`, `getAssignees` |
| iCal generation | `lib/calendar/ical.ts` | `generateICalFeed()` for .ics export with VEVENT, VALARM |
| Calendar transformer | `lib/calendar/transformer.ts` | `deadlinesToCalendarEvents()` converts to FullCalendar format |
| Calendar config | `lib/calendar/config.ts` | Default views, colors, time settings |
| CalendarFilters | `components/features/calendar/CalendarFilters.tsx` | Category/assignee/status filters in popover |
| StatusDot | `components/features/calendar/StatusDot.tsx` | Colored dot indicator for deadline status |
| DeadlineQuickView | `components/features/calendar/DeadlineQuickView.tsx` | Popover on event click with details, actions |
| EventContent | `components/features/calendar/EventContent.tsx` | Custom FullCalendar event renderer |
| MiniCalendar | `components/features/calendar/MiniCalendar.tsx` | Compact calendar widget for sidebar |
| CalendarExportMenu | `components/features/calendar/CalendarExportMenu.tsx` | Export dropdown: iCal, Google, Outlook links |
| CalendarPrintView | `components/features/calendar/CalendarPrintView.tsx` | Print-friendly layout with react-to-print |
| Calendar page | `app/(dashboard)/calendar/page.tsx` | FullCalendar integration with month/week/day views |
| iCal API route | `app/api/calendar/[orgId]/feed.ics/route.ts` | Public iCal feed endpoint |

### Spec 008: Org/Team Management
| Task | Files | Notes |
|------|-------|-------|
| Team queries | `convex/team.ts` | `listMembers`, `getMemberCount`, `listPendingInvitations`, `getCurrentUserRole` |
| Invitation mutations | `convex/team.ts` | `invite`, `revokeInvitation`, `acceptInvitation`; email via Resend |
| Role mutations | `convex/team.ts` | `updateRole`, `transferOwnership`; audit logged |
| Member mutations | `convex/team.ts` | `removeMember`, `leaveOrganization`; reassignment handling |
| Organizations query | `convex/organizations.ts` | `listByUser` returns orgs for current user |
| InviteModal | `components/features/team/InviteModal.tsx` | Email + role selector dialog |
| MemberCard | `components/features/team/MemberCard.tsx` | Avatar, name, role badge, actions menu |
| PendingInvitations | `components/features/team/PendingInvitations.tsx` | List invites with revoke action |
| RemoveMemberDialog | `components/features/team/RemoveMemberDialog.tsx` | Confirmation with reassignment option |
| RoleSelector | `components/features/team/RoleSelector.tsx` | Dropdown for owner/admin/manager/member/viewer |
| WorkloadChart | `components/features/team/WorkloadChart.tsx` | Recharts bar chart of deadlines per member |
| Team settings page | `app/(dashboard)/settings/team/page.tsx` | Members list, invite button, pending invites |

### Spec 009: Onboarding
| Task | Files | Notes |
|------|-------|-------|
| Schema: onboarding_progress | `convex/schema.ts` | Indexes: by_org, by_user; 7 steps tracked |
| Progress queries | `convex/onboarding.ts` | `getProgress`, `getProgressByUser` |
| Progress mutations | `convex/onboarding.ts` | `initializeProgress`, `markStepComplete`, `markComplete`, `resetProgress` |
| Re-engagement | `convex/onboarding.ts` | `getIncomplete` (internal), `sendOnboardingReminders` action |
| Reminder cron | `convex/crons.ts` | Daily at 2 PM UTC; 24h and 7d reminders |
| Reminder email | `lib/email/templates/OnboardingReminderEmail.tsx` | HTML email with incomplete steps, CTA |
| OnboardingWizard | `components/features/onboarding/OnboardingWizard.tsx` | Multi-step wizard with progress bar |
| OrgSetupStep | `components/features/onboarding/OrgSetupStep.tsx` | Org name, industry, timezone |
| TemplateImportStep | `components/features/onboarding/TemplateImportStep.tsx` | Select template, choose deadlines |
| AlertSetupStep | `components/features/onboarding/AlertSetupStep.tsx` | Configure alert channels, days |
| FirstDeadlineStep | `components/features/onboarding/FirstDeadlineStep.tsx` | Create first deadline form |
| TeamInviteStep | `components/features/onboarding/TeamInviteStep.tsx` | Batch invite team members |
| ProgressIndicator | `components/features/onboarding/ProgressIndicator.tsx` | Step dots with completion status |
| OnboardingChecklist | `components/features/onboarding/OnboardingChecklist.tsx` | Inline checklist for dashboard |
| Dashboard integration | `app/(dashboard)/page.tsx` | Shows checklist when onboarding incomplete |

### Spec 010: Billing/Subscription
| Task | Files | Notes |
|------|-------|-------|
| Schema: subscriptions, usage_records | `convex/schema.ts` | Indexes: by_org, by_customer, by_org_metric |
| Plan definitions | `lib/billing/plans.ts` | Starter/Pro/Business tiers with limits, prices |
| Subscription queries | `convex/billing.ts` | `getSubscription`, `getTrialStatus`, `getCurrentUsage`, `checkLimit` |
| Stripe customer | `convex/billing.ts` | `getOrCreateStripeCustomerId` mutation |
| Subscription lifecycle | `convex/billing.ts` | `createSubscription`, `updateSubscription`, `cancelSubscription` (internal) |
| Usage tracking | `convex/billing.ts` | `incrementUsage`, `checkLimitInternal` for enforcing limits |
| Trial warnings | `convex/billing.ts` | `sendTrialWarnings` action, `checkTrialWarningSent`, `recordTrialWarning` |
| Trial email | `lib/email/templates/TrialWarningEmail.tsx` | 3-day and 1-day warning emails |
| Stripe checkout | `app/api/stripe/checkout/route.ts` | Create Stripe Checkout session |
| Stripe portal | `app/api/stripe/portal/route.ts` | Redirect to Stripe billing portal |
| Stripe webhooks | `app/api/stripe/webhook/route.ts` | Handle checkout.completed, subscription.*, invoice.* events |
| PlanCard | `components/features/billing/PlanCard.tsx` | Plan display with features, price, CTA |
| PlanComparisonTable | `components/features/billing/PlanComparisonTable.tsx` | Side-by-side plan comparison |
| UsageBar | `components/features/billing/UsageBar.tsx` | Progress bar with current/limit |
| TrialBanner | `components/features/billing/TrialBanner.tsx` | Dismissible banner with days remaining |
| UpgradeModal | `components/features/billing/UpgradeModal.tsx` | Plan selection dialog |
| Billing settings page | `app/(dashboard)/settings/billing/page.tsx` | Current plan, usage, upgrade options |
| Pricing page | `app/(marketing)/pricing/page.tsx` | Public pricing with plan comparison |

### Spec 011: Reporting/Analytics
| Task | Files | Notes |
|------|-------|-------|
| Schema: saved_reports | `convex/schema.ts` | Indexes: by_org, by_org_type, by_created_by; config + schedule fields |
| Compliance summary | `convex/reports.ts` | `getComplianceSummary` returns stats, scoreHistory (12mo), byCategory, upcoming, overdueItems |
| Team performance | `convex/reports.ts` | `getTeamPerformance` per-member: completed, onTimeRate, avgDaysBefore, activeAssignments |
| Cost avoidance | `convex/reports.ts` | `getCostAvoidance` estimates penalties avoided with category breakdown + disclaimer |
| Custom reports | `convex/reports.ts` | `runCustomReport` flexible query with dateRange, categories, metrics, groupBy |
| Saved reports | `convex/reports.ts` | `saveReport`, `listSavedReports`, `getSavedReport`, `deleteSavedReport` |
| Report scheduling | `convex/reports.ts` | `updateReportSchedule`, `getScheduledReportsToRun`; daily/weekly/monthly |
| Audit PDF generation | `convex/auditReports.ts` | `generateAuditReport` action; multi-page PDF with pdf-lib |
| Audit internal queries | `convex/auditReports.ts` | `getOrgInfo`, `getDeadlinesByCategory`, `getDocumentsByCategory`, `getAlertLogForDeadlines`, `getActivityForDeadlines` |
| ComplianceScoreChart | `components/features/reports/ComplianceScoreChart.tsx` | Recharts line chart, 12-month trend, target line |
| CategoryBreakdownChart | `components/features/reports/CategoryBreakdownChart.tsx` | Horizontal bar chart by category with overdue counts |
| TeamPerformanceTable | `components/features/reports/TeamPerformanceTable.tsx` | Sortable table with performance indicators, color-coded rates |
| CostAvoidanceCard | `components/features/reports/CostAvoidanceCard.tsx` | Dollar amount, category breakdown, disclaimer |
| AuditExportWizard | `components/features/reports/AuditExportWizard.tsx` | 4-step wizard: category → dateRange → confirm → download |
| ReportBuilder | `components/features/reports/ReportBuilder.tsx` | Metric/category selectors, chart types, save config |
| ReportScheduler | `components/features/reports/ReportScheduler.tsx` | Frequency, recipients, day selection dialog |
| ExportButtons | `components/features/reports/ExportButtons.tsx` | CSV/JSON export with data conversion helpers |
| Reports dashboard | `app/(dashboard)/reports/page.tsx` | Report type cards, saved reports list |
| Compliance page | `app/(dashboard)/reports/compliance/page.tsx` | Stats, charts, cost avoidance, overdue/upcoming lists |
| Team page | `app/(dashboard)/reports/team/page.tsx` | Performance table, workload distribution |
| Audit page | `app/(dashboard)/reports/audit/page.tsx` | AuditExportWizard integration |
| Custom page | `app/(dashboard)/reports/custom/page.tsx` | ReportBuilder with live visualization

---

## Reusable Patterns

| Pattern | Example Location | When to Use |
|---------|------------------|-------------|
| Status calc (computed not stored) | `convex/deadlines.ts:get()` | Any entity with time-based status |
| Soft-delete with `deletedAt` | `convex/schema.ts:deadlines` | All user-deletable entities |
| Audit logging table | `convex/schema.ts:deadline_audit_log` | Any entity needing change history |
| Zod + react-hook-form | `DeadlineForm.tsx` | All form components |
| Skeleton loader component | `DeadlineCardSkeleton` | All list item loading states |
| Popover filter UI | `DeadlineFilters.tsx` | Multi-select filter interfaces |
| Confirmation dialog | `[id]/page.tsx` | Destructive/important actions |
| StatusBadge with icon+color | `DeadlineStatusBadge.tsx` | Any status indicator (accessibility) |
| Adapter pattern for external APIs | `lib/adapters/ocr/` | Any swappable external service (OCR, AI, email, etc.) |
| Auto-versioning on upload | `convex/documents.ts:saveDocument` | When same-name uploads should create versions, not overwrite |
| Access logging mutation | `convex/documents.ts:logAccess` | Track user actions (view/download/update/delete) for audit |
| Async background processing | `convex/documents.ts:extractText` | Heavy operations after user action (OCR, PDF parsing) |
| Multi-step wizard UI | `AuditExportWizard.tsx` | Complex flows with progress (export, onboarding, etc.) |
| Daily retention cron | `convex/crons.ts:purge-old-deleted-documents` | Scheduled cleanup of soft-deleted data |
| Urgency mapping from days | `convex/alerts.ts:getUrgencyFromDays()` | Calculate alert priority from time until deadline |
| Channel routing per urgency | `convex/alerts.ts:getChannelsForUrgency()` | Route alerts to channels based on urgency level |
| Alert audit logging | `convex/alerts.ts` (all mutations → alert_audit_log) | Track alert lifecycle for compliance |
| Retry with exponential backoff | `convex/alerts.ts:processAlert` | 15/30/45 min delays, max 3 attempts |
| Escalation after max retries | `convex/alerts.ts:escalateAlert` | Notify escalation contacts when alert delivery fails |
| Scheduled cron processing | `convex/crons.ts:process-due-alerts` | 15-min interval for time-sensitive batch jobs |
| Template import with alert scheduling | `convex/templates.ts:importTemplate` | When creating entities that need automatic alerts |
| Version-based update notifications | `convex/templates.ts:checkForUpdates` | Track version changes and notify users |
| Idempotent seeding | `convex/templates.ts:seedTemplate` | Update if exists, create if not (upsert pattern) |
| Dropdown matching cascade | `lib/pdf/filler.ts:fillDropdown` | Matching user input to fixed options (exact→case→partial→editable) |
| Profile completion percentage | `convex/profiles.ts:getCompletionStatus` | Tracking required vs optional field fill rates |
| Dynamic array form fields | `OrgProfileEditor.tsx` | Forms with add/remove items (addresses, phones, etc.) |
| Multi-step wizard with state | `app/(dashboard)/forms/fill/page.tsx` | Complex flows requiring user decisions at each step |
| Confidence-based UI colors | `FormAnalysisPreview.tsx` | AI results: high=green, medium=yellow, low=red |
| API route → Convex action bridge | `app/api/forms/analyze/route.ts` | When frontend needs REST endpoint for Convex action |
| External API adapter with retry | `src/lib/adapters/email/resend.ts` | 30s timeout, 3 retries, exp backoff for external API calls |
| Factory from env vars | `createResendAdapter()`, `createTwilioAdapter()` | Create configured adapter instances from environment |
| Multi-format email render | `DeadlineAlertEmail.tsx` | HTML + plain text versions of transactional emails |
| FullCalendar event transform | `lib/calendar/transformer.ts` | Convert domain objects to FullCalendar events |
| iCal feed generation | `lib/calendar/ical.ts` | Generate standards-compliant .ics files |
| Role-based permissions | `convex/team.ts:getCurrentUserRole()` | Query user role before mutation |
| Invitation flow | `convex/team.ts` | invite → (email) → acceptInvitation → user_organizations |
| Onboarding step tracking | `convex/onboarding.ts` | Initialize → markStepComplete → markComplete pattern |
| Multi-step onboarding wizard | `OnboardingWizard.tsx` | Controlled steps with validation before advance |
| Stripe checkout flow | `app/api/stripe/checkout/route.ts` | Create session → redirect → webhook confirms |
| Stripe webhook handling | `app/api/stripe/webhook/route.ts` | Verify signature, switch on event type, update DB |
| Usage limit enforcement | `convex/billing.ts:checkLimit()` | Check before action, increment after success |
| Trial expiry warnings | `convex/billing.ts:sendTrialWarnings` | Cron job sends 3-day and 1-day warnings |
| Compliance score calculation | `lib/utils/score.ts` | Weighted sum of deadline statuses → 0-100 |
| Dashboard data aggregation | `convex/dashboard.ts:getDashboardData` | Single query for all dashboard metrics |
| Report config validation | `convex/reports.ts:reportConfigValidator` | Validate saved report configuration with v.object |
| Scheduled report delivery | `convex/reports.ts` | Schedule config → calculateNextRunTime → cron processes due reports |
| PDF generation with pdf-lib | `convex/auditReports.ts` | Multi-page PDF: addPage, embedFont, drawText, drawLine |
| Report export to CSV/JSON | `ExportButtons.tsx` | Data serialization with proper escaping and download |
| Multi-step report wizard | `AuditExportWizard.tsx` | Step state machine: category → dateRange → confirm → generating → complete |
| Live report preview | `ReportBuilder.tsx + custom/page.tsx` | Query runs on config change, results rendered immediately |

---

## Known Gotchas
- **Timestamps**: Store as Unix ms (`Date.now()`), convert to Date for display
- **Temp IDs**: Pages use `"temp-user"` and placeholder orgId - replace with Clerk auth
- **Alert integration**: `scheduleAlertsForDeadlineInternal` called in create/update - other features use similar pattern
- **Recurrence baseDate**: Two modes - `"due_date"` (fixed) vs `"completion_date"` (rolling)
- **Status colors**: Use `getStatusColor()` from utils, don't hardcode
- **DUE_SOON_DAYS=14**: Constant in types, don't hardcode elsewhere
- **Multi-tenant**: ALL queries must filter by `orgId` - never skip
- **Document deadlineIds**: Array of deadline IDs; ensure deadlines exist before linking (validate foreign keys)
- **Document version chain**: Use `previousVersionId` to traverse; latest version has highest `version` number
- **OCR fallback**: If pdf-parse returns empty text (<50 chars), falls back to Claude Vision OCR
- **Search index delay**: Newly uploaded docs may take a few seconds to appear in full-text search
- **50MB file limit**: Enforced both client-side (DocumentUploader) AND server-side (Zod) - check both
- **extractedText truncation**: Truncated to 100,000 chars for search index efficiency
- **Document category validation**: Must match DOCUMENT_CATEGORIES array - custom categories not yet supported
- **Alert code duplication**: Alert helpers exist in both `deadlines.ts` and `alerts.ts` (for transaction safety). Canonical source is `alerts.ts`
- **Alert channel enum**: Must be `email | sms | push | in_app` (match schema exactly)
- **Alert urgency enum**: Must be `early | medium | high | critical` (match schema exactly)
- **Alert status enum**: Must be `scheduled | sent | delivered | failed | acknowledged` (match schema exactly)
- **acknowledgedVia enum**: Must be `email_link | sms_reply | in_app_button`
- **Alert scheduling**: Auto-skips past dates when scheduling alerts
- **Snooze limit**: Cannot snooze past deadline dueDate
- **Cron timing**: Alerts processed every 15 min - may be up to 15 min late
- **External API env vars**: Resend needs `RESEND_API_KEY`; Twilio needs `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Internal vs public functions**: Use `internal.*` for cron/action calls, `api.*` for client calls
- **Template slug**: Must be unique, used as URL-safe identifier for templates
- **Template version**: Semver format (e.g., "1.0.0") - tracked for update notifications
- **Template anchorType**: `fixed_date` uses defaultMonth/Day; `anniversary` and `custom` require user input during import
- **Template import**: One import per org per template - throws error on duplicate (use updateImport instead)
- **Deadline templateId/templateDeadlineId**: Links imported deadlines back to source template for tracking
- **getUrgencyForDays()**: Duplicated in templates.ts and alerts.ts - use same thresholds (critical:1d, high:7d, medium:14d)
- **Template update cron**: Daily at 6 AM UTC - compares lastNotifiedVersion to current template version
- **EIN encryption**: Currently XOR+base64 in profiles.ts - TODO: upgrade to AES for production
- **PDF rate limit**: 10 analyses/minute per org (in-memory limit in forms.ts)
- **Form fill limits**: Starter=0, Pro=10/month, Business=unlimited (check billing before analyzeForm)
- **Dropdown matching**: 4-tier cascade (exact→case-insensitive→partial→editable) - understand order
- **Signature fields**: Never auto-filled, returned separately in FillResult.signatureFields
- **SemanticFieldType enum**: 18 types in types/form.ts - use these, don't invent new ones
- **Profile address types**: primary, mailing, billing, other - match exactly
- **Claude for form analysis**: Uses claude-sonnet-4, returns JSON with semantic types + confidence
- **Template orgId null**: System-wide form templates have orgId=null, org-specific have orgId set
- **timesUsed counter**: Incremented on each form fill - useful for template popularity sorting
- **FullCalendar license**: Uses @fullcalendar/core with dayGrid/timeGrid/list plugins - check license for production
- **iCal feed security**: Public endpoint `/api/calendar/[orgId]/feed.ics` - consider adding token-based auth
- **VALARM in iCal**: Alarms set at -7d, -1d, -1h before due date - matches default alert days
- **Team roles hierarchy**: owner > admin > manager > member > viewer - check `getCurrentUserRole()` for permissions
- **Invitation expiry**: Invitations auto-expire after 7 days (check invitations.expiresAt)
- **Owner transfer**: Only owner can transfer ownership; new owner must be existing admin
- **Onboarding steps**: 7 steps defined in stepValidator union type - `account_created` always true at creation
- **Onboarding reminders**: 24h and 7d reminders via cron - check remindersSent array to avoid duplicates
- **Stripe price IDs**: Must match PLANS config in lib/billing/plans.ts
- **Trial period**: 14 days default (TRIAL_DAYS constant in billing.ts)
- **Usage metrics**: `deadlines`, `documents`, `team_members`, `form_fills`, `storage_bytes` - match exactly
- **Stripe webhook signature**: STRIPE_WEBHOOK_SECRET required for webhook validation
- **checkLimit()**: Returns `{allowed, current, limit, overage}` - check `allowed` boolean before operations
- **Billing cron**: Daily at 8 AM UTC for trial warnings (3-day and 1-day before expiry)
- **Report dateRangeType**: Must be `last_7_days | last_30_days | last_quarter | last_year | custom`
- **Report metrics array**: Valid values: `completion_rate`, `on_time_rate`, `by_category`, `by_status`, `trend`
- **Report groupBy**: For trend metric: `week`, `month`, `quarter`
- **Cost avoidance penalties**: Hardcoded per category in getCostAvoidance - update if industry changes
- **PDF generation async**: Large reports may timeout - consider chunking for very large datasets
- **Audit PDF storage**: Stored in Convex storage, URL expires - generate fresh for each download
- **Report schedule frequency**: `daily`, `weekly`, `monthly` - weekly needs dayOfWeek, monthly needs dayOfMonth
