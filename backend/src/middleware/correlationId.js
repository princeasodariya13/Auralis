import { generateRequestId, logger } from '../utils/logger.js';

export const correlationIdMiddleware = (req, res, next) => {
    // Check if external proxy like Cloudflare/Nginx passed a safe request ID
    // Otherwise generate a new one
    const reqId = req.headers['x-request-id'] || generateRequestId();
    
    req.requestId = reqId;
    
    // Pass it back to client safely
    res.setHeader('X-Request-Id', reqId);
    
    // Record start time for duration
    req.startTime = Date.now();
    
    // Log request completion safely
    res.on('finish', () => {
        const durationMs = Date.now() - req.startTime;
        
        // Exclude /api/health from standard info logs to prevent flood
        if (req.originalUrl === '/api/health') return;

        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
            event: 'HTTP_REQUEST',
            requestId: req.requestId,
            method: req.method,
            route: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            userId: req.user ? req.user._id : 'anonymous'
        });
    });

    next();
};
