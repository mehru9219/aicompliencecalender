import { PDFDocument } from "pdf-lib";
import type { FormFieldType, FormField, FieldPosition } from "@/types/form";

/**
 * Extract form fields from a PDF document.
 * Uses pdf-lib to read AcroForm fields.
 *
 * @param pdfBuffer - The PDF file as an ArrayBuffer
 * @returns Array of form fields, empty array if PDF has no forms
 */
export async function extractFormFields(
  pdfBuffer: ArrayBuffer,
): Promise<FormField[]> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    // Check if PDF has a form
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      return [];
    }

    const extractedFields: FormField[] = [];

    for (const field of fields) {
      const fieldName = field.getName();
      const fieldType = getFieldType(field);

      // Get field options for dropdown/radio
      const options = getFieldOptions(field);

      // Get field position (approximate from first widget)
      const position = getFieldPosition(field);

      // Check if required (if field has required flag)
      const required = isFieldRequired(field);

      // Get default value if any
      const defaultValue = getFieldDefaultValue(field);

      extractedFields.push({
        name: fieldName,
        type: fieldType,
        options: options.length > 0 ? options : undefined,
        position,
        required,
        defaultValue,
      });
    }

    return extractedFields;
  } catch (error) {
    // If PDF loading fails (corrupted, encrypted, etc.), return empty array
    console.warn("Failed to extract form fields from PDF:", error);
    return [];
  }
}

/**
 * Determine the field type from a pdf-lib field object.
 */
function getFieldType(
  field: ReturnType<
    ReturnType<typeof PDFDocument.prototype.getForm>["getField"]
  >,
): FormFieldType {
  const constructorName = field.constructor.name;

  switch (constructorName) {
    case "PDFTextField":
      return "text";
    case "PDFCheckBox":
      return "checkbox";
    case "PDFDropdown":
      return "dropdown";
    case "PDFRadioGroup":
      return "radio";
    case "PDFOptionList":
      return "dropdown";
    case "PDFSignature":
      return "signature";
    default:
      return "text";
  }
}

/**
 * Get options for dropdown and radio fields.
 */
function getFieldOptions(
  field: ReturnType<
    ReturnType<typeof PDFDocument.prototype.getForm>["getField"]
  >,
): string[] {
  try {
    const constructorName = field.constructor.name;

    if (
      constructorName === "PDFDropdown" ||
      constructorName === "PDFOptionList"
    ) {
      // pdf-lib dropdown has getOptions() method
      const dropdown = field as unknown as { getOptions: () => string[] };
      if (typeof dropdown.getOptions === "function") {
        return dropdown.getOptions();
      }
    }

    if (constructorName === "PDFRadioGroup") {
      // pdf-lib radio group has getOptions() method
      const radioGroup = field as unknown as { getOptions: () => string[] };
      if (typeof radioGroup.getOptions === "function") {
        return radioGroup.getOptions();
      }
    }
  } catch {
    // Ignore errors getting options
  }

  return [];
}

/**
 * Get field position from widgets.
 */
function getFieldPosition(
  field: ReturnType<
    ReturnType<typeof PDFDocument.prototype.getForm>["getField"]
  >,
): FieldPosition | undefined {
  try {
    // Try to access widgets through the acroField
    const acroField = field.acroField;
    const widgets = acroField.getWidgets();

    if (widgets.length > 0) {
      const widget = widgets[0];
      const rect = widget.getRectangle();

      // Get page index (not directly available, would need to traverse pages)
      // For now, assume page 1
      return {
        page: 1,
        x: rect.x,
        y: rect.y,
      };
    }
  } catch {
    // Position not available
  }

  return undefined;
}

/**
 * Check if a field is marked as required.
 */
function isFieldRequired(
  field: ReturnType<
    ReturnType<typeof PDFDocument.prototype.getForm>["getField"]
  >,
): boolean {
  try {
    // pdf-lib doesn't expose isRequired directly, but we can check the flags
    const acroField = field.acroField;
    const flags = acroField.getFlags();
    // Bit 2 (0x02) is the "Required" flag in PDF spec
    return (flags & 0x02) !== 0;
  } catch {
    return false;
  }
}

/**
 * Get default value of a field.
 */
function getFieldDefaultValue(
  field: ReturnType<
    ReturnType<typeof PDFDocument.prototype.getForm>["getField"]
  >,
): string | undefined {
  try {
    const constructorName = field.constructor.name;

    if (constructorName === "PDFTextField") {
      const textField = field as unknown as {
        getText: () => string | undefined;
      };
      if (typeof textField.getText === "function") {
        return textField.getText() || undefined;
      }
    }

    if (constructorName === "PDFCheckBox") {
      const checkbox = field as unknown as { isChecked: () => boolean };
      if (typeof checkbox.isChecked === "function") {
        return checkbox.isChecked() ? "true" : "false";
      }
    }

    if (
      constructorName === "PDFDropdown" ||
      constructorName === "PDFOptionList"
    ) {
      const dropdown = field as unknown as { getSelected: () => string[] };
      if (typeof dropdown.getSelected === "function") {
        const selected = dropdown.getSelected();
        return selected.length > 0 ? selected[0] : undefined;
      }
    }
  } catch {
    // Ignore errors getting default value
  }

  return undefined;
}

/**
 * Get summary statistics about form fields.
 */
export function getFormFieldSummary(fields: FormField[]): {
  total: number;
  byType: Record<FormFieldType, number>;
  requiredCount: number;
  hasSignatureFields: boolean;
} {
  const byType: Record<FormFieldType, number> = {
    text: 0,
    checkbox: 0,
    dropdown: 0,
    radio: 0,
    date: 0,
    signature: 0,
  };

  let requiredCount = 0;
  let hasSignatureFields = false;

  for (const field of fields) {
    byType[field.type]++;
    if (field.required) requiredCount++;
    if (field.type === "signature") hasSignatureFields = true;
  }

  return {
    total: fields.length,
    byType,
    requiredCount,
    hasSignatureFields,
  };
}
