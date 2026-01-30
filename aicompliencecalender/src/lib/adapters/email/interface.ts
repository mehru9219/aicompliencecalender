/**
 * Email Adapter Interface
 * Defines the contract for email service providers
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAdapter {
  /**
   * Send a single email
   */
  send(payload: EmailPayload): Promise<EmailResult>;

  /**
   * Send multiple emails in batch
   */
  sendBatch(payloads: EmailPayload[]): Promise<EmailResult[]>;
}

export interface EmailAdapterConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  timeout?: number;
  retryAttempts?: number;
}
