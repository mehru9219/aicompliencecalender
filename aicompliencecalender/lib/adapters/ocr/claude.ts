import Anthropic from "@anthropic-ai/sdk";
import type { OCRAdapter, OCRResult, OCRAdapterOptions } from "./interface";
import { DEFAULT_OCR_OPTIONS } from "./interface";

/**
 * OCR adapter using Claude Vision API for text extraction.
 * Supports images (jpg, jpeg, png) and can process scanned PDFs.
 */
export class ClaudeOCRAdapter implements OCRAdapter {
  private client: Anthropic;
  private options: Required<OCRAdapterOptions>;

  constructor(apiKey?: string, options?: OCRAdapterOptions) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    this.options = { ...DEFAULT_OCR_OPTIONS, ...options };
  }

  async extractText(fileUrl: string, fileType: string): Promise<OCRResult> {
    try {
      // Validate file type
      const supportedTypes = ["jpg", "jpeg", "png", "gif", "webp"];
      const normalizedType = fileType.toLowerCase();

      if (!supportedTypes.includes(normalizedType)) {
        return {
          success: false,
          text: "",
          error: `Unsupported file type for OCR: ${fileType}. Supported: ${supportedTypes.join(", ")}`,
        };
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`OCR timeout after ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      // Create OCR request promise (Claude auto-detects media type from URL)
      const ocrPromise = this.performOCR(fileUrl);

      // Race between OCR and timeout
      const text = await Promise.race([ocrPromise, timeoutPromise]);

      // Truncate if needed
      const truncatedText = text.slice(0, this.options.maxChars);

      return {
        success: true,
        text: truncatedText,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown OCR error";
      console.error("Claude OCR error:", errorMessage);

      return {
        success: false,
        text: "",
        error: errorMessage,
      };
    }
  }

  private async performOCR(fileUrl: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: fileUrl,
              },
            },
            {
              type: "text",
              text: "Extract all text from this document image. Return only the extracted text content, preserving the original structure and formatting as much as possible. If the image contains no text, return an empty string.",
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.type === "text" ? textContent.text : "";
  }
}

/**
 * Create a Claude OCR adapter with default configuration.
 */
export function createClaudeOCRAdapter(
  options?: OCRAdapterOptions,
): OCRAdapter {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new ClaudeOCRAdapter(apiKey, options);
}
