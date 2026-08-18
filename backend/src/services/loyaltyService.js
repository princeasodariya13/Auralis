import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import Order from '../models/Order.js';
import { createCustomerNotification } from './customerNotificationService.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Config
const POINTS_PER_USD = 1; // 1 point per $1 spent on merchandise
export const LOYALTY_MAX_PERCENTAGE = 0.20; // 20% of subtotal maximum
export const POINTS_CONVERSION_RATE = 100; // 100 points = $1

export const calculateEligibleSpend = (order) => {
    // Only merchandise subtotal minus discounts counts for points.
    // Shipping and tax do NOT earn points.
    return Math.max(0, order.subtotal - (order.discountAmount || 0));
};

export const calculatePointsForAmount = (amount) => {
    return Math.floor(amount * POINTS_PER_USD);
};

export const getLoyaltyBalance = async (userId, session = null) => {
    // Find the latest transaction for this user
    let query = LoyaltyTransaction.findOne({ userId }).sort({ createdAt: -1 });
    if (session) query = query.session(session);
    const lastTx = await query;
    return lastTx ? lastTx.balanceAfter : 0;
};

export const getAvailablePoints = async (userId, session = null) => {
    const ledgerBalance = await getLoyaltyBalance(userId, session);
    
    // Find points locked in pending orders
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const aggregateQuery = Order.aggregate([
        { $match: { userId: userIdObj, paymentStatus: 'pending', loyaltyPointsRedeemed: { $gt: 0 } } },
        { $group: { _id: null, reserved: { $sum: '$loyaltyPointsRedeemed' } } }
    ]);
    if (session) aggregateQuery.session(session);
    
    const pendingOrders = await aggregateQuery;
    const reservedPoints = pendingOrders.length > 0 ? pendingOrders[0].reserved : 0;
    
    return Math.max(0, ledgerBalance - reservedPoints);
};

export const calculateLoyaltyDiscount = (eligibleSubtotal, pointsRequested) => {
    if (!pointsRequested || pointsRequested <= 0) return { discountAmount: 0, pointsUsed: 0 };
    
    const maxDiscount = eligibleSubtotal * LOYALTY_MAX_PERCENTAGE;
    const requestedDiscount = pointsRequested / POINTS_CONVERSION_RATE;
    
    // The discount is bounded by either max percentage or the points requested
    const actualDiscount = Math.min(maxDiscount, requestedDiscount);
    // Convert back to points to ensure we only use integer points
    const actualPoints = Math.floor(actualDiscount * POINTS_CONVERSION_RATE);
    
    return {
        discountAmount: Number((actualPoints / POINTS_CONVERSION_RATE).toFixed(2)),
        pointsUsed: actualPoints
    };
};

// Internal function to append to ledger securely
const executeLedgerTransaction = async (userId, type, points, source, idempotencyKey, extraData = {}, session = null) => {
    try {
        // Prevent duplicate execution safely
        const existing = await LoyaltyTransaction.findOne({ idempotencyKey }).session(session);
        if (existing) {
            return existing; // Already processed
        }

        // Get current balance with lock if session exists, else just get it
        // We use $sort to get the absolute latest. Concurrency requires careful handling.
        let lastTxQuery = LoyaltyTransaction.findOne({ userId }).sort({ createdAt: -1 });
        if (session) lastTxQuery = lastTxQuery.session(session);
        const lastTx = await lastTxQuery;

        const currentBalance = lastTx ? lastTx.balanceAfter : 0;
        const newBalance = currentBalance + points;

        if (newBalance < 0 && type !== 'ADMIN_ADJUSTMENT') {
            // Only admin adjustments are allowed to drive a balance negative visually (or we floor to 0)
            // Let's floor it to 0 for reversals to avoid angry customers seeing negative balances if they redeemed then returned.
        }

        const actualBalanceAfter = Math.max(0, newBalance);
        const actualPointsApplied = actualBalanceAfter - currentBalance; // Adjust points to reflect flooring if necessary

        const tx = new LoyaltyTransaction({
            userId,
            type,
            points: actualPointsApplied,
            balanceAfter: actualBalanceAfter,
            source,
            idempotencyKey,
            ...extraData
        });

        if (session) {
            await tx.save({ session });
        } else {
            await tx.save();
        }

        return tx;
    } catch (error) {
        if (error.code === 11000) {
            logger.debug(`Idempotent loyalty transaction skipped: ${idempotencyKey}`, { event: 'LOYALTY_IDEMPOTENCY_HIT', idempotencyKey });
            return null; // Idempotency key conflict means already executed
        }
        logger.error(`Ledger transaction failed`, { event: 'LOYALTY_TRANSACTION_FAILED', idempotencyKey, error: error.message });
        throw error;
    }
};

