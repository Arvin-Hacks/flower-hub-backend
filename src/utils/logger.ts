import { createWriteStream } from 'fs';
import { join } from 'path';

// Simple logger implementation
class Logger {
  private logStream = createWriteStream(join(process.cwd(), 'logs', 'app.log'), { flags: 'a' });

  private formatMessage(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}\n`;
  }

  private writeLog(level: string, message: string, meta?: unknown): void {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to console (only in development)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(message, meta);
    }
    
    // Write to file
    this.logStream.write(formattedMessage);
  }

  info(message: string, meta?: unknown): void {
    this.writeLog('info', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.writeLog('error', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.writeLog('warn', message, meta);
  }

  debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, meta);
    }
  }
}

export const logger = new Logger();
