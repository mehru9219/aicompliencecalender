import type { IndustryTemplate } from "../../types/template";

/**
 * Comprehensive compliance template for medical practices, clinics, and physician offices.
 * Covers HIPAA, licensing, insurance, and regulatory requirements.
 */
export const healthcareMedicalPractice: IndustryTemplate = {
  slug: "healthcare-medical-practice",
  industry: "Healthcare",
  subIndustry: "Medical Practice",
  name: "Medical Practice",
  description:
    "Comprehensive compliance template for medical practices, clinics, and physician offices. Includes HIPAA requirements, medical licensing, DEA registration, insurance renewals, and state-specific regulatory deadlines.",
  version: "1.0.0",
  deadlines: [
    {
      id: "hipaa-risk-assessment",
      title: "HIPAA Annual Risk Assessment",
      description:
        "Conduct and document annual security risk assessment as required by HIPAA Security Rule (45 CFR 164.308(a)(1)(ii)(A)). Must identify potential risks to ePHI and document mitigation strategies.",
      category: "certification",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "anniversary",
      importance: "critical",
      penaltyRange: "$100 - $50,000 per violation, up to $1.5M annually",
      regulatoryBody: "HHS Office for Civil Rights",
      notes:
        "Must document findings and remediation plan. Consider engaging third-party assessor for comprehensive review.",
    },
    {
      id: "hipaa-workforce-training",
      title: "HIPAA Workforce Training",
      description:
        "Annual HIPAA privacy and security training for all workforce members including employees, volunteers, and contractors with access to PHI.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "anniversary",
      importance: "high",
      penaltyRange: "$100 - $50,000 per violation",
      regulatoryBody: "HHS Office for Civil Rights",
      notes:
        "Document attendance and training content. New hires must complete within 30 days.",
    },
    {
      id: "medical-license-renewal",
      title: "Medical License Renewal",
      description:
        "State medical board license renewal for practicing physicians. Requirements vary by state, typically including CME credits and fees.",
      category: "license",
      recurrence: { type: "custom", interval: 730 }, // Typically 2 years
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "License suspension, practice closure, legal liability",
      regulatoryBody: "State Medical Board",
      notes:
        "Check your specific state requirements - renewal periods vary from 1-3 years. Track CME requirements separately.",
    },
    {
      id: "dea-registration-renewal",
      title: "DEA Registration Renewal",
      description:
        "Drug Enforcement Administration registration renewal for prescribing controlled substances. Required for Schedule II-V medications.",
      category: "license",
      recurrence: { type: "custom", interval: 1095 }, // 3 years
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange:
        "Inability to prescribe controlled substances, fines up to $25,000",
      regulatoryBody: "DEA Diversion Control Division",
      notes:
        "Apply for renewal at least 45 days before expiration. Keep registration certificate accessible.",
    },
    {
      id: "clia-certificate-renewal",
      title: "CLIA Certificate Renewal",
      description:
        "Clinical Laboratory Improvement Amendments certificate renewal for practices performing lab tests. Required even for waived tests.",
      category: "certification",
      recurrence: { type: "custom", interval: 730 }, // 2 years
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: "custom",
      importance: "high",
      penaltyRange: "$10,000 per day of non-compliance",
      regulatoryBody: "Centers for Medicare & Medicaid Services (CMS)",
      notes:
        "Certificate type depends on testing complexity. Track personnel qualifications for moderate/high complexity.",
    },
    {
      id: "malpractice-insurance-renewal",
      title: "Malpractice Insurance Renewal",
      description:
        "Professional liability (malpractice) insurance policy renewal. Ensure coverage limits meet state and hospital privilege requirements.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange:
        "Personal liability exposure, loss of hospital privileges, state sanctions",
      regulatoryBody: "State Insurance Commissioner",
      notes:
        "Review coverage limits annually. Notify carrier of any claims or incidents.",
    },
    {
      id: "business-license-renewal",
      title: "Business License Renewal",
      description:
        "Local business license/permit renewal for medical practice operation. Requirements vary by municipality.",
      category: "license",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "fixed_date",
      defaultMonth: 12,
      defaultDay: 31,
      importance: "medium",
      penaltyRange: "Fines, business closure order",
      regulatoryBody: "City/County Business Office",
      notes: "Check if state medical facility license is also required.",
    },
    {
      id: "fire-safety-inspection",
      title: "Fire Safety Inspection",
      description:
        "Annual fire safety inspection and certification. Required for occupancy permit and insurance compliance.",
      category: "inspection",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "anniversary",
      importance: "medium",
      penaltyRange: "Fines, occupancy restrictions",
      regulatoryBody: "Local Fire Marshal",
      notes:
        "Schedule in advance. Ensure fire extinguishers, exits, and alarms are compliant.",
    },
    {
      id: "osha-compliance-review",
      title: "OSHA Compliance Review",
      description:
        "Annual review of OSHA compliance including bloodborne pathogen exposure control plan, hazard communication, and workplace safety.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "anniversary",
      importance: "high",
      penaltyRange: "$15,625 - $156,259 per violation",
      regulatoryBody: "Occupational Safety and Health Administration",
      notes:
        "Update exposure control plan annually. Maintain OSHA 300 log if 10+ employees.",
    },
    {
      id: "medicare-revalidation",
      title: "Medicare/Medicaid Revalidation",
      description:
        "CMS enrollment revalidation to maintain Medicare/Medicaid billing privileges. Typically required every 5 years or upon request.",
      category: "certification",
      recurrence: { type: "custom", interval: 1825 }, // 5 years
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "Deactivation of Medicare billing, loss of revenue",
      regulatoryBody: "Centers for Medicare & Medicaid Services (CMS)",
      notes:
        "Monitor PECOS for revalidation due date. Update any changes to practice information promptly.",
    },
    {
      id: "npi-review",
      title: "NPI Information Review",
      description:
        "Annual review and update of National Provider Identifier (NPI) information in NPPES to ensure accuracy.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "fixed_date",
      defaultMonth: 1,
      defaultDay: 15,
      importance: "medium",
      penaltyRange: "Claim denials, billing delays",
      regulatoryBody: "Centers for Medicare & Medicaid Services (CMS)",
      notes:
        "Update address, taxonomy, and authorized official information as needed.",
    },
    {
      id: "biohazard-waste-permit",
      title: "Medical Waste Permit Renewal",
      description:
        "State/local permit for generation and disposal of regulated medical waste including sharps, biohazardous materials.",
      category: "permit",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "custom",
      importance: "high",
      penaltyRange: "Fines up to $25,000 per day, permit revocation",
      regulatoryBody: "State Environmental Agency",
      notes:
        "Maintain waste manifests. Ensure waste hauler is properly licensed.",
    },
  ],
  documentCategories: [
    "licenses",
    "certifications",
    "training_records",
    "policies",
    "insurance",
    "audit_reports",
    "contracts",
  ],
  regulatoryReferences: [
    {
      name: "HIPAA Security Rule",
      url: "https://www.hhs.gov/hipaa/for-professionals/security/index.html",
      description:
        "HHS guidance on HIPAA security requirements for covered entities",
    },
    {
      name: "HIPAA Privacy Rule",
      url: "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html",
      description:
        "HHS guidance on HIPAA privacy requirements and patient rights",
    },
    {
      name: "DEA Diversion Control",
      url: "https://www.deadiversion.usdoj.gov/",
      description:
        "DEA registration, compliance, and controlled substance requirements",
    },
    {
      name: "CMS CLIA Program",
      url: "https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments",
      description:
        "Clinical Laboratory Improvement Amendments certification requirements",
    },
    {
      name: "OSHA Healthcare",
      url: "https://www.osha.gov/healthcare",
      description: "OSHA workplace safety requirements for healthcare settings",
    },
    {
      name: "Medicare Enrollment",
      url: "https://www.cms.gov/medicare/enrollment-renewal/providers-suppliers",
      description:
        "CMS Medicare provider enrollment and revalidation requirements",
    },
  ],
};
