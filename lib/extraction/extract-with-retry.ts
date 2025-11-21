/**
 * Retry Wrapper for Table Extraction
 *
 * Implements intelligent retry logic with exponential backoff and error analysis.
 * Provides up to 3 attempts per table with different prompts/strategies per attempt.
 *
 * PHASE 2: RETRY LOGIC
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface RetryAttempt {
  attemptNumber: number;
  error: Error | null;
  success: boolean;
  durationMs: number;
  timestamp: Date;
  extractionMethod?: string;
  qualityScore?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data: T | null;
  attempts: RetryAttempt[];
  totalAttempts: number;
  totalDurationMs: number;
  finalError: Error | null;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,  // 1 second
  maxDelayMs: 5000,      // 5 seconds max
  backoffMultiplier: 2,  // Exponential: 1s, 2s, 4s
};

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: (attemptNumber: number) => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onAttemptFailed?: (error: Error, attemptNumber: number) => void
): Promise<RetryResult<T>> {
  const attempts: RetryAttempt[] = [];
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const attemptStart = Date.now();

    try {
      console.log(`[Retry] Attempt ${attempt}/${config.maxRetries}...`);

      const result = await operation(attempt);
      const durationMs = Date.now() - attemptStart;

      attempts.push({
        attemptNumber: attempt,
        error: null,
        success: true,
        durationMs,
        timestamp: new Date(),
      });

      console.log(`[Retry] ✓ Success on attempt ${attempt} (${durationMs}ms)`);

      return {
        success: true,
        data: result,
        attempts,
        totalAttempts: attempt,
        totalDurationMs: Date.now() - startTime,
        finalError: null,
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;
      const durationMs = Date.now() - attemptStart;

      attempts.push({
        attemptNumber: attempt,
        error: err,
        success: false,
        durationMs,
        timestamp: new Date(),
      });

      console.error(`[Retry] ✗ Attempt ${attempt} failed: ${err.message}`);

      if (onAttemptFailed) {
        onAttemptFailed(err, attempt);
      }

      // Don't delay after last attempt
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        console.log(`[Retry] Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  console.error(`[Retry] All ${config.maxRetries} attempts failed`);

  return {
    success: false,
    data: null,
    attempts,
    totalAttempts: config.maxRetries,
    totalDurationMs: Date.now() - startTime,
    finalError: lastError,
  };
}

/**
 * Analyze validation error to determine retry strategy
 */
export interface ErrorAnalysis {
  errorType: 'column_count' | 'empty_columns' | 'completeness' | 'parsing' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFixes: string[];
  retryable: boolean;
  promptAdjustments?: {
    emphasize?: string[];
    avoid?: string[];
    additionalInstructions?: string;
  };
}

