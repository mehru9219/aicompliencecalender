/**
 * Email adapter interface for sending emails.
 * Implementations: ResendEmailAdapter
 */
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAdapter {
  send(payload: EmailPayload): Promise<EmailResult>;
  sendBatch(payloads: EmailPayload[]): Promise<EmailResult[]>;
}
