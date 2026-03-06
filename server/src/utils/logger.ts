/**
 * 日志工具
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel = 'info';

  constructor() {
    const envLevel = process.env.LOG_LEVEL as LogLevel;
    if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
      this.level = envLevel;
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (LOG_LEVELS[level] <= LOG_LEVELS[this.level]) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case 'error':
          console.error(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'info':
          console.info(prefix, message, ...args);
          break;
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
      }
    }
  }

  public error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }
}

export const logger = new Logger();