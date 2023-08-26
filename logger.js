const winston = require('winston');

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, label, timestamp }) => {

  return `[${level}] ${timestamp} ${message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */

const logger = winston.createLogger({
  format:
    combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat,
    ),
  transports: [
    new winston.transports.File({
      filename: 'combined.log'
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      logFormat,
    )
  }));
}
module.exports = logger;