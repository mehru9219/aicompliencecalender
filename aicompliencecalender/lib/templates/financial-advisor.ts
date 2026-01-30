import type { IndustryTemplate } from "../../types/template";

/**
 * Compliance template for financial advisors and investment advisory firms.
 */
export const financialAdvisor: IndustryTemplate = {
  slug: "financial-advisor",
  industry: "Financial",
  subIndustry: "Investment Advisory",
  name: "Financial Advisor",
  description:
    "Compliance template for registered investment advisors (RIAs) and financial advisory practices. Covers SEC/state registration, fiduciary compliance, Form ADV updates, and client disclosure requirements.",
  version: "1.0.0",
  deadlines: [
    {
      id: "form-adv-annual-amendment",
      title: "Form ADV Annual Amendment",
      description:
        "Annual amendment to Form ADV required within 90 days of fiscal year end. Updates firm brochure and disclosure information.",
      category: "filing",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "fixed_date",
      defaultMonth: 3,
      defaultDay: 31,
      importance: "critical",
      penaltyRange: "Regulatory sanctions, fines",
      regulatoryBody: "SEC / State Securities Regulators",
      notes: "Most RIAs have Dec 31 fiscal year end, making deadline March 31.",
    },
    {
      id: "form-adv-brochure-delivery",
      title: "Form ADV Part 2A Brochure Delivery",
      description:
        "Annual delivery of updated Form ADV Part 2A brochure to existing clients (within 120 days of fiscal year end).",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "fixed_date",
      defaultMonth: 4,
      defaultDay: 30,
      importance: "high",
      regulatoryBody: "SEC / State Securities Regulators",
      notes: "Document delivery method and date for each client.",
    },
    {
      id: "state-registration-renewal",
      title: "State Registration Renewal",
      description:
        "Annual state securities registration renewal. Required in each state where you have clients or conduct business.",
      category: "license",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "fixed_date",
      defaultMonth: 12,
      defaultDay: 31,
      importance: "critical",
      penaltyRange: "Inability to advise clients in state, fines",
      regulatoryBody: "State Securities Regulators",
      notes: "Track each state registration separately if multi-state.",
    },
    {
      id: "annual-compliance-review",
      title: "Annual Compliance Review",
      description:
        "SEC Rule 206(4)-7 requires annual review of compliance policies and procedures. Document findings and updates.",
      category: "audit",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "anniversary",
      importance: "critical",
      penaltyRange: "SEC enforcement action",
      regulatoryBody: "SEC",
      notes:
        "Review and update compliance manual. Document the review process.",
    },
    {
      id: "cco-certification",
      title: "Chief Compliance Officer Certification",
      description:
        "Annual CCO certification that compliance review was conducted and policies are adequate.",
      category: "certification",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "anniversary",
      importance: "high",
      regulatoryBody: "SEC",
    },
    {
      id: "custody-audit",
      title: "Custody Rule Audit (if applicable)",
      description:
        "Annual surprise examination by independent CPA if firm has custody of client assets.",
      category: "audit",
      recurrence: { type: "annual" },
      defaultAlertDays: [90, 60, 30],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "SEC enforcement, client claims",
      regulatoryBody: "SEC",
      notes:
        "Only required if firm has custody. File Form ADV-E within 120 days.",
    },
    {
      id: "e-and-o-insurance",
      title: "E&O Insurance Renewal",
      description:
        "Errors and omissions insurance renewal. While not SEC-required, critical for practice protection.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "high",
      notes: "Some states and custodians require minimum coverage levels.",
    },
  ],
  documentCategories: [
    "licenses",
    "certifications",
    "insurance",
    "compliance_records",
    "audit_reports",
    "client_disclosures",
    "policies",
  ],
  regulatoryReferences: [
    {
      name: "SEC Investment Advisers",
      url: "https://www.sec.gov/investment/investment-advisers",
      description: "SEC resources for investment advisers",
    },
    {
      name: "Form ADV Instructions",
      url: "https://www.sec.gov/about/forms/formadv.pdf",
      description: "SEC Form ADV instructions and requirements",
    },
    {
      name: "NASAA Resources",
      url: "https://www.nasaa.org/industry-resources/investment-advisers/",
      description:
        "North American Securities Administrators Association IA resources",
    },
  ],
};
