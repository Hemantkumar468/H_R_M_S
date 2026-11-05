import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}${stackString}`;
  }),
);

const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.DailyRotateFile({
    dirname: logDir,
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    maxSize: '20m',
    format: fileFormat,
    level: 'info',
  }),
  new winston.transports.DailyRotateFile({
    dirname: logDir,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    format: fileFormat,
    level: 'error',
  }),
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
  exitOnError: false,
});
