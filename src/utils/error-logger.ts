/**
 * Error Handling und Logging System
 * Zentrales System für Error-Management und Logging
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
 * Zentraler Logger für die Anwendung
 */
export class Logger {
  private static instance: Logger;
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly isDevelopment = import.meta.env.DEV;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Debug-Nachricht loggen
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Info-Nachricht loggen
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Warning loggen
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Error loggen
   */
  error(message: string, error?: Error, context?: ErrorContext): void {
    this.log('error', message, this.sanitizeContext(context), error);
  }

  /**
   * Zentrale Log-Methode
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
    
    // In Production: Fehler an externes System senden
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalLogging(entry);
    }
  }

  /**
   * Log-Eintrag hinzufügen
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Logs begrenzen um Speicher zu schonen
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }
  }

  /**
   * Console-Output
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
   * Sensitive Daten aus Context entfernen
   */
  private sanitizeContext(context?: ErrorContext): Record<string, unknown> {
    if (!context) return {};
    
    const sanitized = { ...context };
    
    // API Key ausblenden
    if (sanitized.apiKey) {
      sanitized.apiKey = '[REDACTED]';
    }
    
    return sanitized;
  }

  /**
   * Logs an externes System senden (Placeholder)
   */
  private async sendToExternalLogging(entry: LogEntry): Promise<void> {
    try {
      // Hier würde die Integration zu einem Service wie Sentry, LogRocket, etc. erfolgen
      // Für jetzt nur ein Placeholder
      
      if (this.isDevelopment) {
        console.info('Would send to external logging:', entry);
      }
      
      // Beispiel für zukünftige Integration:
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
   * Alle Logs abrufen
   */
  getLogs(): ReadonlyArray<LogEntry> {
    return [...this.logs];
  }

  /**
   * Logs nach Level filtern
   */
  getLogsByLevel(level: LogLevel): ReadonlyArray<LogEntry> {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Logs exportieren
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Logs löschen
   */
  clearLogs(): void {
    this.logs.length = 0;
  }
}

/**
 * Error Boundary für unbehandelte Errors
 */
export class ErrorBoundary {
  private static logger = Logger.getInstance();

  /**
   * Globale Error Handler registrieren
   */
  static initialize(): void {
    // Unhandled Promise Rejections
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

    // Globale JavaScript Errors
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
   * Async Function mit Error Handling wrappen
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
   * Sync Function mit Error Handling wrappen
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
 * Typsichere Error-Klassen
 */
export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

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

export class ConfigurationError extends Error {
  constructor(message: string, public readonly configKey?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Globale Instanz exportieren
export const logger = Logger.getInstance();

// Error Boundary automatisch initialisieren
if (typeof window !== 'undefined') {
  ErrorBoundary.initialize();
}