import winston from 'winston';
import morgan from 'morgan';
import { Request, Response } from 'express';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${message}${metaStr}`;
});

const isProduction = process.env.NODE_ENV === 'production';

// TODO: Add CloudWatch transport when AWS infra is ready:
//   import CloudWatchTransport from 'winston-cloudwatch';
//   logger.add(new CloudWatchTransport({ logGroupName: '/thulobazaar/api', ... }));

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction
    ? combine(timestamp(), errors({ stack: true }), json())
    : combine(timestamp({ format: 'HH:mm:ss' }), colorize(), devFormat),
  transports: [new winston.transports.Console()],
});

// Morgan HTTP request logger piped through winston
const morganStream = {
  write: (message: string) => logger.http(message.trimEnd()),
};

export const httpLoggerMiddleware = morgan(
  isProduction ? 'combined' : 'dev',
  { stream: morganStream }
);

// Silence logger in tests
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}
