/**
 * Twilio SMS Adapter Implementation
 */

import type {
  SMSAdapter,
  SMSPayload,
  SMSResult,
  SMSAdapterConfig,
} from "./interface";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export class TwilioSMSAdapter implements SMSAdapter {
  private config: Required<SMSAdapterConfig>;

  constructor(config: SMSAdapterConfig) {
    this.config = {
      accountSid: config.accountSid,
      authToken: config.authToken,
      fromNumber: config.fromNumber,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      retryAttempts: config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
    };
  }

  async send(payload: SMSPayload): Promise<SMSResult> {
    const from = payload.from ?? this.config.fromNumber;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout,
        );

        const auth = Buffer.from(
          `${this.config.accountSid}:${this.config.authToken}`,
        ).toString("base64");

        const params = new URLSearchParams({
          To: payload.to,
          From: from,
          Body: payload.body,
        });

        if (payload.mediaUrl?.length) {
          for (const url of payload.mediaUrl) {
            params.append("MediaUrl", url);
          }
        }

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            messageId: data.sid,
            status: data.status,
          };
        }

        const errorText = await response.text();

        // Don't retry on 4xx errors
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

  async sendBatch(payloads: SMSPayload[]): Promise<SMSResult[]> {
    // Twilio doesn't have a batch endpoint, send sequentially
    const results: SMSResult[] = [];
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
 * Create a Twilio SMS adapter from environment variables
 */
export function createTwilioAdapter(): TwilioSMSAdapter {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables are required",
    );
  }

  return new TwilioSMSAdapter({
    accountSid,
    authToken,
    fromNumber,
  });
}
