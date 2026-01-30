# Implementation Plan: Onboarding Experience

**Branch**: `009-onboarding-experience` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-onboarding-experience/spec.md`

## Summary

Build a guided onboarding wizard that walks new users through organization setup, template import, alert configuration, and first deadline creation, with persistent progress tracking and re-engagement emails for incomplete onboarding.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Convex, Resend (re-engagement emails), React Hook Form
**Storage**: Convex (onboarding_progress table)
**Testing**: Vitest (unit), Playwright (E2E for wizard flow)
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Step transitions < 200ms, wizard load < 500ms
**Constraints**: Must complete required steps, optional steps skippable
**Scale/Scope**: Once per org, checklist persists until complete

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Progress saved after each step, resumable on return
- [x] **Alert Reliability**: Test alert sent during setup to verify delivery
- [x] **Clarity**: Clear progress indicator, next steps visible

Additional checks:
- [x] **Security**: Org-scoped progress, user-specific settings
- [x] **Code Quality**: TypeScript strict, step validation
- [x] **Testing**: Full wizard flow E2E tests
- [x] **Performance**: Lazy load step content, minimal initial bundle
- [x] **External Services**: Resend for reminder emails

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── onboarding/
│           └── page.tsx              # Onboarding wizard (if needed)
├── components/
│   └── features/
│       └── onboarding/
│           ├── OnboardingWizard.tsx
│           ├── OrgSetupStep.tsx
│           ├── TemplateImportStep.tsx
│           ├── AlertSetupStep.tsx
│           ├── FirstDeadlineStep.tsx
│           ├── TeamInviteStep.tsx
│           ├── OnboardingChecklist.tsx
│           └── ProgressIndicator.tsx
├── convex/
│   ├── onboarding.ts                 # Progress tracking
│   ├── crons.ts                      # Reminder cron jobs
│   └── schema.ts
└── lib/
    └── email/
        └── templates/
            └── onboarding-reminder.tsx
```

## Database Schema

```typescript
// convex/schema.ts (additions)
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
})
  .index("by_org", ["orgId"])
  .index("by_user", ["userId"]),
```

## Onboarding Wizard

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

## Step Components

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

## Post-Onboarding Checklist

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

## Re-Engagement Emails

```typescript
// convex/crons.ts
crons.daily(
  "onboarding-reminders",
  { hourUTC: 14, minuteUTC: 0 },
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

## Complexity Tracking

No constitution violations - implements test alerts to verify delivery and persistent progress tracking.
