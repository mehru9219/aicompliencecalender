import type {
  TemplateDeadline,
  TemplateVersionChange,
  VersionComparisonResult,
} from "@/types/template";

/**
 * Compare two semver versions.
 * Returns:
 *  -1 if v1 < v2
 *   0 if v1 === v2
 *   1 if v1 > v2
 */
export function compareSemver(v1: string, v2: string): number {
  const parse = (v: string): number[] => {
    const parts = v.replace(/^v/, "").split(".");
    return parts.map((p) => parseInt(p, 10) || 0);
  };

  const [major1, minor1, patch1] = parse(v1);
  const [major2, minor2, patch2] = parse(v2);

  if (major1 !== major2) return major1 > major2 ? 1 : -1;
  if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
  if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
  return 0;
}

/**
 * Check if a version string is valid semver format.
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^v?(\d+)\.(\d+)\.(\d+)(-[\w.]+)?(\+[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * Compare two template versions and detect changes.
 *
 * @param oldVersion - The version the org imported
 * @param newVersion - The current template version
 * @param oldDeadlines - The deadlines at the time of import (if available)
 * @param newDeadlines - The current template deadlines
 * @returns Detailed comparison result with all changes
 */
export function compareTemplateVersions(
  oldVersion: string,
  newVersion: string,
  oldDeadlines: TemplateDeadline[] | undefined,
  newDeadlines: TemplateDeadline[],
): VersionComparisonResult {
  const versionComparison = compareSemver(oldVersion, newVersion);

  // If same version, no changes
  if (versionComparison === 0) {
    return {
      hasChanges: false,
      oldVersion,
      newVersion,
      changes: [],
      summary: "No changes",
    };
  }

  // If we don't have old deadlines to compare, we can only report version change
  if (!oldDeadlines || oldDeadlines.length === 0) {
    return {
      hasChanges: true,
      oldVersion,
      newVersion,
      changes: [],
      summary: `Template updated from ${oldVersion} to ${newVersion}`,
    };
  }

  const changes: TemplateVersionChange[] = [];
  const oldDeadlineMap = new Map(oldDeadlines.map((d) => [d.id, d]));
  const newDeadlineMap = new Map(newDeadlines.map((d) => [d.id, d]));

  // Check for new deadlines
  for (const newDeadline of newDeadlines) {
    if (!oldDeadlineMap.has(newDeadline.id)) {
      changes.push({
        type: "added",
        deadlineId: newDeadline.id,
        deadlineTitle: newDeadline.title,
        description: `New deadline added: ${newDeadline.title}`,
      });
    }
  }

  // Check for removed deadlines
  for (const oldDeadline of oldDeadlines) {
    if (!newDeadlineMap.has(oldDeadline.id)) {
      changes.push({
        type: "removed",
        deadlineId: oldDeadline.id,
        deadlineTitle: oldDeadline.title,
        description: `Deadline removed: ${oldDeadline.title}`,
      });
    }
  }

  // Check for modified deadlines
  for (const newDeadline of newDeadlines) {
    const oldDeadline = oldDeadlineMap.get(newDeadline.id);
    if (oldDeadline) {
      const modifications = detectDeadlineModifications(
        oldDeadline,
        newDeadline,
      );
      if (modifications.length > 0) {
        changes.push({
          type: "modified",
          deadlineId: newDeadline.id,
          deadlineTitle: newDeadline.title,
          description: `Modified: ${modifications.join(", ")}`,
          details: modifications,
        });
      }
    }
  }

  const summary = generateChangeSummary(changes);

  return {
    hasChanges: changes.length > 0,
    oldVersion,
    newVersion,
    changes,
    summary,
  };
}

/**
 * Detect modifications between two deadline versions.
 */
