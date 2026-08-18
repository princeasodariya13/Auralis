import mongoose from 'mongoose';
import BackgroundJob from '../models/BackgroundJob.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { logger } from '../utils/logger.js';
import os from 'os';

export const getSystemHealth = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;

        // Background Job Metrics
        const jobsPending = await BackgroundJob.countDocuments({ status: 'pending' });
        const jobsProcessing = await BackgroundJob.countDocuments({ status: 'processing' });
        const jobsFailed = await BackgroundJob.countDocuments({ status: 'failed' });
        
        // Stuck jobs (processing for more than 5 mins)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const jobsStuck = await BackgroundJob.countDocuments({ status: 'processing', lockedAt: { $lte: fiveMinsAgo } });

        // Financial & Fulfillment Metrics
        const paymentFailures = await Order.countDocuments({ paymentStatus: 'failed' });
        const stuckRefunds = await ReturnRequest.countDocuments({ status: 'requires_reconciliation' });

        res.json({
            success: true,
            data: {
                system: {
                    api: 'ok',
                    database: isDbConnected ? 'connected' : 'disconnected',
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage().heapUsed,
                    loadAvg: os.loadavg()
                },
                backgroundJobs: {
                    pending: jobsPending,
                    processing: jobsProcessing,
                    failed: jobsFailed,
                    stuck: jobsStuck
                },
                financial: {
                    paymentFailures,
                    reconciliationCases: stuckRefunds
                }
            }
        });
    } catch (error) {
        logger.error('Failed to fetch system health', { event: 'ADMIN_HEALTH_ERROR', error: error.message });
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};
