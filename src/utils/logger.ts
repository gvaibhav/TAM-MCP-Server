import winston from 'winston';

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private context: string;

  private constructor(context: string = 'Application') {
    this.context = context;

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const logEntry = {
          timestamp,
          level,
          context,
          message,
          ...meta
        };
        return JSON.stringify(logEntry);
      })
    );

    // Create winston logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { context: this.context },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${context}] ${level}: ${message} ${metaStr}`;
            })
          )
        }),

        // File transport for errors
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),

        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        })
      ],

      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
      ]
    });

    // Don't exit on handled exceptions in production
    this.logger.exitOnError = false;
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { context: this.context, ...meta });
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { context: this.context, ...meta });
  }

  /**
   * Log error message
   */
  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, { context: this.context, ...meta });
  }

  /**
   * Log HTTP request
   */
  logRequest(req: any, meta?: Record<string, any>): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      ...meta
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: any, res: any, responseTime: number, meta?: Record<string, any>): void {
    this.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      ...meta
    });
  }

  /**
   * Log tool execution
   */
  logToolExecution(toolName: string, duration: number, success: boolean, meta?: Record<string, any>): void {
    const level = success ? 'info' : 'error';
    this.logger.log(level, 'Tool Execution', {
      context: this.context,
      tool: toolName,
      duration: `${duration}ms`,
      success,
      ...meta
    });
  }

  /**
   * Log cache operation
   */
  logCacheOperation(operation: string, key: string, hit: boolean, meta?: Record<string, any>): void {
    this.debug('Cache Operation', {
      operation,
      key,
      hit,
      ...meta
    });
  }

  /**
   * Log data source operation
   */
  logDataSource(source: string, operation: string, duration: number, success: boolean, meta?: Record<string, any>): void {
    const level = success ? 'debug' : 'warn';
    this.logger.log(level, 'Data Source Operation', {
      context: this.context,
      source,
      operation,
      duration: `${duration}ms`,
      success,
      ...meta
    });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high', meta?: Record<string, any>): void {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this.logger.log(level, 'Security Event', {
      context: this.context,
      event,
      severity,
      ...meta
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, value: number, unit: string, meta?: Record<string, any>): void {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
      ...meta
    });
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: string): Logger {
    const childContext = `${this.context}.${additionalContext}`;
    return new Logger(childContext);
  }

  /**
   * Get underlying winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: string): void {
    this.logger.level = level;
    this.info('Log level changed', { newLevel: level });
  }

  /**
   * Add transport dynamically
   */
  addTransport(transport: winston.transport): void {
    this.logger.add(transport);
    this.info('Transport added', { transportType: transport.constructor.name });
  }

  /**
   * Remove transport dynamically
   */
  removeTransport(transport: winston.transport): void {
    this.logger.remove(transport);
    this.info('Transport removed', { transportType: transport.constructor.name });
  }

  /**
   * Profile a function execution
   */
  async profile<T>(name: string, fn: () => Promise<T>, meta?: Record<string, any>): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting ${name}`, meta);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Completed ${name}`, { duration: `${duration}ms`, success: true, ...meta });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed ${name}`, { 
        duration: `${duration}ms`, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...meta 
      });
      throw error;
    }
  }

  /**
   * Log structured event with standardized format
   */
  logEvent(eventType: string, eventData: Record<string, any>): void {
    this.info('Event', {
      eventType,
      eventTime: new Date().toISOString(),
      ...eventData
    });
  }

  /**
   * Log business metric
   */
  logBusinessMetric(metricName: string, value: number, tags?: Record<string, string>): void {
    this.info('Business Metric', {
      metricName,
      value,
      timestamp: new Date().toISOString(),
      tags: tags || {}
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(context: string = 'Application'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }
}

// Export singleton logger for application-wide use
export const appLogger = Logger.getInstance('App');

// Export logger factory function
export function createLogger(context: string): Logger {
  return Logger.getInstance(context);
}
