type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class JsonLogger {
  private log(level: LogLevel, message: string, context: LogContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'info':
        console.log(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: any, context?: LogContext) {
    const errorContext = error instanceof Error ? {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    } : { errorDetails: String(error) };

    this.log('error', message, { ...errorContext, ...context });
  }
}

export const logger = new JsonLogger();
