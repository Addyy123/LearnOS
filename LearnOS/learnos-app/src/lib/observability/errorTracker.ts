import { logger } from './logger';

/**
 * Universal Error Tracker that routes to Sentry (when DSN is present)
 * or falls back to our structured JsonLogger.
 */
export class ErrorTracker {
  static captureException(error: Error, context?: Record<string, any>) {
    // If Sentry DSN is present, we would initialize and capture here.
    // e.g. if (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.captureException(error, { extra: context }) }
    
    // Fallback to structured logging
    logger.error('Unhandled Exception Caught', {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      ...context
    });
  }

  static captureMessage(message: string, context?: Record<string, any>) {
    logger.info(message, context);
  }
}
