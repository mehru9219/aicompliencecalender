import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ResendEmailAdapter,
  createResendAdapter,
} from "@/src/lib/adapters/email/resend";

describe("ResendEmailAdapter", () => {
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
    new ResendEmailAdapter({
      apiKey: "test-api-key",
      fromEmail: "test@example.com",
      fromName: "Test Sender",
    });

  describe("send", () => {
    it("should send email successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-123" }),
      });

      const adapter = createAdapter();
      const result = await adapter.send({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test body</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("email-123");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should include all email fields in request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-123" }),
      });

      const adapter = createAdapter();
      await adapter.send({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>HTML content</p>",
        text: "Plain text content",
        replyTo: "reply@example.com",
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
        tags: ["alert", "deadline"],
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>HTML content</p>",
        text: "Plain text content",
        reply_to: "reply@example.com",
        cc: ["cc@example.com"],
        bcc: ["bcc@example.com"],
        tags: [
          { name: "alert", value: "true" },
          { name: "deadline", value: "true" },
        ],
      });
    });

    it("should return error on 4xx client error without retry", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request: Invalid email",
      });

      const adapter = createAdapter();
      const result = await adapter.send({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Client error: 400");
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry on 4xx
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
          json: async () => ({ id: "email-456" }),
        });

      const adapter = new ResendEmailAdapter({
        apiKey: "test-api-key",
        fromEmail: "test@example.com",
        retryAttempts: 3,
      });

      const result = await adapter.send({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("email-456");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should return error after max retries", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server Error",
      });

      const adapter = new ResendEmailAdapter({
        apiKey: "test-api-key",
        fromEmail: "test@example.com",
        retryAttempts: 2,
      });

      const result = await adapter.send({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
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

      const adapter = new ResendEmailAdapter({
        apiKey: "test-api-key",
        fromEmail: "test@example.com",
        timeout: 100,
        retryAttempts: 1,
      });

      const result = await adapter.send({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request timeout after retries");
    });

    it("should use custom from address when provided in payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "email-123" }),
      });

      const adapter = createAdapter();
      await adapter.send({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
        from: "custom@example.com",
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.from).toBe("custom@example.com");
    });
  });

  describe("sendBatch", () => {
    it("should send multiple emails sequentially", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "email-1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "email-2" }),
        });

      const adapter = createAdapter();
      const results = await adapter.sendBatch([
        { to: "one@example.com", subject: "Test 1", html: "<p>1</p>" },
        { to: "two@example.com", subject: "Test 2", html: "<p>2</p>" },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].messageId).toBe("email-1");
      expect(results[1].success).toBe(true);
      expect(results[1].messageId).toBe("email-2");
    });

    it("should continue sending after failure", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: async () => "Invalid email",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "email-2" }),
        });

      const adapter = createAdapter();
      const results = await adapter.sendBatch([
        { to: "invalid", subject: "Test 1", html: "<p>1</p>" },
        { to: "valid@example.com", subject: "Test 2", html: "<p>2</p>" },
      ]);

      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe("createResendAdapter", () => {
    it("should throw if RESEND_API_KEY is not set", () => {
      const originalEnv = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      expect(() => createResendAdapter()).toThrow(
        "RESEND_API_KEY environment variable is required",
      );

      process.env.RESEND_API_KEY = originalEnv;
    });

    it("should create adapter with env vars", () => {
      const originalKey = process.env.RESEND_API_KEY;
      const originalEmail = process.env.RESEND_FROM_EMAIL;
      const originalName = process.env.RESEND_FROM_NAME;

      process.env.RESEND_API_KEY = "env-api-key";
      process.env.RESEND_FROM_EMAIL = "env@example.com";
      process.env.RESEND_FROM_NAME = "Env Sender";

      const adapter = createResendAdapter();
      expect(adapter).toBeInstanceOf(ResendEmailAdapter);

      process.env.RESEND_API_KEY = originalKey;
      process.env.RESEND_FROM_EMAIL = originalEmail;
      process.env.RESEND_FROM_NAME = originalName;
    });
  });
});