function detectDeadlineModifications(
  oldDeadline: TemplateDeadline,
  newDeadline: TemplateDeadline,
): string[] {
  const modifications: string[] = [];

  // Title change
  if (oldDeadline.title !== newDeadline.title) {
    modifications.push(
      `title changed from "${oldDeadline.title}" to "${newDeadline.title}"`,
    );
  }

  // Description change
  if (oldDeadline.description !== newDeadline.description) {
    modifications.push("description updated");
  }

  // Category change
  if (oldDeadline.category !== newDeadline.category) {
    modifications.push(
      `category changed from "${oldDeadline.category}" to "${newDeadline.category}"`,
    );
  }

  // Recurrence change
  if (
    oldDeadline.recurrence.type !== newDeadline.recurrence.type ||
    oldDeadline.recurrence.interval !== newDeadline.recurrence.interval
  ) {
    modifications.push("recurrence schedule changed");
  }

  // Alert days change
  if (
    !arraysEqual(oldDeadline.defaultAlertDays, newDeadline.defaultAlertDays)
  ) {
    modifications.push("alert schedule changed");
  }

  // Anchor type change
  if (oldDeadline.anchorType !== newDeadline.anchorType) {
    modifications.push(
      `anchor type changed from "${oldDeadline.anchorType}" to "${newDeadline.anchorType}"`,
    );
  }

  // Fixed date change
  if (
    oldDeadline.defaultMonth !== newDeadline.defaultMonth ||
    oldDeadline.defaultDay !== newDeadline.defaultDay
  ) {
    modifications.push("due date changed");
  }

  // Importance change
  if (oldDeadline.importance !== newDeadline.importance) {
    modifications.push(
      `importance changed from "${oldDeadline.importance}" to "${newDeadline.importance}"`,
    );
  }

  // Penalty range change
  if (oldDeadline.penaltyRange !== newDeadline.penaltyRange) {
    modifications.push("penalty information updated");
  }

  // Regulatory body change
  if (oldDeadline.regulatoryBody !== newDeadline.regulatoryBody) {
    modifications.push("regulatory body updated");
  }

  // Notes change
  if (oldDeadline.notes !== newDeadline.notes) {
    modifications.push("notes updated");
  }

  return modifications;
}

/**
 * Compare two arrays for equality.
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Generate a human-readable summary of changes.
 */
function generateChangeSummary(changes: TemplateVersionChange[]): string {
  if (changes.length === 0) {
    return "No changes detected";
  }

  const added = changes.filter((c) => c.type === "added").length;
  const removed = changes.filter((c) => c.type === "removed").length;
  const modified = changes.filter((c) => c.type === "modified").length;

  const parts: string[] = [];
  if (added > 0) parts.push(`${added} new deadline${added !== 1 ? "s" : ""}`);
  if (removed > 0) parts.push(`${removed} removed`);
  if (modified > 0) parts.push(`${modified} modified`);

  return parts.join(", ");
}

/**
 * Check if a template update should be considered significant (major or minor version).
 */
export function isSignificantUpdate(
  oldVersion: string,
  newVersion: string,
): boolean {
  const parse = (v: string): number[] => {
    const parts = v.replace(/^v/, "").split(".");
    return parts.map((p) => parseInt(p, 10) || 0);
  };

  const [oldMajor, oldMinor] = parse(oldVersion);
  const [newMajor, newMinor] = parse(newVersion);

  // Major version change
  if (newMajor > oldMajor) return true;

  // Minor version change (new features)
  if (newMajor === oldMajor && newMinor > oldMinor) return true;

  return false;
}

/**
 * Get the type of version update.
 */
export function getUpdateType(
  oldVersion: string,
  newVersion: string,
): "major" | "minor" | "patch" | "none" {
  const parse = (v: string): number[] => {
    const parts = v.replace(/^v/, "").split(".");
    return parts.map((p) => parseInt(p, 10) || 0);
  };

  const [oldMajor, oldMinor, oldPatch] = parse(oldVersion);
  const [newMajor, newMinor, newPatch] = parse(newVersion);

  if (newMajor > oldMajor) return "major";
  if (newMinor > oldMinor) return "minor";
  if (newPatch > oldPatch) return "patch";
  return "none";
}
