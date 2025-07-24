import { Logger } from '@/types/core';

export class ConsoleLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: any): void {
    console.error(`[ERROR] ${message}`, error || '', meta || '');
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }
}

export class StructuredLogger implements Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.log('ERROR', message, { error: error?.message, stack: error?.stack, ...meta });
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, meta);
    }
  }

  private log(level: string, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    };

    const logMethod = level === 'ERROR' ? console.error : 
                     level === 'WARN' ? console.warn : 
                     level === 'DEBUG' ? console.debug : console.log;

    logMethod(JSON.stringify(logEntry));
  }
}

export class RemoteLogger implements Logger {
  private httpClient: any;
  private endpoint: string;
  private buffer: any[] = [];
  private batchSize = 10;
  private flushInterval = 5000;

  constructor(httpClient: any, endpoint: string) {
    this.httpClient = httpClient;
    this.endpoint = endpoint;
    this.startBatchFlush();
  }

  info(message: string, meta?: any): void {
    this.addToBuffer('INFO', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.addToBuffer('WARN', message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.addToBuffer('ERROR', message, { error: error?.message, stack: error?.stack, ...meta });
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.addToBuffer('DEBUG', message, meta);
    }
  }

  private addToBuffer(level: string, message: string, meta?: any): void {
    this.buffer.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    });

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await this.httpClient.post(this.endpoint, { logs });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      this.buffer.unshift(...logs);
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}
