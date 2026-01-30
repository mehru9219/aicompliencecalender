import type {
  FieldAnalysis,
  FieldMatchResult,
  SemanticFieldType,
  ConfidenceLevel,
  SEMANTIC_TO_PROFILE_KEY,
} from "@/types/form";
import type { OrganizationProfile } from "@/types/profile";

/**
 * Mapping from semantic types to profile key paths.
 */
const SEMANTIC_TYPE_TO_PROFILE_KEY: Record<SemanticFieldType, string | null> = {
  business_name: "legalName",
  ein: "ein",
  address_street: "addresses[0].street",
  address_city: "addresses[0].city",
  address_state: "addresses[0].state",
  address_zip: "addresses[0].zip",
  address_country: "addresses[0].country",
  phone: "phones[0].number",
  fax: null, // Would need specific fax phone type
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

/**
 * Get a nested value from an object using a path like "addresses[0].street".
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.match(/([^[\].]+|\[\d+\])/g);
  if (!parts) return undefined;

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    if (part.startsWith("[") && part.endsWith("]")) {
      // Array index
      const index = parseInt(part.slice(1, -1), 10);
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      // Object property
      if (typeof current === "object" && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
  }

  // Convert to string if needed
  if (current === null || current === undefined) return undefined;
  if (typeof current === "string") return current;
  if (typeof current === "number") return String(current);
  return undefined;
}

/**
 * Match analyzed fields to profile data.
 *
 * @param analysis - Array of field analysis results from AI
 * @param profile - Organization profile data
 * @returns Object mapping field names to matched values and sources
 */
export function matchFieldsToProfile(
  analysis: FieldAnalysis[],
  profile: Partial<OrganizationProfile>,
): {
  mappings: Record<string, FieldMatchResult>;
  unmatchedFields: string[];
} {
  const mappings: Record<string, FieldMatchResult> = {};
  const unmatchedFields: string[] = [];

  for (const field of analysis) {
    const profileKey = SEMANTIC_TYPE_TO_PROFILE_KEY[field.semanticType];

    if (!profileKey) {
      // Field type doesn't map to profile (e.g., date, signature)
      unmatchedFields.push(field.fieldName);
      continue;
    }

    const value = getNestedValue(
      profile as Record<string, unknown>,
      profileKey,
    );

    if (value) {
      mappings[field.fieldName] = {
        fieldName: field.fieldName,
        value,
        source: profileKey,
        confidence: field.confidence,
      };
    } else {
      // Profile doesn't have data for this field
      unmatchedFields.push(field.fieldName);
    }
  }

  return { mappings, unmatchedFields };
}

/**
 * Build values for form filling from profile and optional overrides.
 *
 * @param mappings - Field mappings from AI analysis
 * @param profile - Organization profile data
 * @param overrides - Optional manual overrides
 * @returns Object mapping field names to values
 */
export function buildFormValues(
  mappings: Record<string, FieldMatchResult>,
  profile: Partial<OrganizationProfile>,
  overrides?: Record<string, string>,
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [fieldName, mapping] of Object.entries(mappings)) {
    // Check for override first
    if (overrides && overrides[fieldName] !== undefined) {
      values[fieldName] = overrides[fieldName];
    } else {
      // Use mapped value from profile
      values[fieldName] = mapping.value;
    }
  }

  // Add any additional overrides that weren't in mappings
  if (overrides) {
    for (const [fieldName, value] of Object.entries(overrides)) {
      if (!(fieldName in values)) {
        values[fieldName] = value;
      }
    }
  }

  return values;
}

/**
 * Calculate match statistics.
 */
export function getMatchStats(
  analysis: FieldAnalysis[],
  mappings: Record<string, FieldMatchResult>,
): {
  totalFields: number;
  matchedFields: number;
  unmatchedFields: number;
  matchPercentage: number;
  byConfidence: Record<ConfidenceLevel, number>;
} {
  const byConfidence: Record<ConfidenceLevel, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const result of Object.values(mappings)) {
    byConfidence[result.confidence]++;
  }

  const matchedFields = Object.keys(mappings).length;
  const totalFields = analysis.length;

  return {
    totalFields,
    matchedFields,
    unmatchedFields: totalFields - matchedFields,
    matchPercentage:
      totalFields > 0 ? Math.round((matchedFields / totalFields) * 100) : 0,
    byConfidence,
  };
}

/**
 * Suggest profile keys for unmatched fields based on field names.
 * Uses heuristics to suggest likely matches.
 */
export function suggestProfileKey(fieldName: string): string | null {
  const normalizedName = fieldName.toLowerCase().replace(/[_-]/g, " ");

  // Common field name patterns
  const patterns: [RegExp, string][] = [
    [/^(business|company|org|legal)\s*(name)?$/i, "legalName"],
    [/^(ein|tax\s*id|federal\s*id)$/i, "ein"],
    [/^(street|address\s*1|address\s*line\s*1)$/i, "addresses[0].street"],
    [/^(city)$/i, "addresses[0].city"],
    [/^(state)$/i, "addresses[0].state"],
    [/^(zip|postal)$/i, "addresses[0].zip"],
    [/^(phone|telephone|tel)$/i, "phones[0].number"],
    [/^(fax)$/i, "phones[1].number"],
    [/^(email|e-mail)$/i, "emails[0].address"],
    [/^(website|web|url)$/i, "website"],
    [/^(npi|npi\s*number)$/i, "npiNumber"],
    [/^(license|lic)\s*(number|no|#)?$/i, "licenseNumbers[0].number"],
    [/^(owner|ceo|president|officer)\s*(name)?$/i, "officers[0].name"],
    [/^(title|position)$/i, "officers[0].title"],
  ];

  for (const [pattern, key] of patterns) {
    if (pattern.test(normalizedName)) {
      return key;
    }
  }

  return null;
}
