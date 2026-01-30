import twilio from "twilio";
import type { SMSAdapter, SMSPayload, SMSResult } from "./interface";

export class TwilioSMSAdapter implements SMSAdapter {
  private client: twilio.Twilio;
  private defaultFrom: string;

  constructor(accountSid: string, authToken: string, defaultFrom: string) {
    this.client = twilio(accountSid, authToken);
    this.defaultFrom = defaultFrom;
  }

  async send(payload: SMSPayload): Promise<SMSResult> {
    try {
      const message = await this.client.messages.create({
        body: payload.body,
        to: payload.to,
        from: payload.from ?? this.defaultFrom,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendBatch(payloads: SMSPayload[]): Promise<SMSResult[]> {
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

export function createSMSAdapter(): SMSAdapter {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables are required",
    );
  }

  return new TwilioSMSAdapter(accountSid, authToken, phoneNumber);
}
