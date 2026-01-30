import type { IndustryTemplate, TemplateDeadline } from "@/types/template";

/**
 * Validation result for a template.
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate semver format.
 */
function isValidSemver(version: string): boolean {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[\w.]+)?(\+[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Validate URL format.
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a single template deadline.
 */
function validateDeadline(
  deadline: TemplateDeadline,
  index: number,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `Deadline[${index}] (${deadline.id})`;

  // Required fields
  if (!deadline.id || deadline.id.trim() === "") {
    errors.push(`${prefix}: Missing deadline ID`);
  }

  if (!deadline.title || deadline.title.trim() === "") {
    errors.push(`${prefix}: Missing title`);
  }

  if (!deadline.description || deadline.description.trim() === "") {
    errors.push(`${prefix}: Missing description`);
  }

  if (!deadline.category || deadline.category.trim() === "") {
    errors.push(`${prefix}: Missing category`);
  }

  // Recurrence validation
  if (!deadline.recurrence || !deadline.recurrence.type) {
    errors.push(`${prefix}: Missing recurrence type`);
  } else if (
    deadline.recurrence.type === "custom" &&
    !deadline.recurrence.interval
  ) {
    warnings.push(`${prefix}: Custom recurrence without interval`);
  }

  // Alert days validation
  if (!deadline.defaultAlertDays || deadline.defaultAlertDays.length === 0) {
    warnings.push(`${prefix}: No default alert days specified`);
  } else {
    const invalidAlertDays = deadline.defaultAlertDays.filter((d) => d < 0);
    if (invalidAlertDays.length > 0) {
      errors.push(
        `${prefix}: Invalid negative alert days: ${invalidAlertDays.join(", ")}`,
      );
    }
  }

  // Anchor type validation
  if (!deadline.anchorType) {
    errors.push(`${prefix}: Missing anchor type`);
  } else if (deadline.anchorType === "fixed_date") {
    if (
      deadline.defaultMonth === undefined ||
      deadline.defaultDay === undefined
    ) {
      warnings.push(`${prefix}: Fixed date anchor without default month/day`);
    } else {
      if (deadline.defaultMonth < 1 || deadline.defaultMonth > 12) {
        errors.push(`${prefix}: Invalid month: ${deadline.defaultMonth}`);
      }
      if (deadline.defaultDay < 1 || deadline.defaultDay > 31) {
        errors.push(`${prefix}: Invalid day: ${deadline.defaultDay}`);
      }
    }
  }

  // Importance validation
  if (!deadline.importance) {
    errors.push(`${prefix}: Missing importance level`);
  } else if (
    !["critical", "high", "medium", "low"].includes(deadline.importance)
  ) {
    errors.push(`${prefix}: Invalid importance: ${deadline.importance}`);
  }

  // Critical deadlines should have penalty info
  if (deadline.importance === "critical" && !deadline.penaltyRange) {
    warnings.push(`${prefix}: Critical deadline without penalty information`);
  }

  return { errors, warnings };
}

/**
 * Validate a complete industry template.
 */
export function validateTemplate(
  template: IndustryTemplate,
): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!template.slug || template.slug.trim() === "") {
    errors.push("Missing template slug");
  } else if (!/^[a-z0-9-]+$/.test(template.slug)) {
    errors.push(
      `Invalid slug format: ${template.slug} (must be lowercase alphanumeric with hyphens)`,
    );
  }

  if (!template.industry || template.industry.trim() === "") {
    errors.push("Missing industry");
  }

  if (!template.name || template.name.trim() === "") {
    errors.push("Missing template name");
  }

  if (!template.description || template.description.trim() === "") {
    errors.push("Missing template description");
  }

  // Version validation
  if (!template.version) {
    errors.push("Missing version");
  } else if (!isValidSemver(template.version)) {
    errors.push(`Invalid semver version: ${template.version}`);
  }

  // Deadlines validation
  if (!template.deadlines || template.deadlines.length === 0) {
    errors.push("Template has no deadlines");
  } else {
    // Check for unique deadline IDs
    const deadlineIds = template.deadlines.map((d) => d.id);
    const duplicateIds = deadlineIds.filter(
      (id, index) => deadlineIds.indexOf(id) !== index,
    );
    if (duplicateIds.length > 0) {
      errors.push(
        `Duplicate deadline IDs: ${[...new Set(duplicateIds)].join(", ")}`,
      );
    }

    // Validate each deadline
    template.deadlines.forEach((deadline, index) => {
      const result = validateDeadline(deadline, index);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
  }

  // Document categories validation
  if (
    !template.documentCategories ||
    template.documentCategories.length === 0
  ) {
    warnings.push("No document categories specified");
  }

  // Regulatory references validation
  if (
    !template.regulatoryReferences ||
    template.regulatoryReferences.length === 0
  ) {
    warnings.push("No regulatory references specified");
  } else {
    template.regulatoryReferences.forEach((ref, index) => {
      if (!ref.name || ref.name.trim() === "") {
        errors.push(`RegulatoryReference[${index}]: Missing name`);
      }
      if (!ref.url) {
        errors.push(`RegulatoryReference[${index}]: Missing URL`);
      } else if (!isValidUrl(ref.url)) {
        errors.push(`RegulatoryReference[${index}]: Invalid URL: ${ref.url}`);
      }
      if (!ref.description || ref.description.trim() === "") {
        warnings.push(`RegulatoryReference[${index}]: Missing description`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all templates in a collection.
 */
export function validateTemplates(
  templates: IndustryTemplate[],
): Map<string, TemplateValidationResult> {
  const results = new Map<string, TemplateValidationResult>();

  // Check for unique slugs across all templates
  const slugs = templates.map((t) => t.slug);
  const duplicateSlugs = slugs.filter(
    (slug, index) => slugs.indexOf(slug) !== index,
  );

  templates.forEach((template) => {
    const result = validateTemplate(template);

    // Add cross-template validation errors
    if (duplicateSlugs.includes(template.slug)) {
      result.errors.push(`Duplicate template slug: ${template.slug}`);
      result.valid = false;
    }

    results.set(template.slug, result);
  });

  return results;
}

/**
 * Format validation results for console output.
 */
export function formatValidationResults(
  results: Map<string, TemplateValidationResult>,
): string {
  const lines: string[] = [];
  let hasErrors = false;

  for (const [slug, result] of results) {
    lines.push(`\n--- ${slug} ---`);
    lines.push(`Status: ${result.valid ? "VALID" : "INVALID"}`);

    if (result.errors.length > 0) {
      hasErrors = true;
      lines.push(`Errors (${result.errors.length}):`);
      result.errors.forEach((e) => lines.push(`  - ${e}`));
    }

    if (result.warnings.length > 0) {
      lines.push(`Warnings (${result.warnings.length}):`);
      result.warnings.forEach((w) => lines.push(`  - ${w}`));
    }
  }

  lines.unshift(
    hasErrors
      ? "VALIDATION FAILED - See errors below"
      : "VALIDATION PASSED - All templates valid",
  );

  return lines.join("\n");
}
