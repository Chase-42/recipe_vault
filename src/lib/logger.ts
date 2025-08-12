// Environment variables - using process.env directly for compatibility

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Context information that can be attached to log entries
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  environment: string;
}

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Centralized logging service with environment-aware configuration
 */
class Logger {
  private config: LoggerConfig;
  private correlationId: string | null = null;

  constructor() {
    this.config = {
      level: this.getLogLevel(),
      enableConsole: process.env.NODE_ENV !== "production",
      enableRemote: process.env.NODE_ENV === "production",
      environment: process.env.NODE_ENV ?? "development",
    };
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    this.correlationId = null;
  }

  /**
   * Get log level based on environment
   */
  private getLogLevel(): LogLevel {
    switch (process.env.NODE_ENV) {
      case "development":
        return LogLevel.DEBUG;
      case "test":
        return LogLevel.WARN;
      case "production":
        return LogLevel.INFO;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
    };

    // Add correlation ID to context if available
    if (context || this.correlationId) {
      entry.context = {
        ...context,
        ...(this.correlationId && { requestId: this.correlationId }),
      };
    }

    // Add error information if provided
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Output log entry to console
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const { timestamp, level, message, context, error } = entry;
    const prefix = `[${timestamp}] [${level}]`;

    switch (level) {
      case "DEBUG":
        console.debug(prefix, message, context, error);
        break;
      case "INFO":
        console.info(prefix, message, context, error);
        break;
      case "WARN":
        console.warn(prefix, message, context, error);
        break;
      case "ERROR":
        console.error(prefix, message, context, error);
        break;
      default:
        console.log(prefix, message, context, error);
    }
  }

  /**
   * Send log entry to remote logging service
   * This is a placeholder for future integration with services like Sentry, LogRocket, etc.
   */
  private logToRemote(_entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    // TODO: Implement remote logging integration
    // This could be Sentry, LogRocket, CloudWatch, etc.
    // For now, we'll just store it for future implementation
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);

    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.correlationId = this.correlationId;

    // Override logging methods to include the child context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (
      level: LogLevel,
      message: string,
      additionalContext?: LogContext,
      error?: Error
    ) => {
      const mergedContext = { ...context, ...additionalContext };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }

  /**
   * Create a logger for a specific component
   */
  forComponent(componentName: string): Logger {
    return this.child({ component: componentName });
  }

  /**
   * Create a logger for a specific action
   */
  forAction(actionName: string): Logger {
    return this.child({ action: actionName });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const createRequestLogger = (requestId?: string) => {
  const id = requestId || generateCorrelationId();
  logger.setCorrelationId(id);
  return logger.child({ requestId: id });
};

export const createComponentLogger = (componentName: string) => {
  return logger.forComponent(componentName);
};

export const createActionLogger = (actionName: string) => {
  return logger.forAction(actionName);
};
