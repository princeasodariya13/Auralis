import { sendTransactionalEmail } from './emailService.js';
import * as templates from '../utils/emailTemplates.js';

/**
 * Send an Order Confirmation email (Triggered after successful payment verification)
 */
export const sendOrderConfirmation = async (order, user) => {
    if (!user || !user.email) return;
    
    const eventKey = \`ORDER_CONFIRMED_\${order._id}\`;
    const html = templates.orderConfirmationTemplate(order, user);
    
    await sendTransactionalEmail({
        to: user.email,
        subject: \`Auralis Order Confirmation: #\${order.orderNumber}\`,
        html,
        eventKey,
        eventType: 'order_confirmation'
    });
};

/**
 * Send an Order Status Update email (Triggered via Admin status change)
 */
export const sendOrderStatusUpdate = async (order, user, newStatus) => {
    if (!user || !user.email) return;
    
    const eventKey = \`ORDER_STATUS_\${order._id}_\${newStatus}\`;
    
    let statusText = '';
    let customMessage = '';
    
    switch (newStatus) {
        case 'shipped':
            statusText = 'Shipped';
            customMessage = 'Great news! Your order has been shipped and is on its way to you.';
            break;
        case 'delivered':
            statusText = 'Delivered';
            customMessage = 'Your order has been delivered. We hope you enjoy your premium audio experience.';
            break;
        case 'cancelled':
            statusText = 'Cancelled';
            customMessage = 'Your order has been cancelled. If you have any questions, please contact our support team.';
            break;
        case 'processing':
            // Usually we don't send processing manually as it's part of the confirmation, 
            // but if admin reverts back to processing, we could send an update.
            statusText = 'Processing';
            customMessage = 'Your order is currently being processed by our fulfillment team.';
            break;
        default:
            return; // Ignore other statuses
    }
    
    const html = templates.orderStatusTemplate(order, user, statusText, customMessage);
    
    await sendTransactionalEmail({
        to: user.email,
        subject: \`Auralis Order Update: \${statusText}\`,
        html,
        eventKey,
        eventType: \`order_\${newStatus}\`
    });
};

/**
 * Send a Payment Failure email (Triggered by webhook payment.failed)
 */
export const sendPaymentFailedNotification = async (order, user) => {
    if (!user || !user.email) return;
    
    const eventKey = \`PAYMENT_FAILED_\${order._id}\`;
    const html = templates.paymentFailedTemplate(order, user);
    
    await sendTransactionalEmail({
        to: user.email,
        subject: \`Action Required: Payment Failed for Order #\${order.orderNumber}\`,
        html,
        eventKey,
        eventType: 'payment_failed'
    });
};

/**
 * Send Inventory Alert to Admin (Triggered by inventory deduction)
 */
export const sendInventoryAlert = async (product, triggerType) => {
    // Determine admin email. 
    // In a real app, this might go to all users with role 'admin' or a specific config email.
    // For safety, we'll send it to a configured admin email or log if not set.
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@auralis.com';
    
    const eventKey = \`INV_ALERT_\${product._id}_\${triggerType}_\${product.stockQuantity}\`;
    const html = templates.inventoryAlertTemplate(product, triggerType);
    
    await sendTransactionalEmail({
        to: adminEmail,
        subject: \`Auralis Inventory Alert: \${product.name}\`,
        html,
        eventKey,
        eventType: \`inventory_alert_\${triggerType}\`
    });
};
