import crypto from 'crypto';

// Optional: if AsyncLocalStorage is used, we can get request ID implicitly, 
// but passing req manually is safer and simpler for this lightweight requirement.
export const generateRequestId = () => {
    return crypto.randomUUID();
};

const formatMessage = (level, message, meta = {}) => {
    const logObj = {
        timestamp: new Date().toISOString(),
        level,
        message,
        environment: process.env.NODE_ENV || 'development',
        ...meta
    };
    
    // In production, write as single line JSON
    if (process.env.NODE_ENV === 'production') {
        return JSON.stringify(logObj);
    }
    
    // In dev, nice print
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${logObj.timestamp}] [${level}] ${message} ${metaStr}`;
};

export const logger = {
    info: (message, meta = {}) => {
        console.log(formatMessage('INFO', message, meta));
    },
    warn: (message, meta = {}) => {
        console.warn(formatMessage('WARN', message, meta));
    },
    error: (message, meta = {}) => {
        console.error(formatMessage('ERROR', message, meta));
    },
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatMessage('DEBUG', message, meta));
        }
    },
    critical: (message, meta = {}) => {
        console.error(formatMessage('CRITICAL', message, meta));
    }
};
