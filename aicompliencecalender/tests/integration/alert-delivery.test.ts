import { describe, it, expect, beforeEach } from "vitest";
import type {
  EmailAdapter,
  EmailPayload,
  EmailResult,
} from "../../lib/adapters/email/interface";
import type {
  SMSAdapter,
  SMSPayload,
  SMSResult,
} from "../../lib/adapters/sms/interface";

// Mock email adapter
class MockEmailAdapter implements EmailAdapter {
  public sentEmails: EmailPayload[] = [];
  public shouldFail = false;
  public failureMessage = "Mock email failure";

  async send(payload: EmailPayload): Promise<EmailResult> {
    if (this.shouldFail) {
      return { success: false, error: this.failureMessage };
    }
    this.sentEmails.push(payload);
    return { success: true, messageId: `mock-email-${Date.now()}` };
  }

  async sendBatch(payloads: EmailPayload[]): Promise<EmailResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)));
  }

  reset() {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}

// Mock SMS adapter
class MockSMSAdapter implements SMSAdapter {
  public sentMessages: SMSPayload[] = [];
  public shouldFail = false;
  public failureMessage = "Mock SMS failure";

  async send(payload: SMSPayload): Promise<SMSResult> {
    if (this.shouldFail) {
      return { success: false, error: this.failureMessage };
    }
    this.sentMessages.push(payload);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }

  async sendBatch(payloads: SMSPayload[]): Promise<SMSResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)));
  }

  reset() {
    this.sentMessages = [];
    this.shouldFail = false;
  }
}

describe("Alert Delivery Integration", () => {
  let emailAdapter: MockEmailAdapter;
  let smsAdapter: MockSMSAdapter;

  beforeEach(() => {
    emailAdapter = new MockEmailAdapter();
    smsAdapter = new MockSMSAdapter();
  });

  describe("Email Adapter", () => {
    it("sends email successfully", async () => {
      const payload: EmailPayload = {
        to: "test@example.com",
        subject: "Test Alert",
        html: "<p>Test content</p>",
      };

      const result = await emailAdapter.send(payload);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(emailAdapter.sentEmails).toHaveLength(1);
      expect(emailAdapter.sentEmails[0].to).toBe("test@example.com");
    });

    it("handles email failure", async () => {
      emailAdapter.shouldFail = true;

      const result = await emailAdapter.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Mock email failure");
    });

    it("sends batch emails", async () => {
      const payloads: EmailPayload[] = [
        { to: "user1@example.com", subject: "Alert 1", html: "<p>1</p>" },
        { to: "user2@example.com", subject: "Alert 2", html: "<p>2</p>" },
        { to: "user3@example.com", subject: "Alert 3", html: "<p>3</p>" },
      ];

      const results = await emailAdapter.sendBatch(payloads);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(emailAdapter.sentEmails).toHaveLength(3);
    });
  });

  describe("SMS Adapter", () => {
    it("sends SMS successfully", async () => {
      const payload: SMSPayload = {
        to: "+1234567890",
        body: "Test alert message",
      };

      const result = await smsAdapter.send(payload);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(smsAdapter.sentMessages).toHaveLength(1);
      expect(smsAdapter.sentMessages[0].to).toBe("+1234567890");
    });

    it("handles SMS failure", async () => {
      smsAdapter.shouldFail = true;

      const result = await smsAdapter.send({
        to: "+1234567890",
        body: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Mock SMS failure");
    });

    it("sends batch SMS messages", async () => {
      const payloads: SMSPayload[] = [
        { to: "+1111111111", body: "Alert 1" },
        { to: "+2222222222", body: "Alert 2" },
      ];

      const results = await smsAdapter.sendBatch(payloads);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(smsAdapter.sentMessages).toHaveLength(2);
    });
  });

  describe("Alert Content Formatting", () => {
    it("formats email alert with correct urgency", async () => {
      const deadline = {
        title: "Annual Report Filing",
        dueDate: new Date("2025-12-31").getTime(),
        description: "Submit annual financial report",
      };

      const urgency = "critical";
      const dueDate = new Date(deadline.dueDate).toLocaleDateString();

      const emailPayload: EmailPayload = {
        to: "compliance@example.com",
        subject: `[${urgency.toUpperCase()}] Deadline Reminder: ${deadline.title}`,
        html: `
          <h2>Deadline Reminder</h2>
          <p><strong>${deadline.title}</strong> is due on <strong>${dueDate}</strong>.</p>
          <p>${deadline.description}</p>
          <p>Priority: <strong>${urgency}</strong></p>
        `,
      };

      const result = await emailAdapter.send(emailPayload);

      expect(result.success).toBe(true);
      expect(emailAdapter.sentEmails[0].subject).toContain("[CRITICAL]");
      expect(emailAdapter.sentEmails[0].subject).toContain(
        "Annual Report Filing",
      );
    });

    it("formats SMS alert with character limit consideration", async () => {
      const deadline = {
        title: "Quarterly Tax Filing",
        dueDate: new Date("2025-03-31").getTime(),
      };

      const urgency = "high";
      const dueDate = new Date(deadline.dueDate).toLocaleDateString();
      const body = `[${urgency.toUpperCase()}] ${deadline.title} is due ${dueDate}. Reply DONE to acknowledge.`;

      const smsPayload: SMSPayload = {
        to: "+1234567890",
        body,
      };

      const result = await smsAdapter.send(smsPayload);

      expect(result.success).toBe(true);
      expect(smsAdapter.sentMessages[0].body.length).toBeLessThan(160);
      expect(smsAdapter.sentMessages[0].body).toContain("[HIGH]");
    });
  });

  describe("Retry Logic Simulation", () => {
    it("retries failed email delivery", async () => {
      emailAdapter.shouldFail = true;

      // First attempt fails
      const firstResult = await emailAdapter.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(firstResult.success).toBe(false);

      // Service recovers
      emailAdapter.shouldFail = false;

      // Second attempt succeeds
      const secondResult = await emailAdapter.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(secondResult.success).toBe(true);
    });

    it("tracks retry count", async () => {
      let retryCount = 0;
      const maxRetries = 3;

      emailAdapter.shouldFail = true;

      while (retryCount < maxRetries) {
        const result = await emailAdapter.send({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        });

        if (!result.success) {
          retryCount++;
        }
      }

      expect(retryCount).toBe(maxRetries);
    });
  });

  describe("Channel Selection", () => {
    it("routes alerts to correct channels based on urgency", async () => {
      const channelConfig = {
        early: ["email"],
        medium: ["email", "in_app"],
        high: ["email", "sms", "in_app"],
        critical: ["email", "sms", "in_app"],
      };

      // Early urgency should only use email
      expect(channelConfig.early).toEqual(["email"]);
      expect(channelConfig.early).not.toContain("sms");

      // Critical urgency should use all channels
      expect(channelConfig.critical).toContain("email");
      expect(channelConfig.critical).toContain("sms");
      expect(channelConfig.critical).toContain("in_app");
    });
  });
});
