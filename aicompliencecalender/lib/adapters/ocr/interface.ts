/**
 * OCR adapter interface for extracting text from documents and images.
 * Implementations: ClaudeOCRAdapter
 */

export interface OCRResult {
  success: boolean;
  text: string;
  error?: string;
}

export interface OCRAdapter {
  /**
   * Extract text from a file URL.
   * @param fileUrl - The URL of the file to process
   * @param fileType - The file type (pdf, jpg, jpeg, png)
   * @returns Extracted text or empty string on failure
   */
  extractText(fileUrl: string, fileType: string): Promise<OCRResult>;
}

export interface OCRAdapterOptions {
  /** Maximum time to wait for OCR processing (ms) */
  timeout?: number;
  /** Maximum characters to return */
  maxChars?: number;
}

export const DEFAULT_OCR_OPTIONS: Required<OCRAdapterOptions> = {
  timeout: 60000, // 60 seconds
  maxChars: 100000,
};
