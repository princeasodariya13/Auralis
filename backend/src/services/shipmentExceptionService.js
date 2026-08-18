import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';
import ShipmentException from '../models/ShipmentException.js';
import { createCustomerNotification } from './customerNotificationService.js';

// SLA thresholds in hours (Could be moved to env variables)
const SLA_THRESHOLDS = {
    CREATED: 48,
    PACKED: 24,
    IN_TRANSIT: 168 // 7 days
};

export const detectShipmentExceptions = async () => {
    console.log('[ShipmentExceptionService] Detecting shipment exceptions...');
    const now = new Date();

    // Find all active shipments
    const activeShipments = await Shipment.find({
        status: { $nin: ['delivered', 'cancelled', 'returned_to_sender'] }
    });

    for (const shipment of activeShipments) {
        let detectedType = null;
        let severity = 'LOW';

        // 1. DELIVERY_FAILED
        if (shipment.status === 'delivery_failed') {
            detectedType = 'DELIVERY_FAILED';
            severity = 'HIGH';
        } 
        // 2. OVERDUE_DELIVERY
        else if (shipment.estimatedDeliveryDate && new Date(shipment.estimatedDeliveryDate) < now) {
            detectedType = 'OVERDUE_DELIVERY';
            severity = 'MEDIUM';
        }
        // 3. STUCK_CREATED
        else if (shipment.status === 'created') {
            // Find when it was created
            const createdEvent = shipment.events.find(e => e.status === 'created');
            const eventTime = createdEvent ? createdEvent.createdAt : shipment.createdAt;
            if (now - new Date(eventTime) > SLA_THRESHOLDS.CREATED * 60 * 60 * 1000) {
                detectedType = 'STUCK_CREATED';
                severity = 'MEDIUM';
            }
        }
        // 4. STUCK_PACKED
        else if (shipment.status === 'packed') {
            const packedEvent = shipment.events.find(e => e.status === 'packed');
            const eventTime = packedEvent ? packedEvent.createdAt : shipment.updatedAt;
            if (now - new Date(eventTime) > SLA_THRESHOLDS.PACKED * 60 * 60 * 1000) {
                detectedType = 'STUCK_PACKED';
                severity = 'MEDIUM';
            }
        }
        // 5. STUCK_IN_TRANSIT
        else if (['handed_to_carrier', 'in_transit'].includes(shipment.status)) {
            const transitEvent = shipment.events.find(e => ['handed_to_carrier', 'in_transit'].includes(e.status));
            const eventTime = transitEvent ? transitEvent.createdAt : shipment.updatedAt;
            if (now - new Date(eventTime) > SLA_THRESHOLDS.IN_TRANSIT * 60 * 60 * 1000) {
                detectedType = 'STUCK_IN_TRANSIT';
                severity = 'HIGH';
            }
        }

        if (detectedType) {
            await createOrUpdateException({
                shipmentId: shipment._id,
                orderId: shipment.orderId,
                orderNumber: shipment.orderNumber,
                userId: shipment.userId,
                type: detectedType,
                severity
            });
        }
    }
    
    // Check for RETURNED_TO_SENDER - technically an active failure even if terminal for the shipment itself
    const returnedShipments = await Shipment.find({
        status: 'returned_to_sender'
    });
    // For returned_to_sender, we only want to flag if there's no exception yet
    for (const shipment of returnedShipments) {
        await createOrUpdateException({
            shipmentId: shipment._id,
            orderId: shipment.orderId,
            orderNumber: shipment.orderNumber,
            userId: shipment.userId,
            type: 'RETURNED_TO_SENDER',
            severity: 'CRITICAL'
        });
    }

    // PARTIAL_ORDER_DELAY
    // Find paid orders not cancelled/delivered
    const pendingOrders = await Order.find({
        paymentStatus: 'paid',
        orderStatus: { $nin: ['delivered', 'cancelled'] }
    });

    for (const order of pendingOrders) {
        // If order has been paid for over 3 days and not fully shipped
        if (now - new Date(order.createdAt) > 72 * 60 * 60 * 1000) {
            const orderShipments = await Shipment.find({ orderId: order._id, status: { $ne: 'cancelled' } });
            let totalShipped = 0;
            orderShipments.forEach(s => {
                (s.items || []).forEach(item => { totalShipped += item.quantity; });
            });
            
            const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0);
            
            if (totalShipped < totalOrdered) {
                await createOrUpdateException({
                    shipmentId: null,
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    userId: order.userId,
                    type: 'PARTIAL_ORDER_DELAY',
                    severity: 'LOW'
                });
            }
        }
    }
};

const createOrUpdateException = async (exceptionData) => {
    try {
        const query = {
            orderId: exceptionData.orderId,
            type: exceptionData.type,
            status: { $in: ['OPEN', 'ACKNOWLEDGED'] }
        };
        if (exceptionData.shipmentId) {
            query.shipmentId = exceptionData.shipmentId;
        }

        const existing = await ShipmentException.findOne(query);

        if (!existing) {
            const newException = await ShipmentException.create(exceptionData);
            
            // Trigger customer notification for certain types
            if (['DELIVERY_FAILED', 'RETURNED_TO_SENDER', 'OVERDUE_DELIVERY'].includes(exceptionData.type)) {
                let message = `Your shipment for order #${exceptionData.orderNumber} is facing an issue.`;
                if (exceptionData.type === 'DELIVERY_FAILED') message = `We were unable to deliver your Auralis shipment for order #${exceptionData.orderNumber}.`;
                if (exceptionData.type === 'RETURNED_TO_SENDER') message = `Your shipment for order #${exceptionData.orderNumber} is being returned to the sender.`;
                if (exceptionData.type === 'OVERDUE_DELIVERY') message = `Your Auralis shipment for order #${exceptionData.orderNumber} is taking longer than expected.`;

                createCustomerNotification({
                    userId: exceptionData.userId,
                    type: 'SHIPMENT_EXCEPTION',
                    title: 'Shipment Update',
                    message,
                    orderNumber: exceptionData.orderNumber,
                    idempotencyKey: `EXCEPTION_${newException._id}`
                }).catch(console.error);
            }
        }
    } catch (error) {
        // Ignore duplicate key errors just in case
        if (error.code !== 11000) {
            console.error('[ShipmentExceptionService] Error creating exception:', error);
        }
    }
};
