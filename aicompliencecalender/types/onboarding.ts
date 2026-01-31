/**
 * Onboarding types and constants.
 */

import type { Id } from "@/convex/_generated/dataModel";

// Step identifiers matching schema
export type OnboardingStepId =
  | "account_created"
  | "org_setup"
  | "template_imported"
  | "alerts_configured"
  | "first_deadline"
  | "team_invited"
  | "first_completion";

// Onboarding step definition
export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  required: boolean;
}

// Ordered list of onboarding steps
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "org_setup",
    title: "Set Up Organization",
    description: "Enter your business name and select your industry",
    required: true,
  },
  {
    id: "template_imported",
    title: "Import Templates",
    description: "Start with industry-specific compliance deadlines",
    required: false,
  },
  {
    id: "alerts_configured",
    title: "Configure Alerts",
    description: "Choose how you want to receive deadline reminders",
    required: true,
  },
  {
    id: "first_deadline",
    title: "Create First Deadline",
    description: "Add your first compliance deadline",
    required: true,
  },
  {
    id: "team_invited",
    title: "Invite Team",
    description: "Add team members to collaborate on compliance",
    required: false,
  },
];

// Checklist items shown after wizard
export interface ChecklistItem {
  id: OnboardingStepId;
  label: string;
  href: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "first_deadline",
    label: "Create your first deadline",
    href: "/dashboard/deadlines/new",
  },
  {
    id: "alerts_configured",
    label: "Configure alert preferences",
    href: "/dashboard/settings/alerts",
  },
  {
    id: "team_invited",
    label: "Invite a team member",
    href: "/dashboard/settings/team",
  },
  {
    id: "first_completion",
    label: "Complete a deadline",
    href: "/dashboard/deadlines",
  },
];

// Progress tracking shape (matches schema)
export interface OnboardingSteps {
  account_created: boolean;
  org_setup: boolean;
  template_imported: boolean;
  alerts_configured: boolean;
  first_deadline: boolean;
  team_invited: boolean;
  first_completion: boolean;
}

export interface ReminderRecord {
  type: "24h" | "7d";
  sentAt: number;
}

export interface OnboardingProgress {
  _id: Id<"onboarding_progress">;
  orgId: Id<"organizations">;
  userId: string;
  steps: OnboardingSteps;
  startedAt: number;
  completedAt?: number;
  lastActivityAt: number;
  remindersSent?: ReminderRecord[];
}

// Industry options for org setup
export const INDUSTRIES = [
  { value: "healthcare_medical", label: "Healthcare - Medical Practice" },
  { value: "healthcare_dental", label: "Healthcare - Dental Practice" },
  { value: "legal", label: "Legal Services" },
  { value: "financial_services", label: "Financial Services" },
  { value: "real_estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "restaurant", label: "Restaurant & Food Service" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["value"];

// Helper functions
export function getRequiredSteps(): OnboardingStepId[] {
  return ONBOARDING_STEPS.filter((s) => s.required).map((s) => s.id);
}

export function getCompletedStepCount(steps: OnboardingSteps): number {
  return Object.values(steps).filter(Boolean).length;
}

export function isOnboardingComplete(steps: OnboardingSteps): boolean {
  const requiredSteps = getRequiredSteps();
  return requiredSteps.every((stepId) => steps[stepId]);
}

export function getNextIncompleteStep(
  steps: OnboardingSteps,
): OnboardingStep | null {
  for (const step of ONBOARDING_STEPS) {
    if (!steps[step.id]) {
      return step;
    }
  }
  return null;
}
