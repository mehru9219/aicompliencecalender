/**
 * SMS Adapter Interface
 * Defines the contract for SMS service providers
 */

export interface SMSPayload {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

export interface SMSAdapter {
  /**
   * Send a single SMS message
   */
  send(payload: SMSPayload): Promise<SMSResult>;

  /**
   * Send multiple SMS messages in batch
   */
  sendBatch(payloads: SMSPayload[]): Promise<SMSResult[]>;
}

export interface SMSAdapterConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Format SMS message by urgency level
 */
export function formatSMSByUrgency(
  urgency: "early" | "medium" | "high" | "critical",
  title: string,
  daysRemaining: number,
): string {
  switch (urgency) {
    case "critical":
      return `⚠️ OVERDUE: ${title} - Action required`;
    case "high":
      return `🔴 DUE TOMORROW: ${title}`;
    case "medium":
      return `🟡 Due in ${daysRemaining} days: ${title}`;
    case "early":
    default:
      return `📅 Reminder: ${title} due in ${daysRemaining} days`;
  }
}
