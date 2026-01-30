import type { Id } from "../convex/_generated/dataModel";

/** Document category for classification */
export type DocumentCategory =
  | "licenses"
  | "certifications"
  | "training_records"
  | "audit_reports"
  | "policies"
  | "insurance"
  | "contracts"
  | "other";

/** Document access action types */
export type DocumentAccessAction = "view" | "download" | "update" | "delete";

/** Document entity from database */
export interface Document {
  _id: Id<"documents">;
  _creationTime: number;
  orgId: Id<"organizations">;
  deadlineIds: Id<"deadlines">[];
  fileName: string;
  fileType: string;
  fileSize: number;
  storageId: Id<"_storage">;
  category: DocumentCategory;
  extractedText?: string;
  metadata?: Record<string, unknown>;
  version: number;
  previousVersionId?: Id<"documents">;
  uploadedAt: number;
  uploadedBy: string;
  lastAccessedAt: number;
  lastAccessedBy: string;
  deletedAt?: number;
}

/** Document access log entry */
export interface DocumentAccessLog {
  _id: Id<"document_access_log">;
  _creationTime: number;
  documentId: Id<"documents">;
  orgId: Id<"organizations">;
  userId: string;
  action: DocumentAccessAction;
  timestamp: number;
  ipAddress?: string;
}

/** Input for uploading a document */
export interface DocumentUploadInput {
  orgId: Id<"organizations">;
  storageId: Id<"_storage">;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  deadlineIds?: Id<"deadlines">[];
}

/** Document with download URL */
export interface DocumentWithUrl extends Document {
  downloadUrl: string | null;
}

/** Document categories with display labels */
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, string> = {
  licenses: "Licenses",
  certifications: "Certifications",
  training_records: "Training Records",
  audit_reports: "Audit Reports",
  policies: "Policies",
  insurance: "Insurance",
  contracts: "Contracts",
  other: "Other",
};

/** Document category icons (for UI) */
export const DOCUMENT_CATEGORY_ICONS: Record<DocumentCategory, string> = {
  licenses: "badge",
  certifications: "award",
  training_records: "book-open",
  audit_reports: "clipboard-check",
  policies: "file-text",
  insurance: "shield",
  contracts: "file-signature",
  other: "file",
};

/** Allowed file extensions */
export const ALLOWED_FILE_TYPES = [
  "pdf",
  "docx",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

/** Maximum file size in bytes (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** File type display labels */
export const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF Document",
  docx: "Word Document",
  xlsx: "Excel Spreadsheet",
  jpg: "JPEG Image",
  jpeg: "JPEG Image",
  png: "PNG Image",
};

/** Get file type from filename */
export function getFileType(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/** Check if file type is allowed */
export function isAllowedFileType(
  fileType: string,
): fileType is AllowedFileType {
  return ALLOWED_FILE_TYPES.includes(fileType as AllowedFileType);
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
