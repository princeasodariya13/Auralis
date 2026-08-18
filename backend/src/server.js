import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';
import { startJobWorker, stopJobWorker } from './workers/jobWorker.js';
import { logger } from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Only listen if not in a Vercel Serverless environment
// Vercel sets various environment variables, or we can just check if we are in production
// But if it's a Vercel Service (long running), it DOES need app.listen.
// If it's Vercel Serverless, it needs export default app.
// Doing both is safe for express.
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_URL || !process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`, { event: 'SYSTEM_STARTUP' });
        startJobWorker(); // Start the background jobs
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
        logger.info('Received kill signal, shutting down gracefully...', { event: 'SYSTEM_SHUTDOWN' });
        stopJobWorker();
        server.close(() => {
            logger.info('Closed out remaining connections.', { event: 'SYSTEM_SHUTDOWN_COMPLETE' });
            process.exit(0);
        });
        
        setTimeout(() => {
            logger.critical('Could not close connections in time, forcefully shutting down', { event: 'SYSTEM_FORCE_SHUTDOWN' });
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (err) => {
        logger.critical('Uncaught Exception! Shutting down...', { 
            event: 'UNCAUGHT_EXCEPTION', 
            errorName: err.name, 
            message: err.message 
        });
        gracefulShutdown();
    });

    process.on('unhandledRejection', (err) => {
        logger.critical('Unhandled Rejection! Shutting down...', { 
            event: 'UNHANDLED_REJECTION', 
            errorName: err.name, 
            message: err.message 
        });
        gracefulShutdown();
    });
}

// Export for Vercel Serverless compatibility
export default app;
