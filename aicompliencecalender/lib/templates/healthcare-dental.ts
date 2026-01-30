import type { IndustryTemplate } from "../../types/template";

/**
 * Compliance template for dental practices including general dentistry, orthodontics, and oral surgery.
 */
export const healthcareDental: IndustryTemplate = {
  slug: "healthcare-dental",
  industry: "Healthcare",
  subIndustry: "Dental Practice",
  name: "Dental Practice",
  description:
    "Compliance template for dental practices including general dentistry, orthodontics, and oral surgery. Covers dental board licensing, OSHA requirements, radiation safety, and infection control.",
  version: "1.0.0",
  deadlines: [
    {
      id: "dental-license-renewal",
      title: "Dental License Renewal",
      description:
        "State dental board license renewal for practicing dentists. Requires continuing education credits.",
      category: "license",
      recurrence: { type: "custom", interval: 730 },
      defaultAlertDays: [90, 60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "License suspension, practice closure",
      regulatoryBody: "State Dental Board",
      notes: "CE requirements vary by state. Track separately.",
    },
    {
      id: "dental-hygienist-license",
      title: "Dental Hygienist License Renewal",
      description:
        "State license renewal for dental hygienists. Track for all employed hygienists.",
      category: "license",
      recurrence: { type: "custom", interval: 730 },
      defaultAlertDays: [60, 30, 14],
      anchorType: "custom",
      importance: "high",
      regulatoryBody: "State Dental Board",
    },
    {
      id: "xray-equipment-inspection",
      title: "X-Ray Equipment Inspection",
      description:
        "State radiation safety inspection of dental X-ray equipment. Required for radiation safety compliance.",
      category: "inspection",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14],
      anchorType: "anniversary",
      importance: "high",
      penaltyRange: "Fines, equipment use restrictions",
      regulatoryBody: "State Radiation Control Program",
      notes: "Maintain dosimetry records for staff. Post required signage.",
    },
    {
      id: "dea-registration-dental",
      title: "DEA Registration Renewal",
      description:
        "DEA registration for prescribing controlled substances including pain medications and sedatives.",
      category: "license",
      recurrence: { type: "custom", interval: 1095 },
      defaultAlertDays: [90, 60, 30, 14],
      anchorType: "custom",
      importance: "critical",
      penaltyRange: "Inability to prescribe controlled substances",
      regulatoryBody: "DEA Diversion Control Division",
    },
    {
      id: "infection-control-training",
      title: "Infection Control Training",
      description:
        "Annual bloodborne pathogen and infection control training for all clinical staff per OSHA requirements.",
      category: "training",
      recurrence: { type: "annual" },
      defaultAlertDays: [30, 14, 7],
      anchorType: "anniversary",
      importance: "high",
      penaltyRange: "$15,625+ per violation",
      regulatoryBody: "OSHA",
      notes: "Document training attendance and content.",
    },
    {
      id: "nitrous-oxide-permit",
      title: "Nitrous Oxide/Sedation Permit Renewal",
      description:
        "State permit for administering nitrous oxide or conscious sedation. Requires specific training documentation.",
      category: "permit",
      recurrence: { type: "custom", interval: 730 },
      defaultAlertDays: [60, 30, 14],
      anchorType: "custom",
      importance: "high",
      regulatoryBody: "State Dental Board",
      notes: "If applicable to your practice.",
    },
    {
      id: "malpractice-insurance-dental",
      title: "Malpractice Insurance Renewal",
      description:
        "Professional liability insurance renewal for dental practice.",
      category: "insurance",
      recurrence: { type: "annual" },
      defaultAlertDays: [60, 30, 14, 7],
      anchorType: "custom",
      importance: "critical",
      regulatoryBody: "State Insurance Commissioner",
    },
  ],
  documentCategories: [
    "licenses",
    "certifications",
    "training_records",
    "insurance",
    "inspection_reports",
    "policies",
  ],
  regulatoryReferences: [
    {
      name: "ADA Regulatory Compliance",
      url: "https://www.ada.org/resources/practice/dental-practice-success/regulatory-compliance",
      description:
        "American Dental Association guidance on regulatory compliance",
    },
    {
      name: "OSHA Dentistry",
      url: "https://www.osha.gov/dentistry",
      description: "OSHA standards for dental offices",
    },
    {
      name: "CDC Dental Infection Control",
      url: "https://www.cdc.gov/infection-control/hcp/dental/index.html",
      description: "CDC guidelines for infection control in dental settings",
    },
  ],
};
