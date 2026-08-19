import BackgroundJob from '../models/BackgroundJob.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import { getTransporter } from '../services/emailService.js'; // Will need to export getTransporter
import { recordAdminAction } from '../services/adminAuditService.js';
import { detectShipmentExceptions } from '../services/shipmentExceptionService.js';
import { logger } from '../utils/logger.js';

let isRunning = false;
let workerInterval = null;

// Graceful locking: 5 minutes max lease
const LOCK_TIMEOUT = 5 * 60 * 1000;

export const processJobs = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
        const now = new Date();
        const lockExpiry = new Date(now.getTime() - LOCK_TIMEOUT);

        // Find a job that is pending or failed (but has attempts left), or a stuck processing job
        // And whose nextAttemptAt is in the past
        const job = await BackgroundJob.findOneAndUpdate(
            {
                $or: [
                    { status: { $in: ['pending', 'failed'] }, nextAttemptAt: { $lte: now }, attempts: { $lt: 3 } },
                    { status: 'processing', lockedAt: { $lte: lockExpiry } }
                ]
            },
            {
                $set: { status: 'processing', lockedAt: now }
            },
            { sort: { nextAttemptAt: 1 }, new: true }
        );

        if (!job) {
            isRunning = false;
            return; // No jobs to process
        }
        
        logger.debug(`Processing job ${job._id} of type ${job.type}`, { event: 'JOB_STARTED', jobId: job._id, jobType: job.type });

        try {
            // Process based on type
            if (job.type === 'SEND_EMAIL') {
                const t = getTransporter();
                const mailOptions = {
                    from: process.env.EMAIL_FROM || '"Auralis Audio" <no-reply@auralis.com>',
                    to: job.payload.to,
                    subject: job.payload.subject,
                    html: job.payload.html
                };
                await t.sendMail(mailOptions);
                
                if (job.payload.eventKey) {
                    const NotificationLog = (await import('../models/NotificationLog.js')).default;
                    await NotificationLog.findOneAndUpdate(
                        { eventKey: job.payload.eventKey },
                        { eventType: job.payload.eventType, recipientEmail: job.payload.to, status: 'sent', errorDetails: null },
                        { upsert: true, new: true }
                    );
                }
            }
            else if (job.type === 'CREATE_NOTIFICATION') {
                const CustomerNotification = (await import('../models/CustomerNotification.js')).default;
                const { userId, type, title, message, orderNumber, idempotencyKey } = job.payload;
                
                try {
                    if (idempotencyKey) {
                        const existing = await CustomerNotification.findOne({ idempotencyKey });
                        if (existing) return; // Already processed
                    }
                    
                    await CustomerNotification.create({
                        userId,
                        type,
                        title,
                        message,
                        orderNumber,
                        idempotencyKey
                    });
                } catch (error) {
                    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
                        return; // Duplicate, safe to ignore
                    }
                    throw error;
                }
            } 
            else if (job.type === 'CLEANUP_STUCK_ORDERS') {
                // Find pending_payment orders older than 30 mins
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
                const stuckOrders = await Order.find({
                    paymentStatus: 'pending',
                    createdAt: { $lte: thirtyMinsAgo }
                });

                for (const order of stuckOrders) {
                    order.orderStatus = 'cancelled';
                    order.paymentStatus = 'failed';
                    await order.save();
                    
                    // Audit or history? Just history since it's automated, not admin.
                    const OrderStatusHistory = (await import('../models/OrderStatusHistory.js')).default;
                    await OrderStatusHistory.create({
                        orderId: order._id,
                        status: 'cancelled',
                        notes: 'System automatically cancelled due to payment timeout.',
                        updatedBy: null, // System
                        userType: 'system'
                    });
                }
            }
            else if (job.type === 'DETECT_STUCK_REFUNDS') {
                // Find processing_refund that are older than 15 mins
                const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
                const stuckReturns = await ReturnRequest.find({
                    status: 'processing_refund',
                    updatedAt: { $lte: fifteenMinsAgo }
                });

                for (const ret of stuckReturns) {
                    ret.status = 'requires_reconciliation';
                    ret.adminNote = (ret.adminNote || '') + '\nSystem marked for reconciliation: Gateway refund status unknown after crash/timeout.';
                    await ret.save();
                    
                    // We can also trigger an audit for this automatic safety net
                    await recordAdminAction({
                        adminUserId: null, // System action
                        action: 'RETURN_REQUIRES_RECONCILIATION',
                        resourceType: 'ReturnRequest',
                        resourceId: ret._id,
                        success: true,
                        metadata: { reason: 'Timeout during processing_refund state' }
                    });
                }
            }

            else if (job.type === 'DETECT_ABANDONED_CARTS') {
                const Cart = (await import('../models/Cart.js')).default;
                const User = (await import('../models/User.js')).default;
                const BackgroundJob = (await import('../models/BackgroundJob.js')).default;

                // Find carts untouched for 24 hours but less than 7 days (to not spam very old carts)
                // and currently in stage 0.
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                
                const abandonedCarts = await Cart.find({
                    'items.0': { $exists: true }, // Has at least one item
                    updatedAt: { $lte: twentyFourHoursAgo, $gte: sevenDaysAgo },
                    'recovery.stage': 0
                });

                for (const cart of abandonedCarts) {
                    const user = await User.findById(cart.userId);
                    // Only send if user opted in and exists
                    if (user && user.preferences?.emailMarketing !== false) {
                        // Enqueue email job
                        const idempotencyKey = `ABANDONED_CART_STAGE1_${cart._id}_${cart.updatedAt.getTime()}`;
                        
                        await BackgroundJob.updateOne(
                            { idempotencyKey },
                            {
                                $setOnInsert: {
                                    type: 'SEND_CART_RECOVERY_EMAIL',
                                    status: 'pending',
                                    idempotencyKey,
                                    payload: { cartId: cart._id, userId: user._id, email: user.email, name: user.name }
                                }
                            },
                            { upsert: true }
                        );
                        
                        cart.recovery.stage = 1;
                        cart.recovery.lastSentAt = new Date();
                        await cart.save();
                    }
                }
            }
            else if (job.type === 'SEND_CART_RECOVERY_EMAIL') {
                const Cart = (await import('../models/Cart.js')).default;
                const Product = (await import('../models/Product.js')).default;
                
                const { cartId, userId, email, name } = job.payload;
                
                // Double check cart is still valid
                const cart = await Cart.findOne({ _id: cartId, userId, 'items.0': { $exists: true } });
                
                if (cart) {
                    // Fetch products dynamically to show current info
                    const productIds = cart.items.map(item => item.productId);
                    const products = await Product.find({ id: { $in: productIds }, isActive: true, stockQuantity: { $gt: 0 } });
                    
                    if (products.length > 0) {
                        // Generate recovery email
                        const productListHtml = products.map(p => 
                            `<tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                                    <img src="${p.image}" alt="${p.name}" width="60" style="border-radius: 8px;" />
                                </td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; color: #1e293b;">
                                    <strong>${p.name}</strong><br/>
                                    <span style="color: #64748b;">₹${p.price.toFixed(2)}</span>
                                </td>
                            </tr>`
                        ).join('');

                        const emailHtml = `
                            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <h1 style="color: #0f172a; margin-top: 0; font-size: 24px;">Your Auralis selection is waiting.</h1>
                                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                    Hi ${name},<br/><br/>
                                    We noticed you left some premium audio equipment in your cart. Due to high demand, we can't guarantee inventory indefinitely.
                                </p>
                                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                    ${productListHtml}
                                </table>
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/cart" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 8px;">Return to Cart</a>
                                </div>
                                <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
                                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/account" style="color: #64748b; text-decoration: underline;">Update Email Preferences</a>
                                </div>
                            </div>
                        `;

                        // We can just reuse SEND_EMAIL
                        const BackgroundJob = (await import('../models/BackgroundJob.js')).default;
                        await BackgroundJob.create({
                            type: 'SEND_EMAIL',
                            idempotencyKey: `DELIVER_RECOVERY_${cartId}_${Date.now()}`,
                            payload: {
                                to: email,
                                subject: 'Your Auralis cart is waiting',
                                html: emailHtml,
                                eventType: 'CART_RECOVERY'
                            }
                        });
                    }
                }
            }
            else if (job.type === 'MONITOR_SHIPMENT_EXCEPTIONS') {
                await detectShipmentExceptions();
            }

            if (['CLEANUP_STUCK_ORDERS', 'DETECT_STUCK_REFUNDS', 'DETECT_ABANDONED_CARTS', 'MONITOR_SHIPMENT_EXCEPTIONS'].includes(job.type)) {
                job.status = 'pending';
                job.lockedAt = null;
                // Run again in 15 minutes
                job.nextAttemptAt = new Date(Date.now() + 15 * 60 * 1000);
            } else {
                job.status = 'completed';
                job.lockedAt = null;
            }
            await job.save();
            
            logger.info(`Job ${job._id} completed successfully`, { event: 'JOB_COMPLETED', jobId: job._id, jobType: job.type });

        } catch (error) {
            logger.error(`Job ${job._id} failed`, { event: 'JOB_FAILED', jobId: job._id, jobType: job.type, error: error.message, attempt: job.attempts + 1 });
            job.attempts += 1;
            job.lastError = error.message;
            job.lockedAt = null;

            if (job.attempts >= job.maxAttempts) {
                job.status = 'failed'; // Permanent fail, requires manual intervention
                // We leave nextAttemptAt alone so it's not picked up again
            } else {
                job.status = 'failed'; // Will be picked up because attempts < maxAttempts
                // Exponential backoff: 5m, 15m, etc.
                const backoffMins = 5 * Math.pow(3, job.attempts - 1);
                job.nextAttemptAt = new Date(Date.now() + backoffMins * 60 * 1000);
            }
            await job.save();
            
            if (job.status === 'failed' && job.attempts >= job.maxAttempts) {
                logger.critical(`Job ${job._id} permanently failed`, { event: 'JOB_DEAD_LETTER', jobId: job._id, jobType: job.type });
            }
        }

    } catch (err) {
        logger.error('Critical error polling jobs', { event: 'JOB_WORKER_ERROR', error: err.message });
    } finally {
        isRunning = false;
        
        // If we just processed a job, we should immediately check for another one (to clear backlog quickly)
        // We do this by asynchronously calling processJobs again after a tiny delay
        setTimeout(() => {
            processJobs().catch(console.error);
        }, 100);
    }
};

