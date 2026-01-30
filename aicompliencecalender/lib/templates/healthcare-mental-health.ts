import type { IndustryTemplate } from "../../types/template";

/**
 * Compliance template for mental health practices including psychologists, therapists, and counselors.
 */
export const healthcareMentalHealth: IndustryTemplate = {
  slug: "healthcare-mental-health",
  industry: "Healthcare",
  subIndustry: "Mental Health Practice",
  name: "Mental Health Practice",
  description:
    "Compliance template for mental health practices including psychologists, therapists, licensed counselors, and psychiatric practices. Covers state licensing, HIPAA compliance, and specialized training requirements.",
  version: "1.0.0",
  deadlines: [
    {
      id: "psychology-license-renewal",
      title: "Psychology/Therapy License Renewal",
      description:
        "State license renewal for psychologists, LPCs, LMFTs, or LCSWs. Requirements vary by credential type and state.",
      category: "license",
      recurrence: { type: "custom", interval: 730 },
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "License suspension, inability to practice",
      regulatoryBody: "State Licensing Board",
      notes: "Track CE requirements specific to your license type.",
    },
    {
      id: "hipaa-training-mental-health",
      title: "HIPAA Privacy Training",
      description:
        "Annual HIPAA training with emphasis on mental health record protections and psychotherapy notes.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "anniversary",
      importance: "high",
      penaltyRange: "$100 - $50,000 per violation",
      regulatoryBody: "HHS Office for Civil Rights",
      notes: "Include training on 42 CFR Part 2 if treating substance abuse.",
    },
    {
      id: "continuing-education",
      title: "Continuing Education Completion",
      description:
        "Complete required continuing education credits for license renewal. Track hours by category as required.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "custom",
      importance: "high",
      regulatoryBody: "State Licensing Board",
      notes:
        "Ethics CE often required separately. Check state-specific requirements.",
    },
    {
      id: "professional-liability-insurance",
      title: "Professional Liability Insurance Renewal",
      description:
        "Malpractice and professional liability insurance renewal. Coverage requirements may be state-mandated.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      regulatoryBody: "State Insurance Commissioner",
    },
    {
      id: "supervision-documentation",
      title: "Supervision Documentation Review",
      description:
        "Review and update supervision documentation if supervising unlicensed staff or interns.",
      category: "compliance",
      recurrence: { type: "quarterly" },
      defaultAlertDays: [14, 7],
      anchorType: "fixed_date",
      defaultMonth: 3,
      defaultDay: 31,
      importance: "medium",
      regulatoryBody: "State Licensing Board",
      notes: "If applicable to your practice.",
    },
    {
      id: "telehealth-compliance",
      title: "Telehealth Compliance Review",
      description:
        "Review telehealth policies, interstate licensing, and platform compliance with HIPAA.",
      category: "compliance",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14],
      anchorType: "anniversary",
      importance: "medium",
      notes: "Check state laws on telehealth practice across state lines.",
    },
  ],
  documentCategories: [
    "licenses",
    "certifications",
    "training_records",
    "insurance",
    "policies",
    "supervision_records",
  ],
  regulatoryReferences: [
    {
      name: "HIPAA for Mental Health",
      url: "https://www.hhs.gov/hipaa/for-professionals/special-topics/mental-health/index.html",
      description:
        "HHS guidance on HIPAA as it applies to mental health information",
    },
    {
      name: "42 CFR Part 2",
      url: "https://www.samhsa.gov/about-us/who-we-are/laws-regulations/confidentiality-regulations-faqs",
      description:
        "SAMHSA guidance on confidentiality of substance use disorder records",
    },
    {
      name: "APA Practice Guidelines",
      url: "https://www.apa.org/practice/guidelines",
      description: "American Psychological Association practice guidelines",
    },
  ],
};
