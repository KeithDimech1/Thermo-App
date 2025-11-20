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
 * Create a message with Anthropic API
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
