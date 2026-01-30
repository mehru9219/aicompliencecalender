import { Resend } from "resend";
import type { EmailAdapter, EmailPayload, EmailResult } from "./interface";

const DEFAULT_FROM = "AI Compliance Calendar <alerts@aicompliancecalendar.com>";

export class ResendEmailAdapter implements EmailAdapter {
  private client: Resend;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string = DEFAULT_FROM) {
    this.client = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    try {
      const result = await this.client.emails.send({
        from: payload.from ?? this.defaultFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
        tags: payload.tags,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendBatch(payloads: EmailPayload[]): Promise<EmailResult[]> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.send(payload)),
    );

    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        success: false,
        error: result.reason?.message ?? "Batch send failed",
      };
    });
  }
}

export function createEmailAdapter(): EmailAdapter {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new ResendEmailAdapter(apiKey);
}
