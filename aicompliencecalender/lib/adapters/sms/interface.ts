/**
 * SMS adapter interface for sending text messages.
 * Implementations: TwilioSMSAdapter
 */
export interface SMSPayload {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSAdapter {
  send(payload: SMSPayload): Promise<SMSResult>;
  sendBatch(payloads: SMSPayload[]): Promise<SMSResult[]>;
}
