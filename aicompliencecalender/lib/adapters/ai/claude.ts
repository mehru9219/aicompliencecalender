import Anthropic from "@anthropic-ai/sdk";
import {
  AIAdapter,
  AIAnalysisResult,
  AIAdapterOptions,
  DEFAULT_AI_OPTIONS,
  RateLimitConfig,
  DEFAULT_RATE_LIMIT,
  checkRateLimit,
  recordCall,
} from "./interface";

export class ClaudeAIAdapter implements AIAdapter {
  private client: Anthropic;
  private options: Required<AIAdapterOptions>;
  private rateLimit: RateLimitConfig;
  private orgId?: string;

  constructor(
    options: AIAdapterOptions = {},
    rateLimit: RateLimitConfig = DEFAULT_RATE_LIMIT,
    orgId?: string,
  ) {
    this.client = new Anthropic();
    this.options = { ...DEFAULT_AI_OPTIONS, ...options };
    this.rateLimit = rateLimit;
    this.orgId = orgId;
  }

  /**
   * Check rate limit before making a call.
   * Throws if limit exceeded.
   */
  private checkLimit(): void {
    if (this.orgId && !checkRateLimit(this.orgId, this.rateLimit)) {
      throw new Error(
        `Rate limit exceeded: Maximum ${this.rateLimit.maxCallsPerMinute} calls per minute per organization.`,
      );
    }
  }

  /**
   * Record a successful call for rate limiting.
   */
  private recordUsage(): void {
    if (this.orgId) {
      recordCall(this.orgId, this.rateLimit);
    }
  }

  /**
   * Analyze content with Claude.
   */
  async analyze(prompt: string, context?: string): Promise<AIAnalysisResult> {
    // Check rate limit
    this.checkLimit();

    // Build the message content
    const content = context ? `${prompt}\n\nContext:\n${context}` : prompt;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`AI analysis timed out after ${this.options.timeout}ms`),
        );
      }, this.options.timeout);
    });

    try {
      // Race between analysis and timeout
      const response = await Promise.race([
        this.performAnalysis(content),
        timeoutPromise,
      ]);

      // Record the call for rate limiting
      this.recordUsage();

      // Log cost tracking (for monitoring)
      if (response.usage) {
        console.log(
          `[AI Cost] Org: ${this.orgId || "unknown"}, ` +
            `Input: ${response.usage.inputTokens}, ` +
            `Output: ${response.usage.outputTokens}, ` +
            `Total: ${response.usage.totalTokens}`,
        );
      }

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        response: "",
        error: errorMessage,
      };
    }
  }

  /**
   * Analyze content and parse JSON response.
   */
  async analyzeJSON<T>(
    prompt: string,
    context?: string,
  ): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    usage?: AIAnalysisResult["usage"];
  }> {
    // Add instruction to return JSON
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanations, just the JSON object/array.`;

    const result = await this.analyze(jsonPrompt, context);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        usage: result.usage,
      };
    }

    try {
      // Try to parse the response as JSON
      // Sometimes Claude wraps JSON in markdown code blocks, so we strip those
      let jsonStr = result.response.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const data = JSON.parse(jsonStr) as T;
      return {
        success: true,
        data,
        usage: result.usage,
      };
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Raw response: ${result.response.slice(0, 200)}...`,
        usage: result.usage,
      };
    }
  }

  /**
   * Perform the actual Claude API call.
   */
  private async performAnalysis(content: string): Promise<AIAnalysisResult> {
    const response = await this.client.messages.create({
      model: this.options.model,
      max_tokens: this.options.maxTokens,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    return {
      success: true,
      response: responseText,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}

/**
 * Create a Claude AI adapter with default configuration.
 */
export function createClaudeAdapter(
  orgId?: string,
  options?: AIAdapterOptions,
): ClaudeAIAdapter {
  return new ClaudeAIAdapter(options, DEFAULT_RATE_LIMIT, orgId);
}