export const startJobWorker = () => {
    if (workerInterval) return;
    logger.info('Starting Background Job Worker...', { event: 'JOB_WORKER_STARTED' });
    
    // Poll every 10 seconds initially
    workerInterval = setInterval(() => {
        processJobs().catch(err => logger.error('processJobs error', { error: err.message }));
    }, 10000);

    // Schedule regular system maintenance jobs (idempotent setup)
    scheduleMaintenanceJobs().catch(err => logger.error('scheduleMaintenanceJobs error', { error: err.message }));
};

export const stopJobWorker = () => {
    if (workerInterval) {
        clearInterval(workerInterval);
        workerInterval = null;
        logger.info('Background Job Worker stopped.', { event: 'JOB_WORKER_STOPPED' });
    }
};

const scheduleMaintenanceJobs = async () => {
    try {
        const BackgroundJob = (await import('../models/BackgroundJob.js')).default;
        
        // Cleanup Orders Job - Runs continuously
        await BackgroundJob.updateOne(
            { type: 'CLEANUP_STUCK_ORDERS' },
            { 
                $setOnInsert: {
                    type: 'CLEANUP_STUCK_ORDERS',
                    status: 'pending',
                    idempotencyKey: 'SYSTEM_CLEANUP_STUCK_ORDERS',
                    payload: {},
                    maxAttempts: 999999999 // Runs forever
                }
            },
            { upsert: true }
        );

        // Stuck Refund Detector - Runs continuously
        await BackgroundJob.updateOne(
            { type: 'DETECT_STUCK_REFUNDS' },
            { 
                $setOnInsert: {
                    type: 'DETECT_STUCK_REFUNDS',
                    status: 'pending',
                    idempotencyKey: 'SYSTEM_DETECT_STUCK_REFUNDS',
                    payload: {},
                    maxAttempts: 999999999 // Runs forever
                }
            },
            { upsert: true }
        );

        // Abandoned Cart Detector - Runs continuously
        await BackgroundJob.updateOne(
            { type: 'DETECT_ABANDONED_CARTS' },
            { 
                $setOnInsert: {
                    type: 'DETECT_ABANDONED_CARTS',
                    status: 'pending',
                    idempotencyKey: 'SYSTEM_DETECT_ABANDONED_CARTS',
                    payload: {},
                    maxAttempts: 999999999 // Runs forever
                }
            },
            { upsert: true }
        );

        // Shipment Exception Monitor - Runs continuously
        await BackgroundJob.updateOne(
            { type: 'MONITOR_SHIPMENT_EXCEPTIONS' },
            { 
                $setOnInsert: {
                    type: 'MONITOR_SHIPMENT_EXCEPTIONS',
                    status: 'pending',
                    idempotencyKey: 'SYSTEM_MONITOR_SHIPMENT_EXCEPTIONS',
                    payload: {},
                    maxAttempts: 999999999 // Runs forever
                }
            },
            { upsert: true }
        );
    } catch (error) {
        logger.error('Failed to schedule maintenance jobs', { event: 'JOB_SCHEDULING_ERROR', error: error.message });
    }
};
