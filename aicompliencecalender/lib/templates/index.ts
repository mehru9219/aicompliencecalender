/**
 * Industry Templates Registry
 *
 * Central registry for all pre-built compliance templates.
 * Templates are organized by industry and sub-industry.
 */

import type { IndustryTemplate } from "../../types/template";

// Healthcare Templates
export { healthcareMedicalPractice } from "./healthcare-medical-practice";
export { healthcareDental } from "./healthcare-dental";
export { healthcareMentalHealth } from "./healthcare-mental-health";

// Legal Templates
export { legalLawFirm } from "./legal-law-firm";

// Financial Templates
export { financialAdvisor } from "./financial-advisor";
export { financialCpaFirm } from "./financial-cpa-firm";

// Import all templates for the registry
import { healthcareMedicalPractice } from "./healthcare-medical-practice";
import { healthcareDental } from "./healthcare-dental";
import { healthcareMentalHealth } from "./healthcare-mental-health";
import { legalLawFirm } from "./legal-law-firm";
import { financialAdvisor } from "./financial-advisor";
import { financialCpaFirm } from "./financial-cpa-firm";

/**
 * Array of all available templates
 */
export const allTemplates: IndustryTemplate[] = [
  healthcareMedicalPractice,
  healthcareDental,
  healthcareMentalHealth,
  legalLawFirm,
  financialAdvisor,
  financialCpaFirm,
];

/**
 * Registry mapping template slugs to templates
 */
export const templateRegistry: Record<string, IndustryTemplate> = {
  "healthcare-medical-practice": healthcareMedicalPractice,
  "healthcare-dental": healthcareDental,
  "healthcare-mental-health": healthcareMentalHealth,
  "legal-law-firm": legalLawFirm,
  "financial-advisor": financialAdvisor,
  "financial-cpa-firm": financialCpaFirm,
};

/**
 * Get a template by its slug
 */
export function getTemplateBySlug(slug: string): IndustryTemplate | undefined {
  return templateRegistry[slug];
}

/**
 * Get all templates for a specific industry
 */
export function getTemplatesByIndustry(industry: string): IndustryTemplate[] {
  return allTemplates.filter(
    (t) => t.industry.toLowerCase() === industry.toLowerCase(),
  );
}

/**
 * Get available industry categories
 */
export function getAvailableIndustries(): string[] {
  const industries = new Set(allTemplates.map((t) => t.industry));
  return Array.from(industries).sort();
}

/**
 * Template counts by industry for display
 */
export const templateCountsByIndustry: Record<string, number> =
  allTemplates.reduce(
    (acc, template) => {
      acc[template.industry] = (acc[template.industry] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
