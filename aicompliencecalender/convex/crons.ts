import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process due alerts every 15 minutes
crons.interval(
  "process-due-alerts",
  { minutes: 15 },
  internal.alerts.processDueAlerts,
);

// Purge documents deleted > 30 days ago (daily at 2 AM UTC)
crons.daily(
  "purge-old-deleted-documents",
  { hourUTC: 2, minuteUTC: 0 },
  internal.documents.purgeOldDeletedDocuments,
);

// Check for template updates daily at 6 AM UTC
crons.daily(
  "check-template-updates",
  { hourUTC: 6, minuteUTC: 0 },
  internal.templates.checkForUpdates,
);

// Send onboarding reminders daily at 2 PM UTC
crons.daily(
  "onboarding-reminders",
  { hourUTC: 14, minuteUTC: 0 },
  internal.onboarding.sendOnboardingReminders,
);

// Send trial expiry warnings daily at 10 AM UTC
crons.daily(
  "trial-expiry-warnings",
  { hourUTC: 10, minuteUTC: 0 },
  internal.billing.sendTrialWarnings,
);

export default crons;