export function analyzeExtractionError(error: Error): ErrorAnalysis {
  const message = error.message.toLowerCase();

  // Column count validation failure
  if (message.includes('column count validation failed')) {
    const expectedMatch = message.match(/expected:?\s*(\d+)/);
    const foundMatch = message.match(/found:?\s*(\d+)/);
    const expected = expectedMatch && expectedMatch[1] ? parseInt(expectedMatch[1]) : null;
    const found = foundMatch && foundMatch[1] ? parseInt(foundMatch[1]) : null;

    return {
      errorType: 'column_count',
      severity: found && expected && (found < expected * 0.5) ? 'critical' : 'high',
      suggestedFixes: [
        'Adjust column delimiter detection',
        'Check for merged header cells',
        'Verify table boundaries',
        'Try alternative extraction method',
      ],
      retryable: true,
      promptAdjustments: {
        emphasize: ['column headers', 'column boundaries', 'table structure'],
        additionalInstructions: expected
          ? `This table should have ${expected} columns. Pay careful attention to column boundaries and merged cells.`
          : undefined,
      },
    };
  }

  // Empty column validation failure
  if (message.includes('empty column validation failed')) {
    return {
      errorType: 'empty_columns',
      severity: 'high',
      suggestedFixes: [
        'Re-examine column alignment',
        'Check for footer rows being parsed as data',
        'Verify data starts at correct row',
        'Look for merged cells causing misalignment',
      ],
      retryable: true,
      promptAdjustments: {
        emphasize: ['data rows', 'skip header rows', 'skip footer rows'],
        avoid: ['footnotes', 'table captions', 'metadata rows'],
        additionalInstructions:
          'Focus only on data rows. Skip any header rows, footer rows, and footnotes.',
      },
    };
  }

  // Completeness validation failure
  if (message.includes('data completeness validation failed')) {
    return {
      errorType: 'completeness',
      severity: 'critical',
      suggestedFixes: [
        'Verify table detection (wrong table may have been extracted)',
        'Check if multi-page table (may need page range)',
        'Try different extraction method (image-based)',
        'Manual review recommended',
      ],
      retryable: true,
      promptAdjustments: {
        emphasize: ['complete table', 'all rows', 'all data'],
        additionalInstructions:
          'Extract the COMPLETE table. Do not skip any rows. Include all data present in the table.',
      },
    };
  }

  // CSV parsing failure
  if (message.includes('failed to parse') || message.includes('csv parse error')) {
    return {
      errorType: 'parsing',
      severity: 'high',
      suggestedFixes: [
        'Check for unquoted commas in data',
        'Verify delimiter is comma',
        'Look for malformed rows',
        'Check for special characters',
      ],
      retryable: true,
      promptAdjustments: {
        emphasize: ['valid CSV format', 'quote text with commas', 'consistent delimiters'],
        additionalInstructions:
          'Output valid CSV. Quote all text values that contain commas. Use consistent comma delimiters.',
      },
    };
  }

  // Unknown error
  return {
    errorType: 'unknown',
    severity: 'medium',
    suggestedFixes: ['Review error details', 'Try alternative extraction method', 'Manual review'],
    retryable: false,
  };
}

/**
 * Generate adjusted prompt for retry attempt based on error analysis
 */
export function generateRetryPrompt(
  originalPrompt: string,
  error: Error,
  attemptNumber: number
): string {
  const analysis = analyzeExtractionError(error);

  if (!analysis.promptAdjustments) {
    return originalPrompt;
  }

  let adjustedPrompt = originalPrompt;

  // Add retry context
  adjustedPrompt += `\n\n## RETRY ATTEMPT ${attemptNumber}\n`;
  adjustedPrompt += `Previous attempt failed with: ${error.message}\n\n`;

  // Add emphasis points
  if (analysis.promptAdjustments.emphasize) {
    adjustedPrompt += `**IMPORTANT - Pay special attention to:**\n`;
    analysis.promptAdjustments.emphasize.forEach(point => {
      adjustedPrompt += `- ${point}\n`;
    });
    adjustedPrompt += `\n`;
  }

  // Add avoid points
  if (analysis.promptAdjustments.avoid) {
    adjustedPrompt += `**AVOID:**\n`;
    analysis.promptAdjustments.avoid.forEach(point => {
      adjustedPrompt += `- ${point}\n`;
    });
    adjustedPrompt += `\n`;
  }

  // Add additional instructions
  if (analysis.promptAdjustments.additionalInstructions) {
    adjustedPrompt += `**ADDITIONAL INSTRUCTIONS:**\n`;
    adjustedPrompt += `${analysis.promptAdjustments.additionalInstructions}\n\n`;
  }

  return adjustedPrompt;
}

/**
 * Retry metrics for monitoring
 */
export interface RetryMetrics {
  sessionId: string;
  tableNumber: number | string;
  totalAttempts: number;
  successfulAttempt: number | null;
  totalDurationMs: number;
  errors: Array<{
    attempt: number;
    errorType: string;
    message: string;
  }>;
}

export function calculateRetryMetrics<T>(
  sessionId: string,
  tableNumber: number | string,
  result: RetryResult<T>
): RetryMetrics {
  return {
    sessionId,
    tableNumber,
    totalAttempts: result.totalAttempts,
    successfulAttempt: result.success
      ? result.attempts.find(a => a.success)?.attemptNumber || null
      : null,
    totalDurationMs: result.totalDurationMs,
    errors: result.attempts
      .filter(a => !a.success && a.error)
      .map(a => ({
        attempt: a.attemptNumber,
        errorType: analyzeExtractionError(a.error!).errorType,
        message: a.error!.message,
      })),
  };
}
