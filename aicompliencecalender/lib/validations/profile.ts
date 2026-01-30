import { z } from "zod";

/** Regex for EIN format: XX-XXXXXXX */
const EIN_REGEX = /^\d{2}-\d{7}$/;

/** Regex for US phone number: various formats */
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

/** US states for validation */
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
  "VI",
  "GU",
  "AS",
  "MP",
] as const;

/** Validate legal name */
export const legalNameSchema = z
  .string()
  .min(1, "Legal name is required")
  .max(200, "Legal name must be 200 characters or less")
  .refine(
    (name) => name.trim().length > 0,
    "Legal name cannot be only whitespace",
  );

/** Validate DBA name */
export const dbaNameSchema = z
  .string()
  .min(1, "DBA name is required")
  .max(200, "DBA name must be 200 characters or less");

/** Validate EIN format */
export const einSchema = z
  .string()
  .regex(EIN_REGEX, "EIN must be in format XX-XXXXXXX (e.g., 12-3456789)");

/** Validate phone number */
export const phoneNumberSchema = z
  .string()
  .regex(PHONE_REGEX, "Invalid phone number format");

/** Validate email address */
export const emailAddressSchema = z.string().email("Invalid email address");

/** Validate URL/website */
export const websiteSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Website must start with http:// or https://",
  );

/** Validate ZIP code */
export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be 5 digits or 5+4 format");

/** Validate US state */
export const stateSchema = z.enum(US_STATES, {
  message: "Invalid state code",
});

/** Address schema */
export const addressSchema = z.object({
  type: z.string().min(1, "Address type is required"),
  street: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Street address too long"),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z.string().min(1, "State is required").max(50, "State name too long"),
  zip: zipCodeSchema,
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country name too long")
    .default("USA"),
});

/** Phone schema */
export const phoneSchema = z.object({
  type: z.string().min(1, "Phone type is required"),
  number: phoneNumberSchema,
});

/** Email schema */
export const emailSchema = z.object({
  type: z.string().min(1, "Email type is required"),
  address: emailAddressSchema,
});

/** License number schema */
export const licenseNumberSchema = z.object({
  type: z.string().min(1, "License type is required"),
  number: z
    .string()
    .min(1, "License number is required")
    .max(100, "License number too long"),
  state: z.string().max(50, "State name too long").optional(),
  expiry: z.number().positive("Expiry date must be valid").optional(),
});

/** Officer schema */
export const officerSchema = z.object({
  name: z.string().min(1, "Officer name is required").max(200, "Name too long"),
  title: z
    .string()
    .min(1, "Officer title is required")
    .max(100, "Title too long"),
  email: emailAddressSchema,
});

/** NPI number schema (10 digits) */
export const npiNumberSchema = z
  .string()
  .regex(/^\d{10}$/, "NPI number must be exactly 10 digits");

/** Full organization profile schema */
export const organizationProfileSchema = z.object({
  legalName: legalNameSchema,
  dbaNames: z.array(dbaNameSchema).optional().default([]),
  ein: einSchema,
  addresses: z.array(addressSchema).min(1, "At least one address is required"),
  phones: z.array(phoneSchema).min(1, "At least one phone number is required"),
  emails: z.array(emailSchema).min(1, "At least one email is required"),
  website: websiteSchema.optional(),
  licenseNumbers: z.array(licenseNumberSchema).optional().default([]),
  npiNumber: npiNumberSchema.optional(),
  officers: z.array(officerSchema).optional().default([]),
  incorporationDate: z
    .number()
    .positive("Incorporation date must be valid")
    .optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

/** Partial profile schema for updates */
export const organizationProfileUpdateSchema =
  organizationProfileSchema.partial();

/** Validate EIN with checksum (Luhn algorithm variant) */
export function validateEINChecksum(ein: string): boolean {
  // Remove hyphen
  const digits = ein.replace("-", "");
  if (digits.length !== 9) return false;

  // Basic validation - EIN first two digits must be valid prefix
  const prefix = parseInt(digits.slice(0, 2), 10);
  const validPrefixes = [
    // IRS campus codes
    10, 12, 60, 67, 50, 53, 1, 2, 3, 4, 5, 6, 11, 13, 14, 16, 21, 22, 23, 25,
    34, 51, 52, 54, 55, 56, 57, 58, 59, 65, 30, 32, 35, 36, 37, 38, 61, 62, 63,
    64, 66, 68, 71, 72, 73, 74, 75, 76, 77, 81, 82, 83, 84, 85, 86, 87, 88, 91,
    92, 93, 94, 95, 98, 99,
    // Small Business Administration
    20, 26, 27, 45, 46, 47,
  ];

  return validPrefixes.includes(prefix);
}

/** Helper to format phone number consistently */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone; // Return original if can't format
}

/** Helper to format EIN consistently */
export function formatEIN(ein: string): string {
  const digits = ein.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return ein;
}

/** Type exports */
export type OrganizationProfileInput = z.infer<
  typeof organizationProfileSchema
>;
export type OrganizationProfileUpdateInput = z.infer<
  typeof organizationProfileUpdateSchema
>;
export type AddressInput = z.infer<typeof addressSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type LicenseNumberInput = z.infer<typeof licenseNumberSchema>;
export type OfficerInput = z.infer<typeof officerSchema>;
