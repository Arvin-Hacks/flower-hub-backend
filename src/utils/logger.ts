import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

// Simple logger implementation
class Logger {
  private logStream: ReturnType<typeof createWriteStream> | null = null;

  constructor() {
    if (process.env.NODE_ENV === 'development') {
      const logsDir = join(process.cwd(), 'logs');
      try {
        mkdirSync(logsDir, { recursive: true });
        this.logStream = createWriteStream(join(logsDir, 'app.log'), { flags: 'a' });
      } catch {
        // Ignore filesystem errors in development setup
        this.logStream = null;
      }
    }
  }

  private formatMessage(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}\n`;
  }

  private writeLog(level: string, message: string, meta?: unknown): void {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Always write to console (captured by Vercel in production)
    // eslint-disable-next-line no-console
    console.log(formattedMessage.trim());

    // Only write to file in development when stream is available
    if (this.logStream) {
      this.logStream.write(formattedMessage);
    }
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
