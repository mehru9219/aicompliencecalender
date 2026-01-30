import type { IndustryTemplate } from "../../types/template";

/**
 * Compliance template for CPA firms and accounting practices.
 */
export const financialCpaFirm: IndustryTemplate = {
  slug: "financial-cpa-firm",
  industry: "Financial",
  subIndustry: "CPA Firm",
  name: "CPA Firm",
  description:
    "Compliance template for CPA firms and accounting practices. Covers CPA licensing, peer review requirements, professional standards, and firm registration.",
  version: "1.0.0",
  deadlines: [
    {
      id: "cpa-license-renewal",
      title: "CPA License Renewal",
      description:
        "State CPA license renewal including required CPE credits. Track for all licensed CPAs in firm.",
      category: "license",
      recurrence: { type: "annual" },
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "License suspension, inability to sign reports",
      regulatoryBody: "State Board of Accountancy",
      notes:
        "CPE requirements vary by state (typically 40 hours/year, 120 hours/3 years).",
    },
    {
      id: "firm-registration-renewal",
      title: "CPA Firm Registration Renewal",
      description:
        "Annual firm registration with state board of accountancy. Required for firms issuing attest reports.",
      category: "license",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "Firm cannot issue attest reports, fines",
      regulatoryBody: "State Board of Accountancy",
    },
    {
      id: "peer-review",
      title: "Peer Review Completion",
      description:
        "AICPA Peer Review required every 3 years for firms performing attest engagements.",
      category: "audit",
      recurrence: { type: "custom", interval: 1095 },
      defaultAlertDays: [180, 90, 60, 30],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "Loss of AICPA membership, state sanctions",
      regulatoryBody: "AICPA / State Board",
      notes:
        "Schedule peer review well in advance. Address any findings promptly.",
    },
    {
      id: "cpe-completion",
      title: "CPE Hours Completion Deadline",
      description:
        "Complete required Continuing Professional Education hours before reporting period deadline.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      regulatoryBody: "State Board of Accountancy",
      notes:
        "Include ethics hours as required. Track by state if multi-state licensed.",
    },
    {
      id: "professional-liability-cpa",
      title: "Professional Liability Insurance Renewal",
      description:
        "CPA professional liability insurance renewal. Required by many states and for most client engagements.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      regulatoryBody: "State Insurance Commissioner",
      notes: "Coverage limits should align with engagement size.",
    },
    {
      id: "quality-control-review",
      title: "Quality Control Review",
      description:
        "Annual internal review of firm's quality control policies per SQCS No. 8.",
      category: "audit",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "anniversary",
      importance: "high",
      regulatoryBody: "AICPA",
      notes: "Document review and any policy updates.",
    },
    {
      id: "engagement-letter-review",
      title: "Engagement Letter Template Review",
      description:
        "Annual review of engagement letter templates for compliance with current standards.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "fixed_date",
      defaultMonth: 1,
      defaultDay: 15,
      importance: "medium",
      notes: "Update for any new standards or regulatory changes.",
    },
  ],
  documentCategories: [
    "licenses",
    "training_records",
    "insurance",
    "peer_review",
    "policies",
    "quality_control",
  ],
  regulatoryReferences: [
    {
      name: "AICPA Professional Standards",
      url: "https://www.aicpa.org/resources/landing/aicpa-professional-standards",
      description: "AICPA professional standards and guidance",
    },
    {
      name: "AICPA Peer Review",
      url: "https://www.aicpa.org/resources/article/overview-of-peer-review",
      description: "AICPA peer review program overview",
    },
    {
      name: "NASBA CPE Requirements",
      url: "https://www.nasbaregistry.org/cpe-requirements",
      description: "State-by-state CPE requirements from NASBA",
    },
  ],
};
