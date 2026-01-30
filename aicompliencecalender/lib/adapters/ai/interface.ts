/**
 * AI adapter interface for analyzing content and making predictions.
 * Implementations: ClaudeAIAdapter
 */

export interface AIAnalysisResult {
  success: boolean;
  response: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface AIAdapter {
  /**
   * Analyze content with the AI model.
   * @param prompt - The prompt to send to the AI
   * @param context - Additional context or data to analyze
   * @returns The AI response or error
   */
  analyze(prompt: string, context?: string): Promise<AIAnalysisResult>;

  /**
   * Analyze content and expect a JSON response.
   * @param prompt - The prompt to send to the AI
   * @param context - Additional context or data to analyze
   * @returns Parsed JSON response or error
   */
  analyzeJSON<T>(
    prompt: string,
    context?: string,
  ): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    usage?: AIAnalysisResult["usage"];
  }>;
}

export interface AIAdapterOptions {
  /** Maximum time to wait for AI response (ms) */
  timeout?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Model to use */
  model?: string;
}

export const DEFAULT_AI_OPTIONS: Required<AIAdapterOptions> = {
  timeout: 60000, // 60 seconds
  maxTokens: 4096,
  model: "claude-sonnet-4-20250514",
};

/** Rate limit configuration */
export interface RateLimitConfig {
  /** Maximum calls per minute per org */
  maxCallsPerMinute: number;
  /** Track calls per org */
  callHistory: Map<string, number[]>;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxCallsPerMinute: 10,
  callHistory: new Map(),
};

/**
 * Check if a rate limit would be exceeded.
 * @param orgId - The organization ID
 * @param config - Rate limit configuration
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  orgId: string,
  config: RateLimitConfig,
): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Get call history for this org
  const history = config.callHistory.get(orgId) ?? [];

  // Filter to calls within the last minute
  const recentCalls = history.filter((timestamp) => timestamp > oneMinuteAgo);

  // Update the call history
  config.callHistory.set(orgId, recentCalls);

  // Check if limit exceeded
  return recentCalls.length < config.maxCallsPerMinute;
}

/**
 * Record a call for rate limiting.
 * @param orgId - The organization ID
 * @param config - Rate limit configuration
 */
export function recordCall(orgId: string, config: RateLimitConfig): void {
  const history = config.callHistory.get(orgId) ?? [];
  history.push(Date.now());
  config.callHistory.set(orgId, history);
}
