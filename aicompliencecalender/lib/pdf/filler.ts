import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
} from "pdf-lib";
import type { FieldMatchResult } from "@/types/form";

/**
 * Result of filling a PDF form.
 */
export interface FillResult {
  pdf: Uint8Array;
  filledFields: string[];
  skippedFields: string[];
  signatureFields: string[];
  warnings: string[];
}

/**
 * Options for PDF filling.
 */
export interface FillOptions {
  /** Flatten the form after filling (makes fields non-editable) */
  flatten?: boolean;
  /** Skip fields that have existing values */
  skipExistingValues?: boolean;
}

/**
 * Fill a PDF form with the provided values.
 *
 * @param pdfBuffer - The original PDF as ArrayBuffer
 * @param mappings - Record of field name to value/match result
 * @param options - Optional fill options
 * @returns FillResult with filled PDF and metadata
 */
export async function fillPdfForm(
  pdfBuffer: ArrayBuffer,
  mappings: Record<string, string | FieldMatchResult>,
  options: FillOptions = {},
): Promise<FillResult> {
  const filledFields: string[] = [];
  const skippedFields: string[] = [];
  const signatureFields: string[] = [];
  const warnings: string[] = [];

  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Normalize mappings to string values
    const values: Record<string, string> = {};
    for (const [fieldName, mapping] of Object.entries(mappings)) {
      if (typeof mapping === "string") {
        values[fieldName] = mapping;
      } else {
        values[fieldName] = mapping.value;
      }
    }

    // Fill each field
    for (const field of fields) {
      const fieldName = field.getName();
      const constructorName = field.constructor.name;

      // Check if this is a signature field
      if (constructorName === "PDFSignature") {
        signatureFields.push(fieldName);
        continue;
      }

      // Check if we have a value for this field
      const value = values[fieldName];
      if (value === undefined) {
        skippedFields.push(fieldName);
        continue;
      }

      // Fill based on field type
      try {
        switch (constructorName) {
          case "PDFTextField":
            fillTextField(field as PDFTextField, value, options, warnings);
            filledFields.push(fieldName);
            break;

          case "PDFCheckBox":
            fillCheckBox(field as PDFCheckBox, value, warnings);
            filledFields.push(fieldName);
            break;

          case "PDFDropdown":
            fillDropdown(field as PDFDropdown, value, warnings);
            filledFields.push(fieldName);
            break;

          case "PDFRadioGroup":
            fillRadioGroup(field as PDFRadioGroup, value, warnings);
            filledFields.push(fieldName);
            break;

          case "PDFOptionList":
            // Similar to dropdown
            const dropdown = field as unknown as PDFDropdown;
            fillDropdown(dropdown, value, warnings);
            filledFields.push(fieldName);
            break;

          default:
            warnings.push(
              `Unknown field type "${constructorName}" for field "${fieldName}"`,
            );
            skippedFields.push(fieldName);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        warnings.push(`Failed to fill field "${fieldName}": ${message}`);
        skippedFields.push(fieldName);
      }
    }

    // Optionally flatten the form
    if (options.flatten) {
      form.flatten();
    }

    // Save and return
    const pdf = await pdfDoc.save();

    return {
      pdf,
      filledFields,
      skippedFields,
      signatureFields,
      warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to process PDF: ${message}`);
  }
}

/**
 * Fill a text field.
 */
function fillTextField(
  field: PDFTextField,
  value: string,
  options: FillOptions,
  warnings: string[],
): void {
  // Check for existing value if option is set
  if (options.skipExistingValues) {
    const existing = field.getText();
    if (existing && existing.trim() !== "") {
      warnings.push(`Skipping field "${field.getName()}" - has existing value`);
      return;
    }
  }

  // Handle multiline vs single line
  if (field.isMultiline()) {
    field.setText(value);
  } else {
    // For single line, remove newlines
    field.setText(value.replace(/\n/g, " ").trim());
  }
}

/**
 * Fill a checkbox field.
 */
function fillCheckBox(
  field: PDFCheckBox,
  value: string,
  warnings: string[],
): void {
  const normalizedValue = value.toLowerCase().trim();
  const isChecked =
    normalizedValue === "true" ||
    normalizedValue === "yes" ||
    normalizedValue === "1" ||
    normalizedValue === "on" ||
    normalizedValue === "x";

  if (isChecked) {
    field.check();
  } else {
    field.uncheck();
  }
}

/**
 * Fill a dropdown field.
 */
function fillDropdown(
  field: PDFDropdown,
  value: string,
  warnings: string[],
): void {
  const options = field.getOptions();

  // Try exact match first
  if (options.includes(value)) {
    field.select(value);
    return;
  }

  // Try case-insensitive match
  const lowerValue = value.toLowerCase();
  const match = options.find((opt) => opt.toLowerCase() === lowerValue);
  if (match) {
    field.select(match);
    return;
  }

  // Try partial match
  const partialMatch = options.find(
    (opt) =>
      opt.toLowerCase().includes(lowerValue) ||
      lowerValue.includes(opt.toLowerCase()),
  );
  if (partialMatch) {
    warnings.push(
      `Field "${field.getName()}": Partial match - using "${partialMatch}" for "${value}"`,
    );
    field.select(partialMatch);
    return;
  }

  // Check if field allows custom values
  if (field.isEditable()) {
    field.select(value);
    warnings.push(
      `Field "${field.getName()}": Value "${value}" not in options, but field is editable`,
    );
    return;
  }

  // Can't set value - report warning
  warnings.push(
    `Field "${field.getName()}": Value "${value}" not in options: [${options.join(", ")}]`,
  );
}

/**
 * Fill a radio group field.
 */
function fillRadioGroup(
  field: PDFRadioGroup,
  value: string,
  warnings: string[],
): void {
  const options = field.getOptions();

  // Try exact match first
  if (options.includes(value)) {
    field.select(value);
    return;
  }

  // Try case-insensitive match
  const lowerValue = value.toLowerCase();
  const match = options.find((opt) => opt.toLowerCase() === lowerValue);
  if (match) {
    field.select(match);
    return;
  }

  // Can't set value - report warning
  warnings.push(
    `Radio group "${field.getName()}": Value "${value}" not in options: [${options.join(", ")}]`,
  );
}

/**
 * Validate that a PDF has fillable form fields.
 */
export async function validatePdfHasForm(
  pdfBuffer: ArrayBuffer,
): Promise<{ hasForm: boolean; fieldCount: number; error?: string }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    return {
      hasForm: fields.length > 0,
      fieldCount: fields.length,
    };
  } catch (err) {
    return {
      hasForm: false,
      fieldCount: 0,
      error: err instanceof Error ? err.message : "Failed to load PDF",
    };
  }
}

/**
 * Get a summary of how well mappings cover the form fields.
 */
export async function getMappingCoverage(
  pdfBuffer: ArrayBuffer,
  mappings: Record<string, string | FieldMatchResult>,
): Promise<{
  total: number;
  covered: number;
  missing: string[];
  signatures: string[];
  coveragePercent: number;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const missing: string[] = [];
    const signatures: string[] = [];
    let covered = 0;

    for (const field of fields) {
      const name = field.getName();
      const constructorName = field.constructor.name;

      if (constructorName === "PDFSignature") {
        signatures.push(name);
        continue;
      }

      if (name in mappings) {
        covered++;
      } else {
        missing.push(name);
      }
    }

    // Don't count signatures in total
    const total = fields.length - signatures.length;

    return {
      total,
      covered,
      missing,
      signatures,
      coveragePercent: total > 0 ? Math.round((covered / total) * 100) : 100,
    };
  } catch {
    return {
      total: 0,
      covered: 0,
      missing: [],
      signatures: [],
      coveragePercent: 0,
    };
  }
}
