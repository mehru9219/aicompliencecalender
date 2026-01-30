import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TwilioSMSAdapter,
  createTwilioAdapter,
} from "@/src/lib/adapters/sms/twilio";
import { formatSMSByUrgency } from "@/src/lib/adapters/sms/interface";

describe("TwilioSMSAdapter", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const createAdapter = () =>
    new TwilioSMSAdapter({
      accountSid: "AC123456789",
      authToken: "test-auth-token",
      fromNumber: "+15551234567",
    });

  describe("send", () => {
    it("should send SMS successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: "SM123", status: "queued" }),
      });

      const adapter = createAdapter();
      const result = await adapter.send({
        to: "+15559876543",
        body: "Test message",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM123");
      expect(result.status).toBe("queued");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC123456789/Messages.json",
      );
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toMatch(/^Basic /);
      expect(options.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded",
      );

      const params = new URLSearchParams(options.body);
      expect(params.get("To")).toBe("+15559876543");
      expect(params.get("From")).toBe("+15551234567");
      expect(params.get("Body")).toBe("Test message");
    });

    it("should use custom from number when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: "SM123", status: "queued" }),
      });

      const adapter = createAdapter();
      await adapter.send({
        to: "+15559876543",
        body: "Test message",
        from: "+15550000000",
      });

      const params = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(params.get("From")).toBe("+15550000000");
    });

    it("should include media URLs when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: "SM123", status: "queued" }),
      });

      const adapter = createAdapter();
      await adapter.send({
        to: "+15559876543",
        body: "Test with media",
        mediaUrl: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      });

      const params = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      const mediaUrls = params.getAll("MediaUrl");
      expect(mediaUrls).toHaveLength(2);
      expect(mediaUrls).toContain("https://example.com/image1.jpg");
      expect(mediaUrls).toContain("https://example.com/image2.jpg");
    });

    it("should return error on 4xx client error without retry", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid phone number",
      });

      const adapter = createAdapter();
      const result = await adapter.send({
        to: "invalid",
        body: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Client error: 400");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on 5xx server error", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sid: "SM456", status: "queued" }),
        });

      const adapter = new TwilioSMSAdapter({
        accountSid: "AC123",
        authToken: "token",
        fromNumber: "+15551234567",
        retryAttempts: 3,
      });

      const result = await adapter.send({
        to: "+15559876543",
        body: "Test",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM456");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should return error after max retries", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server Error",
      });

      const adapter = new TwilioSMSAdapter({
        accountSid: "AC123",
        authToken: "token",
        fromNumber: "+15551234567",
        retryAttempts: 2,
      });

      const result = await adapter.send({
        to: "+15559876543",
        body: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Server error after 2 attempts");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle timeout via AbortController", async () => {
      mockFetch.mockImplementation(() => {
        const error = new Error("Aborted");
        error.name = "AbortError";
        return Promise.reject(error);
      });

      const adapter = new TwilioSMSAdapter({
        accountSid: "AC123",
        authToken: "token",
        fromNumber: "+15551234567",
        timeout: 100,
        retryAttempts: 1,
      });

      const result = await adapter.send({
        to: "+15559876543",
        body: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request timeout after retries");
    });

    it("should use Basic auth with base64 encoded credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sid: "SM123", status: "queued" }),
      });

      const adapter = new TwilioSMSAdapter({
        accountSid: "ACtest123",
        authToken: "secrettoken",
        fromNumber: "+15551234567",
      });

      await adapter.send({ to: "+15559876543", body: "Test" });

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      const expectedBase64 = Buffer.from("ACtest123:secrettoken").toString(
        "base64",
      );
      expect(authHeader).toBe(`Basic ${expectedBase64}`);
    });
  });

  describe("sendBatch", () => {
    it("should send multiple SMS sequentially", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sid: "SM1", status: "queued" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sid: "SM2", status: "queued" }),
        });

      const adapter = createAdapter();
      const results = await adapter.sendBatch([
        { to: "+15551111111", body: "Message 1" },
        { to: "+15552222222", body: "Message 2" },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe("SM1");
      expect(results[1].success).toBe(true);
      expect(results[1].messageId).toBe("SM2");
    });

    it("should continue sending after failure", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => "Invalid number",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sid: "SM2", status: "queued" }),
        });

      const adapter = createAdapter();
      const results = await adapter.sendBatch([
        { to: "invalid", body: "Message 1" },
        { to: "+15552222222", body: "Message 2" },
      ]);

      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe("createTwilioAdapter", () => {
    it("should throw if required env vars are not set", () => {
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;
      const originalPhone = process.env.TWILIO_PHONE_NUMBER;

      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_PHONE_NUMBER;

      expect(() => createTwilioAdapter()).toThrow(
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables are required",
      );

      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
      process.env.TWILIO_PHONE_NUMBER = originalPhone;
    });

    it("should create adapter with env vars", () => {
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;
      const originalPhone = process.env.TWILIO_PHONE_NUMBER;

      process.env.TWILIO_ACCOUNT_SID = "ACenv123";
      process.env.TWILIO_AUTH_TOKEN = "envtoken";
      process.env.TWILIO_PHONE_NUMBER = "+15550000000";

      const adapter = createTwilioAdapter();
      expect(adapter).toBeInstanceOf(TwilioSMSAdapter);

      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
      process.env.TWILIO_PHONE_NUMBER = originalPhone;
    });
  });
});

describe("formatSMSByUrgency", () => {
  it("should format critical/overdue message", () => {
    const result = formatSMSByUrgency("critical", "Q4 Tax Filing", -2);
    expect(result).toBe("⚠️ OVERDUE: Q4 Tax Filing - Action required");
  });

  it("should format high urgency (due tomorrow) message", () => {
    const result = formatSMSByUrgency("high", "License Renewal", 1);
    expect(result).toBe("🔴 DUE TOMORROW: License Renewal");
  });

  it("should format medium urgency message with days", () => {
    const result = formatSMSByUrgency("medium", "Annual Report", 5);
    expect(result).toBe("🟡 Due in 5 days: Annual Report");
  });

  it("should format early urgency reminder", () => {
    const result = formatSMSByUrgency("early", "Insurance Renewal", 30);
    expect(result).toBe("📅 Reminder: Insurance Renewal due in 30 days");
  });
});
