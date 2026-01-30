import type { Id } from "../convex/_generated/dataModel";

/**
 * Recurrence pattern for template deadlines.
 */
export interface RecurrencePattern {
  type:
    | "weekly"
    | "monthly"
    | "quarterly"
    | "semi_annual"
    | "annual"
    | "custom";
  interval?: number; // For custom: number of days
}

/**
 * Importance level for deadlines.
 */
export type ImportanceLevel = "critical" | "high" | "medium" | "low";

/**
 * Anchor type determines how due dates are calculated.
 */
export type AnchorType = "fixed_date" | "anniversary" | "custom";

/**
 * A deadline definition within an industry template.
 */
export interface TemplateDeadline {
  /** Stable ID across template versions */
  id: string;
  title: string;
  description: string;
  /** Category for grouping (e.g., 'license', 'certification', 'training') */
  category: string;
  recurrence: RecurrencePattern;
  /** Days before due date to send alerts */
  defaultAlertDays: number[];
  /** How the due date is anchored */
  anchorType: AnchorType;
  /** Month (1-12) for fixed_date anchors */
  defaultMonth?: number;
  /** Day (1-31) for fixed_date anchors */
  defaultDay?: number;
  importance: ImportanceLevel;
  /** Description of penalties for non-compliance */
  penaltyRange?: string;
  /** Regulatory body enforcing this requirement */
  regulatoryBody?: string;
  /** Additional notes for users */
  notes?: string;
}

/**
 * Reference to regulatory documentation.
 */
export interface RegulatoryReference {
  name: string;
  url: string;
  description: string;
}

/**
 * An industry compliance template definition.
 */
export interface IndustryTemplate {
  /** Unique slug for URL-friendly identification */
  slug: string;
  /** Primary industry (e.g., 'Healthcare', 'Legal', 'Financial') */
  industry: string;
  /** Sub-industry specialization (e.g., 'Medical Practice', 'Dental') */
  subIndustry?: string;
  /** Display name */
  name: string;
  /** Full description of template coverage */
  description: string;
  /** Semantic version (e.g., '1.0.0') */
  version: string;
  /** List of deadline definitions */
  deadlines: TemplateDeadline[];
  /** Document categories relevant to this template */
  documentCategories: string[];
  /** Links to regulatory sources */
  regulatoryReferences: RegulatoryReference[];
  /** Optional linked form templates */
  formTemplateIds?: Id<"form_templates">[];
}

/**
 * Database record for industry template.
 */
export interface IndustryTemplateDoc extends IndustryTemplate {
  _id: Id<"industry_templates">;
  _creationTime: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

/**
 * Record of a template import by an organization.
 */
export interface TemplateImport {
  _id: Id<"template_imports">;
  _creationTime: number;
  orgId: Id<"organizations">;
  templateId: Id<"industry_templates">;
  templateVersion: string;
  importedDeadlineIds: Id<"deadlines">[];
  customizations: TemplateCustomizations;
  importedAt: number;
  lastNotifiedVersion?: string;
}

/**
 * User customizations applied during import.
 */
export interface TemplateCustomizations {
  /** Custom dates overriding template defaults */
  customDates?: Record<string, number>;
  /** Deadlines excluded from import */
  excludedDeadlineIds?: string[];
  /** Any other customization data */
  [key: string]: unknown;
}

/**
 * Change detected during version comparison.
 */
export interface TemplateVersionChange {
  type: "added" | "removed" | "modified";
  deadlineId: string;
  deadlineTitle: string;
  description: string;
  /** For modified: array of change descriptions */
  details?: string[];
}

/**
 * Result of comparing two template versions.
 */
export interface VersionComparisonResult {
  hasChanges: boolean;
  oldVersion: string;
  newVersion: string;
  changes: TemplateVersionChange[];
  summary: string;
}

/**
 * Input for importing a template.
 */
export interface ImportTemplateInput {
  orgId: Id<"organizations">;
  templateId: Id<"industry_templates">;
  selectedDeadlineIds: string[];
  customDates: Record<string, number>;
}

/**
 * Result of template import.
 */
export interface ImportTemplateResult {
  success: boolean;
  importedDeadlineIds: Id<"deadlines">[];
  skippedDeadlineIds: string[];
  error?: string;
}

/**
 * Template with additional computed fields for display.
 */
export interface TemplateWithStats extends IndustryTemplateDoc {
  deadlineCount: number;
  criticalCount: number;
  lastUpdatedFormatted: string;
}

/**
 * Filter options for template list.
 */
export interface TemplateListFilters {
  industry?: string;
  search?: string;
  isActive?: boolean;
}
