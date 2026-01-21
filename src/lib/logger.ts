export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogContext = Record<string, unknown>;

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

class Logger {
  private level: LogLevel;
  private correlationId: string | null = null;
  private context: LogContext = {};

  constructor(context: LogContext = {}) {
    this.context = context;
    this.level =
      process.env.NODE_ENV === "production"
        ? LogLevel.INFO
        : process.env.NODE_ENV === "test"
          ? LogLevel.WARN
          : LogLevel.DEBUG;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string | null {
    return this.correlationId;
  }

  private log(level: LogLevel, message: string, meta?: LogContext, error?: Error): void {
    if (level < this.level || process.env.NODE_ENV === "production") return;

    const ctx = {
      ...this.context,
      ...meta,
      ...(this.correlationId && { requestId: this.correlationId }),
    };

    const prefix = `[${new Date().toISOString()}] [${LogLevel[level]}]`;
    const args = [prefix, message, Object.keys(ctx).length ? ctx : undefined, error].filter(Boolean);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
    }
  }

  debug(message: string, meta?: LogContext): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: LogContext): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: LogContext): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: LogContext): void {
    this.log(LogLevel.ERROR, message, meta, error);
  }

  forComponent(name: string): Logger {
    const child = new Logger({ ...this.context, component: name });
    child.correlationId = this.correlationId;
    child.level = this.level;
    return child;
  }

  forAction(name: string): Logger {
    const child = new Logger({ ...this.context, action: name });
    child.correlationId = this.correlationId;
    child.level = this.level;
    return child;
  }
}

export const logger = new Logger();
