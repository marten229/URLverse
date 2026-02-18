/**
 * Centralised logging and error-boundary infrastructure.
 *
 * All application errors are funnelled through this module so that:
 * - Sensitive data (e.g. API keys) can be redacted before logging.
 * - A single integration point exists for future external monitoring services
 *   (Sentry, LogRocket, etc.).
 * - Unhandled promise rejections and global JS errors are captured automatically.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
  readonly userAgent?: string;
  readonly url?: string;
}

import type { ErrorContext } from '../types';

/**
 * Singleton logger that buffers log entries in memory and forwards them to
 * the browser console. In production, error-level entries are additionally
 * sent to an external logging service.
 *
 * The in-memory buffer is capped at `maxLogs` entries to prevent unbounded
 * memory growth in long-running sessions.
 */
export class Logger {
  private static instance: Logger;
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly isDevelopment = import.meta.env.DEV;

  private constructor() { }

  /**
   * Returns the singleton `Logger` instance, creating it on first access.
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Logs a debug-level message. Only emitted to the console in development.
   *
   * @param message - Human-readable description of the event.
   * @param context - Optional structured metadata for the event.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Logs an informational message.
   *
   * @param message - Human-readable description of the event.
   * @param context - Optional structured metadata for the event.
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Logs a warning for non-fatal but noteworthy conditions.
   *
   * @param message - Human-readable description of the warning.
   * @param context - Optional structured metadata.
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Logs an error with optional stack trace and context.
   * Sensitive fields in `context` (e.g. `apiKey`) are automatically redacted.
   *
   * @param message - Human-readable description of the error.
   * @param error   - The original `Error` object, if available.
   * @param context - Optional structured metadata; sensitive fields are scrubbed.
   */
  error(message: string, error?: Error, context?: ErrorContext): void {
    this.log('error', message, this.sanitizeContext(context), error);
  }

  /**
   * Core log method that creates a structured entry, appends it to the
   * in-memory buffer, and dispatches it to the console and (in production)
   * to an external service.
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.addLogEntry(entry);
    this.consoleLog(entry);

    // Only forward errors to external services in production to avoid noise
    // during development and to reduce costs.
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalLogging(entry);
    }
  }

  /**
   * Appends an entry to the in-memory buffer, evicting the oldest entries
   * when the buffer exceeds `maxLogs` to prevent memory leaks.
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }
  }

  /**
   * Routes a log entry to the appropriate `console` method based on its level.
   * Debug entries are suppressed in production to keep the console clean for
   * end users.
   */
  private consoleLog(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    const timeStr = timestamp.toISOString();

    const logMessage = `[${timeStr}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage, context, error);
        }
        break;
      case 'info':
        console.info(logMessage, context);
        break;
      case 'warn':
        console.warn(logMessage, context);
        break;
      case 'error':
        console.error(logMessage, error || context);
        break;
    }
  }

  /**
   * Removes sensitive fields from an error context before logging to prevent
   * API keys or user credentials from appearing in log outputs or being
   * forwarded to external services.
   *
   * @param context - The raw error context, potentially containing sensitive data.
   * @returns A sanitised copy of the context.
   */
  private sanitizeContext(context?: ErrorContext): Record<string, unknown> {
    if (!context) return {};

    const sanitized = { ...context };

    // Redact the API key so it never appears in log outputs or external services.
    if (sanitized.apiKey) {
      sanitized.apiKey = '[REDACTED]';
    }

    return sanitized;
  }

  /**
   * Placeholder for forwarding error entries to an external monitoring service.
   *
   * TODO: Integrate with Sentry, LogRocket, or a custom `/api/logs` endpoint.
   *
   * @param entry - The completed log entry to forward.
   */
  private async sendToExternalLogging(entry: LogEntry): Promise<void> {
    try {
      if (this.isDevelopment) {
        console.info('Would send to external logging:', entry);
      }

      // Example future integration:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });

    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Returns a snapshot of all buffered log entries.
   *
   * @returns An immutable copy of the log buffer.
   */
  getLogs(): ReadonlyArray<LogEntry> {
    return [...this.logs];
  }

  /**
   * Filters the log buffer by severity level.
   *
   * @param level - The log level to filter by.
   * @returns All entries matching the given level.
   */
  getLogsByLevel(level: LogLevel): ReadonlyArray<LogEntry> {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Serialises the entire log buffer to a JSON string for diagnostics or
   * support exports.
   *
   * @returns Pretty-printed JSON representation of all log entries.
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clears the in-memory log buffer. Useful for testing or when the user
   * explicitly resets application state.
   */
  clearLogs(): void {
    this.logs.length = 0;
  }
}

/**
 * Registers global event listeners to catch unhandled errors and promise
 * rejections that would otherwise be silently swallowed.
 *
 * Attaching these listeners at the module level ensures no errors escape
 * before application-specific handlers are set up.
 */
export class ErrorBoundary {
  private static logger = Logger.getInstance();

  /**
   * Registers `window`-level handlers for unhandled rejections and uncaught
   * JavaScript errors. Should be called once at application startup.
   */
  static initialize(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error(
        'Unhandled Promise Rejection',
        event.reason,
        {
          component: 'ErrorBoundary',
          action: 'unhandledrejection',
          url: window.location.href
        }
      );
    });

    window.addEventListener('error', (event) => {
      this.logger.error(
        'Global JavaScript Error',
        event.error,
        {
          component: 'ErrorBoundary',
          action: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });
  }

  /**
   * Wraps an async function with error handling, logging any thrown errors
   * and returning `null` instead of propagating the exception.
   *
   * @param fn      - The async function to execute safely.
   * @param context - Optional context metadata attached to any logged error.
   * @returns The function's return value, or `null` if it threw.
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(
        'Async function error',
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      return null;
    }
  }

  /**
   * Wraps a synchronous function with error handling, logging any thrown errors
   * and returning the `fallback` value instead of propagating the exception.
   *
   * @param fn       - The synchronous function to execute safely.
   * @param context  - Optional context metadata attached to any logged error.
   * @param fallback - Value to return if the function throws.
   * @returns The function's return value, or `fallback` / `null` if it threw.
   */
  static wrapSync<T>(
    fn: () => T,
    context?: ErrorContext,
    fallback?: T
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.logger.error(
        'Sync function error',
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      return fallback ?? null;
    }
  }
}

/**
 * Thrown when user-supplied input fails validation rules.
 * Carries an optional `field` name to identify which input was invalid.
 */
export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when an API call fails. Carries the HTTP `status` code and the
 * `endpoint` URL to aid in debugging and retry logic.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thrown when a required configuration value is missing or invalid.
 * Carries the `configKey` that caused the failure.
 */
export class ConfigurationError extends Error {
  constructor(message: string, public readonly configKey?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/** Shared singleton logger instance for use throughout the application. */
export const logger = Logger.getInstance();

// Auto-initialise the error boundary as soon as this module is loaded in a
// browser context so that no errors are missed before explicit setup calls.
if (typeof window !== 'undefined') {
  ErrorBoundary.initialize();
}