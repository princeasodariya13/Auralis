import CustomerNotification from '../models/CustomerNotification.js';

/**
 * Safely create a customer notification without interrupting the main transaction.
 * Failures here are caught and logged, guaranteeing business continuity.
 */
export const createCustomerNotification = async ({ userId, type, title, message, orderNumber, idempotencyKey }) => {
    try {
        if (!userId) return;

        const BackgroundJob = (await import('../models/BackgroundJob.js')).default;
        
        const jobKey = idempotencyKey || `NOTIF_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await BackgroundJob.updateOne(
            { idempotencyKey: jobKey },
            { 
                $setOnInsert: {
                    type: 'CREATE_NOTIFICATION',
                    status: 'pending',
                    idempotencyKey: jobKey,
                    payload: { userId, type, title, message, orderNumber, idempotencyKey }
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error(`Failed to enqueue CustomerNotification (${type}):`, error.message);
    }
};

/**
 * Convenience methods for specific events
 */
export const notifyPaymentSuccess = async (order) => {
    await createCustomerNotification({
        userId: order.userId._id || order.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Your payment for order #${order.orderNumber} was successful. We are now preparing your items.`,
        orderNumber: order.orderNumber,
        idempotencyKey: `PAYMENT_SUCCESS_${order._id}`
    });
};

export const notifyPaymentFailed = async (order) => {
    await createCustomerNotification({
        userId: order.userId._id || order.userId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Your payment for order #${order.orderNumber} failed. Please try completing your checkout again.`,
        orderNumber: order.orderNumber,
        idempotencyKey: `PAYMENT_FAILED_${order._id}` // If multiple retries, we might want to notify each time, but this prevents webhook spam
    });
};

export const notifyOrderStatusChange = async (order, newStatus) => {
    let title = '';
    let message = '';
    let type = '';

    switch (newStatus) {
        case 'processing':
            title = 'Order Processing';
            message = `Your order #${order.orderNumber} is now being processed.`;
            type = 'ORDER_PROCESSING';
            break;
        case 'shipped':
            title = 'Order Shipped';
            message = `Great news! Your order #${order.orderNumber} has been shipped.`;
            type = 'ORDER_SHIPPED';
            break;
        case 'delivered':
            title = 'Order Delivered';
            message = `Your order #${order.orderNumber} has been delivered. Enjoy your premium audio gear!`;
            type = 'ORDER_DELIVERED';
            break;
        case 'cancelled':
            title = 'Order Cancelled';
            message = `Your order #${order.orderNumber} has been cancelled.`;
            type = 'ORDER_CANCELLED';
            break;
        default:
            return;
    }

    await createCustomerNotification({
        userId: order.userId._id || order.userId,
        type,
        title,
        message,
        orderNumber: order.orderNumber,
        idempotencyKey: `STATUS_${order._id}_${newStatus}`
    });
};
