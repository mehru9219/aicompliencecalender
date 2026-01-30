import type { IndustryTemplate } from "../../types/template";

/**
 * Compliance template for law firms and legal practices.
 */
export const legalLawFirm: IndustryTemplate = {
  slug: "legal-law-firm",
  industry: "Legal",
  subIndustry: "Law Firm",
  name: "Law Firm",
  description:
    "Compliance template for law firms and legal practices. Covers state bar requirements, IOLTA trust account compliance, malpractice insurance, and client file retention.",
  version: "1.0.0",
  deadlines: [
    {
      id: "state-bar-registration",
      title: "State Bar Registration Renewal",
      description:
        "Annual state bar registration and dues payment. Required to maintain active license to practice law.",
      category: "license",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "fixed_date",
      defaultMonth: 2,
      defaultDay: 1,
      importance: "critical",
      penaltyRange: "Administrative suspension, inability to practice",
      regulatoryBody: "State Bar Association",
      notes: "Due dates vary by state. Check your specific state bar.",
    },
    {
      id: "mcle-compliance",
      title: "MCLE Compliance Deadline",
      description:
        "Mandatory Continuing Legal Education credits completion and reporting. Requirements vary by state.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "Administrative suspension, late fees",
      regulatoryBody: "State Bar Association",
      notes:
        "Ethics hours often required separately. Track specialization CLE if applicable.",
    },
    {
      id: "iolta-compliance",
      title: "IOLTA Trust Account Certification",
      description:
        "Annual certification of Interest on Lawyer Trust Account compliance. Required for handling client funds.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "fixed_date",
      defaultMonth: 3,
      defaultDay: 1,
      importance: "critical",
      penaltyRange: "Disciplinary action, malpractice liability",
      regulatoryBody: "State Bar Association",
      notes:
        "Reconcile trust accounts monthly. Report any discrepancies immediately.",
    },
    {
      id: "malpractice-insurance-legal",
      title: "Professional Liability Insurance Renewal",
      description:
        "Legal malpractice insurance renewal. Coverage limits should meet practice area requirements.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange:
        "Personal liability exposure, state disclosure requirements",
      regulatoryBody: "State Bar Association",
      notes: "Some states require disclosure to clients if uninsured.",
    },
    {
      id: "client-trust-audit",
      title: "Client Trust Account Audit",
      description:
        "Annual audit or review of client trust accounts. Some states require random compliance audits.",
      category: "audit",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "anniversary",
      importance: "high",
      regulatoryBody: "State Bar Association",
      notes:
        "Maintain detailed records. Be prepared for random state bar audits.",
    },
    {
      id: "file-retention-review",
      title: "Client File Retention Review",
      description:
        "Review closed client files for retention compliance. Determine files eligible for destruction per state rules.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "fixed_date",
      defaultMonth: 1,
      defaultDay: 15,
      importance: "medium",
      regulatoryBody: "State Bar Association",
      notes:
        "Retention periods vary by matter type. Document destruction process.",
    },
    {
      id: "conflicts-database-audit",
      title: "Conflicts Database Audit",
      description:
        "Audit conflicts of interest database for accuracy and completeness.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "anniversary",
      importance: "high",
      notes: "Critical for ethical compliance. Update procedures as needed.",
    },
  ],
  documentCategories: [
    "licenses",
    "training_records",
    "insurance",
    "trust_account_records",
    "policies",
    "audit_reports",
  ],
  regulatoryReferences: [
    {
      name: "ABA Model Rules",
      url: "https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/",
      description: "ABA Model Rules of Professional Conduct",
    },
    {
      name: "IOLTA Information",
      url: "https://www.americanbar.org/groups/interest_lawyers_trust_accounts/",
      description: "ABA Interest on Lawyers' Trust Accounts information",
    },
  ],
};
