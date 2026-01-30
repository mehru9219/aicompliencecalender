/**
 * Resend Email Adapter Implementation
 */

import type {
  EmailAdapter,
  EmailPayload,
  EmailResult,
  EmailAdapterConfig,
} from "./interface";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export class ResendEmailAdapter implements EmailAdapter {
  private config: Required<EmailAdapterConfig>;

  constructor(config: EmailAdapterConfig) {
    this.config = {
      apiKey: config.apiKey,
      fromEmail: config.fromEmail,
      fromName: config.fromName ?? "AI Compliance Calendar",
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      retryAttempts: config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
    };
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    const from =
      payload.from ?? `${this.config.fromName} <${this.config.fromEmail}>`;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            reply_to: payload.replyTo,
            cc: payload.cc,
            bcc: payload.bcc,
            tags: payload.tags?.map((tag) => ({ name: tag, value: "true" })),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            messageId: data.id,
          };
        }

        const errorText = await response.text();

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            error: `Client error: ${response.status} - ${errorText}`,
          };
        }

        // Retry on 5xx errors
        if (attempt < this.config.retryAttempts - 1) {
          await this.sleep(
            RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1],
          );
          continue;
        }

        return {
          success: false,
          error: `Server error after ${this.config.retryAttempts} attempts: ${errorText}`,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          if (attempt < this.config.retryAttempts - 1) {
            await this.sleep(
              RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1],
            );
            continue;
          }
          return {
            success: false,
            error: "Request timeout after retries",
          };
        }

        if (attempt < this.config.retryAttempts - 1) {
          await this.sleep(
            RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1],
          );
          continue;
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return {
      success: false,
      error: "Max retry attempts reached",
    };
  }

  async sendBatch(payloads: EmailPayload[]): Promise<EmailResult[]> {
    // Resend doesn't have a batch endpoint, so send sequentially
    // Could be parallelized with rate limiting
    const results: EmailResult[] = [];
    for (const payload of payloads) {
      const result = await this.send(payload);
      results.push(result);
    }
    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a Resend email adapter from environment variables
 */
export function createResendAdapter(): ResendEmailAdapter {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  return new ResendEmailAdapter({
    apiKey,
    fromEmail:
      process.env.RESEND_FROM_EMAIL ?? "alerts@aicompliancecalendar.com",
    fromName: process.env.RESEND_FROM_NAME ?? "AI Compliance Calendar",
  });
}
