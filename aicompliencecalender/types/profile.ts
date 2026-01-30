import type { Id } from "../convex/_generated/dataModel";

/** Address type for organization locations */
export type AddressType = "primary" | "mailing" | "billing";

/** Address entry in organization profile */
export interface Address {
  type: AddressType | string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/** Phone type for organization contacts */
export type PhoneType = "main" | "fax" | "mobile";

/** Phone entry in organization profile */
export interface Phone {
  type: PhoneType | string;
  number: string;
}

/** Email type for organization contacts */
export type EmailType = "primary" | "billing" | "compliance";

/** Email entry in organization profile */
export interface Email {
  type: EmailType | string;
  address: string;
}

/** License or certification number entry */
export interface LicenseNumber {
  type: string;
  number: string;
  state?: string;
  expiry?: number;
}

/** Officer or authorized contact */
export interface Officer {
  name: string;
  title: string;
  email: string;
}

/** Custom field for organization-specific data */
export interface CustomField {
  key: string;
  value: string;
  label?: string;
}

/** Organization profile data used for form filling */
export interface OrganizationProfile {
  _id: Id<"organization_profiles">;
  _creationTime: number;
  orgId: Id<"organizations">;
  legalName: string;
  dbaNames: string[];
  ein: string; // Encrypted at rest
  addresses: Address[];
  phones: Phone[];
  emails: Email[];
  website?: string;
  licenseNumbers: LicenseNumber[];
  npiNumber?: string;
  officers: Officer[];
  incorporationDate?: number;
  customFields?: Record<string, unknown>;
  updatedAt: number;
}

/** Input for creating/updating organization profile */
export interface OrganizationProfileInput {
  legalName: string;
  dbaNames?: string[];
  ein: string;
  addresses?: Address[];
  phones?: Phone[];
  emails?: Email[];
  website?: string;
  licenseNumbers?: LicenseNumber[];
  npiNumber?: string;
  officers?: Officer[];
  incorporationDate?: number;
  customFields?: Record<string, unknown>;
}

/** Address type labels for UI */
export const ADDRESS_TYPES: Record<string, string> = {
  primary: "Primary",
  mailing: "Mailing",
  billing: "Billing",
};

/** Phone type labels for UI */
export const PHONE_TYPES: Record<string, string> = {
  main: "Main",
  fax: "Fax",
  mobile: "Mobile",
};

/** Email type labels for UI */
export const EMAIL_TYPES: Record<string, string> = {
  primary: "Primary",
  billing: "Billing",
  compliance: "Compliance",
};

/** Common license types for form selection */
export const LICENSE_TYPES: Record<string, string> = {
  business: "Business License",
  professional: "Professional License",
  state: "State License",
  federal: "Federal License",
  dea: "DEA Registration",
  npi: "NPI Number",
  other: "Other",
};