export const awardPointsForOrder = async (order, session = null) => {
    const eligibleSpend = calculateEligibleSpend(order);
    const points = calculatePointsForAmount(eligibleSpend);

    if (points <= 0) return null;

    const idempotencyKey = `ORDER_EARN_${order._id}`;
    
    const tx = await executeLedgerTransaction(
        order.userId._id || order.userId,
        'EARN',
        points,
        `Order ${order.orderNumber}`,
        idempotencyKey,
        { orderId: order._id },
        session
    );

    // Notify customer
    if (tx && tx.createdAt.getTime() === new Date().getTime()) {
        // Meaning it was just created (not returning an existing idempotent tx)
        createCustomerNotification({
            userId: order.userId._id || order.userId,
            type: 'LOYALTY_EARNED',
            title: 'Points Earned!',
            message: `You earned ${points} points for your order #${order.orderNumber}.`,
            idempotencyKey: `NOTIFY_${idempotencyKey}`
        }).catch(console.error);
    }

    return tx;
};

export const reversePointsForCancellation = async (order, session = null) => {
    const eligibleSpend = calculateEligibleSpend(order);
    const points = -Math.abs(calculatePointsForAmount(eligibleSpend)); // Ensure negative

    if (points !== 0) {
        const idempotencyKey = `CANCEL_REVERSAL_${order._id}`;
        await executeLedgerTransaction(
            order.userId._id || order.userId,
            'CANCELLATION_REVERSAL',
            points,
            `Cancellation of Order ${order.orderNumber}`,
            idempotencyKey,
            { orderId: order._id },
            session
        );
    }

    if (order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0) {
        const restoreKey = `RESTORE_REDEEM_CANCEL_${order._id}`;
        await executeLedgerTransaction(
            order.userId._id || order.userId,
            'CANCELLATION_REVERSAL',
            Math.abs(order.loyaltyPointsRedeemed),
            `Restored points from Cancelled Order ${order.orderNumber}`,
            restoreKey,
            { orderId: order._id },
            session
        );
        logger.info(`Redeemed points reversed for cancelled order ${order.orderNumber}`, { event: 'LOYALTY_REDEEM_REVERSED', orderId: order._id, points: order.loyaltyPointsRedeemed });
    }
    
    return true;
};

export const reversePointsForReturn = async (order, returnRequest, refundedAmount, session = null) => {
    // We will just reverse 1 point per $1 of the requested refund amount.
    const points = -Math.abs(calculatePointsForAmount(refundedAmount));

    if (points !== 0) {
        const idempotencyKey = `RETURN_REVERSAL_${returnRequest._id}`;
        await executeLedgerTransaction(
            order.userId._id || order.userId,
            'REFUND_REVERSAL',
            points,
            `Return for Order ${order.orderNumber}`,
            idempotencyKey,
            { 
                orderId: order._id,
                returnRequestId: returnRequest._id 
            },
            session
        );
    }

    if (order.loyaltyPointsRedeemed && order.loyaltyPointsRedeemed > 0) {
        const eligibleSpend = calculateEligibleSpend(order);
        const proportion = eligibleSpend > 0 ? Math.min(1, refundedAmount / eligibleSpend) : 0;
        const pointsToRestore = Math.floor(order.loyaltyPointsRedeemed * proportion);
        
        if (pointsToRestore > 0) {
            const restoreKey = `RESTORE_REDEEM_RETURN_${returnRequest._id}`;
            await executeLedgerTransaction(
                order.userId._id || order.userId,
                'REFUND_REVERSAL',
                pointsToRestore,
                `Restored points from Return for Order ${order.orderNumber}`,
                restoreKey,
                { orderId: order._id, returnRequestId: returnRequest._id },
                session
            );
            logger.info(`Proportional redeemed points reversed for return ${returnRequest._id}`, { event: 'LOYALTY_REDEEM_REVERSED', returnRequestId: returnRequest._id, points: pointsToRestore });
        }
    }

    return true;
};

export const adminAdjustPoints = async (userId, adminId, points, notes) => {
    // Prevent duplicate adjustments within 5 seconds for the same user, same points
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentDuplicate = await LoyaltyTransaction.findOne({
        userId,
        type: 'ADMIN_ADJUSTMENT',
        points: parseInt(points, 10),
        createdAt: { $gte: fiveSecondsAgo }
    });
    
    if (recentDuplicate) {
        throw new Error('Duplicate admin adjustment detected. Please wait before submitting again.');
    }

    const idempotencyKey = `ADMIN_ADJUST_${adminId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return await executeLedgerTransaction(
        userId,
        'ADMIN_ADJUSTMENT',
        parseInt(points, 10),
        'Admin Manual Adjustment',
        idempotencyKey,
        { adminId, notes }
    );
};

export const redeemPointsForOrder = async (order, session = null) => {
    if (!order.loyaltyPointsRedeemed || order.loyaltyPointsRedeemed <= 0) return null;

    const idempotencyKey = `ORDER_REDEEM_${order._id}`;
    
    const tx = await executeLedgerTransaction(
        order.userId._id || order.userId,
        'REDEEM',
        -Math.abs(order.loyaltyPointsRedeemed),
        `Redeemed on Order ${order.orderNumber}`,
        idempotencyKey,
        { orderId: order._id },
        session
    );

    if (tx) {
        logger.info(`Points redeemed for order ${order.orderNumber}`, { event: 'LOYALTY_REDEEMED', orderId: order._id, points: order.loyaltyPointsRedeemed });
    }
    return tx;
};
