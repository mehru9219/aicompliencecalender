import type { Id } from "../convex/_generated/dataModel";

/** Form field types recognized by PDF parsers */
export type FormFieldType =
  | "text"
  | "checkbox"
  | "dropdown"
  | "radio"
  | "date"
  | "signature";

/** Semantic types that AI can identify from field context */
export type SemanticFieldType =
  | "business_name"
  | "ein"
  | "address_street"
  | "address_city"
  | "address_state"
  | "address_zip"
  | "address_country"
  | "phone"
  | "fax"
  | "email"
  | "website"
  | "license_number"
  | "npi_number"
  | "officer_name"
  | "officer_title"
  | "date"
  | "signature"
  | "other";

/** Confidence level of AI field analysis */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Position of a field in the PDF document */
export interface FieldPosition {
  page: number;
  x: number;
  y: number;
}

/** Form field extracted from PDF */
export interface FormField {
  name: string;
  type: FormFieldType;
  options?: string[]; // For dropdowns/radio buttons
  position?: FieldPosition;
  required?: boolean;
  defaultValue?: string;
}

/** AI analysis result for a single field */
export interface FieldAnalysis {
  fieldName: string;
  semanticType: SemanticFieldType;
  confidence: ConfidenceLevel;
  notes?: string;
}

/** Mapping between form field and profile data */
export interface FieldMapping {
  fieldName: string;
  fieldType: FormFieldType | string;
  profileKey: string; // e.g., 'legalName', 'addresses[0].street'
  position?: FieldPosition;
}

/** Result of matching fields to profile data */
export interface FieldMatchResult {
  fieldName: string;
  value: string;
  source: string; // The profile key that provided the value
  confidence: ConfidenceLevel;
}

/** Form template stored for reuse */
export interface FormTemplate {
  _id: Id<"form_templates">;
  _creationTime: number;
  orgId?: Id<"organizations">; // null = system template
  name: string;
  industry: string;
  originalStorageId: Id<"_storage">;
  fieldMappings: FieldMapping[];
  timesUsed: number;
  createdAt: number;
}

/** Input for creating a form template */
export interface FormTemplateInput {
  name: string;
  industry: string;
  originalStorageId: Id<"_storage">;
  fieldMappings: FieldMapping[];
}

/** Record of a completed form fill */
export interface FormFill {
  _id: Id<"form_fills">;
  _creationTime: number;
  orgId: Id<"organizations">;
  templateId: Id<"form_templates">;
  filledStorageId: Id<"_storage">;
  valuesUsed: Record<string, string>;
  filledAt: number;
  filledBy: string;
}

/** Result of form analysis action */
export interface FormAnalysisResult {
  fields: FormField[];
  analysis: FieldAnalysis[];
  mappings: Record<string, FieldMatchResult>;
  unmatchedFields: string[];
}

/** Industry types for form templates */
export type FormIndustry =
  | "healthcare"
  | "finance"
  | "legal"
  | "manufacturing"
  | "technology"
  | "retail"
  | "construction"
  | "education"
  | "government"
  | "other";

/** Industry labels for UI */
export const FORM_INDUSTRIES: Record<FormIndustry, string> = {
  healthcare: "Healthcare",
  finance: "Finance & Banking",
  legal: "Legal Services",
  manufacturing: "Manufacturing",
  technology: "Technology",
  retail: "Retail",
  construction: "Construction",
  education: "Education",
  government: "Government",
  other: "Other",
};

/** Mapping from semantic types to profile keys */
export const SEMANTIC_TO_PROFILE_KEY: Record<SemanticFieldType, string | null> =
  {
    business_name: "legalName",
    ein: "ein",
    address_street: "addresses[0].street",
    address_city: "addresses[0].city",
    address_state: "addresses[0].state",
    address_zip: "addresses[0].zip",
    address_country: "addresses[0].country",
    phone: "phones[0].number",
    fax: "phones[1].number", // Assuming fax is second phone
    email: "emails[0].address",
    website: "website",
    license_number: "licenseNumbers[0].number",
    npi_number: "npiNumber",
    officer_name: "officers[0].name",
    officer_title: "officers[0].title",
    date: null, // Requires manual entry
    signature: null, // Requires manual entry
    other: null,
  };

/** Confidence level colors for UI */
export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: "green",
  medium: "yellow",
  low: "red",
};
