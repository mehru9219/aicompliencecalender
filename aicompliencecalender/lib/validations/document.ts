import { z } from "zod";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/types/document";

/** Document categories enum */
const documentCategories = [
  "licenses",
  "certifications",
  "training_records",
  "audit_reports",
  "policies",
  "insurance",
  "contracts",
  "other",
] as const;

/** Regex to detect path traversal attempts */
const PATH_TRAVERSAL_REGEX = /(\.\.|\/|\\|%2e%2e|%2f|%5c)/i;

/** Validate file name - no path traversal, reasonable length */
export const fileNameSchema = z
  .string()
  .min(1, "File name is required")
  .max(255, "File name must be 255 characters or less")
  .refine(
    (name) => !PATH_TRAVERSAL_REGEX.test(name),
    "File name contains invalid characters",
  )
  .refine((name) => {
    const parts = name.split(".");
    return parts.length >= 2 && parts[parts.length - 1].length > 0;
  }, "File name must have an extension");

/** Validate file type - must be in allowed list */
export const fileTypeSchema = z
  .string()
  .toLowerCase()
  .refine(
    (type) =>
      ALLOWED_FILE_TYPES.includes(type as (typeof ALLOWED_FILE_TYPES)[number]),
    {
      message: `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
    },
  );

/** Validate file size - max 50MB */
export const fileSizeSchema = z
  .number()
  .positive("File size must be positive")
  .max(
    MAX_FILE_SIZE,
    `File size must be ${MAX_FILE_SIZE / (1024 * 1024)}MB or less`,
  );

/** Validate document category */
export const documentCategorySchema = z.enum(documentCategories, {
  message: `Category must be one of: ${documentCategories.join(", ")}`,
});

/** Schema for document upload input */
export const documentUploadSchema = z.object({
  fileName: fileNameSchema,
  fileType: fileTypeSchema,
  fileSize: fileSizeSchema,
  category: documentCategorySchema,
  deadlineIds: z.array(z.string()).optional(),
});

/** Schema for document update */
export const documentUpdateSchema = z.object({
  category: documentCategorySchema.optional(),
  deadlineIds: z.array(z.string()).optional(),
});

/** Schema for document search */
export const documentSearchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(200, "Search query too long"),
  category: documentCategorySchema.optional(),
  deadlineId: z.string().optional(),
  dateRange: z
    .object({
      from: z.number(),
      to: z.number(),
    })
    .optional()
    .refine(
      (range) => !range || range.from <= range.to,
      "Start date must be before end date",
    ),
});

/** Validate a file before upload */
export function validateFile(file: File): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate file name
  const nameResult = fileNameSchema.safeParse(file.name);
  if (!nameResult.success) {
    errors.push(...nameResult.error.issues.map((e) => e.message));
  }

  // Validate file size
  const sizeResult = fileSizeSchema.safeParse(file.size);
  if (!sizeResult.success) {
    errors.push(...sizeResult.error.issues.map((e) => e.message));
  }

  // Validate file type
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeResult = fileTypeSchema.safeParse(extension);
  if (!typeResult.success) {
    errors.push(...typeResult.error.issues.map((e) => e.message));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Type exports */
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
