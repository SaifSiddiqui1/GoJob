const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack, correlationId }) => {
    const idStr = correlationId ? `[${correlationId}] ` : '';
    return `${timestamp} ${level}: ${idStr}${stack || message}`;
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleFormat
            )
        }),
        // Daily rotating file for errors
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
            maxSize: '20m',
        }),
        // Daily rotating file for combined logs
        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
        })
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
        })
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: 'logs/rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
        })
    ]
});

module.exports = logger;
