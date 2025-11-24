/**
 * Anthropic API Client for IDEA-015
 * Wrapper around @anthropic-ai/sdk with project-specific configuration
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model configuration
export const EXTRACTION_MODEL = 'claude-sonnet-4-5-20250929'; // Latest Sonnet 4.5
export const MAX_TOKENS = 8000;
export const TEMPERATURE = 0.1; // Low temperature for consistent extraction

/**
 * Create a message with Anthropic API (text only)
 */
export async function createMessage(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
) {
  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: options?.maxTokens || MAX_TOKENS,
    temperature: options?.temperature || TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  return response;
}

/**
 * Create a message with multimodal content (text + images)
 */
export async function createMessageWithContent(
  systemPrompt: string,
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'; data: string } }
  >,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
) {
  const response = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: options?.maxTokens || MAX_TOKENS,
    temperature: options?.temperature || TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  return response;
}

/**
 * Stream a message with Anthropic API
 * Returns an async generator that yields text chunks
 */
export async function* streamMessage(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const stream = await anthropic.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: options?.maxTokens || MAX_TOKENS,
    temperature: options?.temperature || TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

/**
 * Estimate token count (rough approximation)
 * Claude uses ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if API key is configured
 */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Token usage information from Anthropic API response
 */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

/**
 * Extract token usage from Anthropic API response
 */
export function extractTokenUsage(response: Anthropic.Message): TokenUsage {
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Pricing for Claude Sonnet 4.5 (update if model changes)
  const inputCostPerMillion = 3.00;
  const outputCostPerMillion = 15.00;

  const cost =
    (inputTokens / 1_000_000) * inputCostPerMillion +
    (outputTokens / 1_000_000) * outputCostPerMillion;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    cost_usd: cost,
  };
}

/**
 * Calculate cost for given token counts
 */
export function calculateCost(inputTokens: number, outputTokens: number, model?: string): number {
  // Pricing varies by model (as of 2025-11-24)
  const pricing = {
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
    'claude-sonnet-3-5-20240620': { input: 3.00, output: 15.00 },
    'claude-haiku-3-5-20241022': { input: 0.80, output: 4.00 },
  } as const;

  type ModelKey = keyof typeof pricing;
  const modelKey = (model || EXTRACTION_MODEL) as ModelKey;
  const modelPricing = pricing[modelKey] || pricing['claude-sonnet-4-5-20250929'];

  return (
    (inputTokens / 1_000_000) * modelPricing.input +
    (outputTokens / 1_000_000) * modelPricing.output
  );
}

/**
 * Format cost for display
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}
