/**
 * Application Logger
 *
 * Centralized logging utility using Pino
 * Replaces console.log/console.error for production-ready logging
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.info('Message', { context: {...} });
 *   logger.error('Error occurred', { error, context: {...} });
 */

import pino from 'pino';

// Create logger instance
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  // Pretty print in development
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Log levels:
 * - fatal (60): Application crash
 * - error (50): Error events
 * - warn (40): Warning events
 * - info (30): Informational messages
 * - debug (20): Debug messages
 * - trace (10): Detailed trace messages
 */

export { logger };

// Convenience exports with proper Pino signatures
export const logInfo = (message: string, context?: Record<string, any>) =>
  logger.info(context || {}, message);

export const logError = (message: string, error?: unknown, context?: Record<string, any>) =>
  logger.error({ err: error, ...context }, message);

export const logWarn = (message: string, context?: Record<string, any>) =>
  logger.warn(context || {}, message);

export const logDebug = (message: string, context?: Record<string, any>) =>
  logger.debug(context || {}, message);

/**
 * Helper to create context-aware logger error
 * Properly formats error objects for Pino
 */
export const createErrorLogger = (context: Record<string, any> = {}) => ({
  error: (message: string, error: unknown) =>
    logger.error({ err: error, ...context }, message),
  warn: (message: string) => logger.warn(context, message),
  info: (message: string) => logger.info(context, message),
});
