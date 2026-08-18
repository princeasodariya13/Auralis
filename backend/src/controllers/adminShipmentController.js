import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import { recordAdminAction } from '../services/adminAuditService.js';
import { createCustomerNotification } from '../services/customerNotificationService.js';

const VALID_SHIPMENT_TRANSITIONS = {
    'created': ['packed', 'cancelled'],
    'packed': ['handed_to_carrier', 'cancelled'],
    'handed_to_carrier': ['in_transit', 'delivery_failed', 'cancelled'],
    'in_transit': ['out_for_delivery', 'delivery_failed', 'cancelled'],
    'out_for_delivery': ['delivered', 'delivery_failed', 'cancelled'],
    'delivered': ['returned_to_sender'],
    'delivery_failed': ['returned_to_sender', 'cancelled'],
    'returned_to_sender': [],
    'cancelled': []
};

// Valid Tracking URL check
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

// @desc    Get shipments by order number
// @route   GET /api/v1/admin/orders/:orderNumber/shipments
// @access  Private/Admin
export const getAdminShipments = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select('_id');
        if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' }});

        const shipments = await Shipment.find({ orderId: order._id })
            .populate('events.adminId', 'name');
        
        res.json({ success: true, data: shipments });
    } catch (error) {
        console.error(`Error in getAdminShipments: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving shipments' }});
    }
};

// @desc    Create a new shipment
// @route   POST /api/v1/admin/orders/:orderNumber/shipments
// @access  Private/Admin
export const createAdminShipment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { carrier, trackingNumber, trackingUrl, estimatedDeliveryDate, items } = req.body;
        
        if (!carrier || carrier.trim() === '') {
            throw new Error('Carrier is required');
        }
        
        if (trackingUrl && !isValidUrl(trackingUrl)) {
            throw new Error('Invalid tracking URL');
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Shipment must contain at least one item');
        }

        const order = await Order.findOne({ orderNumber: req.params.orderNumber }).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.paymentStatus !== 'paid') {
            throw new Error('Cannot ship unpaid order');
        }
        
        if (['cancelled'].includes(order.orderStatus)) {
            throw new Error('Order is cancelled');
        }

        // Fetch existing shipments to calculate remaining quantities
        const existingShipments = await Shipment.find({ orderId: order._id, status: { $ne: 'cancelled' } }).session(session);
        
        const shippedQuantities = {};
        for (const shipment of existingShipments) {
            for (const item of (shipment.items || [])) {
                shippedQuantities[item.productId] = (shippedQuantities[item.productId] || 0) + item.quantity;
            }
        }
        
        const shipmentItems = [];
        for (const item of items) {
            const { productId, quantity } = item;
            if (!quantity || quantity <= 0) {
                throw new Error(`Invalid quantity for product ID ${productId}`);
            }
            
            const orderItem = order.items.find(i => i.productId === productId);
            if (!orderItem) {
                throw new Error(`Product ID ${productId} not found in this order`);
            }
            
            const alreadyShipped = shippedQuantities[productId] || 0;
            const remaining = orderItem.quantity - alreadyShipped;
            
            if (quantity > remaining) {
                throw new Error(`Cannot ship ${quantity} of ${orderItem.productName}. Only ${remaining} remaining.`);
            }
            
            shipmentItems.push({
                productId: orderItem.productId,
                productName: orderItem.productName,
                productImage: orderItem.productImage,
                quantity
            });
        }

        const shipment = await Shipment.create([{
            orderId: order._id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            carrier,
            trackingNumber,
            trackingUrl,
            estimatedDeliveryDate,
            items: shipmentItems,
            status: 'created',
            events: [{
                status: 'created',
                note: 'Shipment created',
                adminId: req.user._id
            }]
        }], { session });

        const createdShipment = shipment[0];

        // Audit Log
        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SHIPMENT_CREATED',
            resourceType: 'Shipment',
            resourceId: createdShipment._id,
            newState: { carrier, trackingNumber, status: 'created', items: shipmentItems },
            metadata: { orderNumber: order.orderNumber }
        });
        
        await session.commitTransaction();
        session.endSession();

        // Trigger Notification outside transaction
        createCustomerNotification({
            userId: order.userId,
            type: 'SHIPMENT_CREATED',
            title: 'Shipment Created',
            message: `A shipment for your order #${order.orderNumber} is being prepared via ${carrier}.`,
            orderNumber: order.orderNumber,
            idempotencyKey: `SHIPMENT_CREATED_${createdShipment._id}`
        }).catch(console.error);

        res.status(201).json({ success: true, data: createdShipment });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(`Error in createAdminShipment: ${error.message}`);
        
        if (error.message.includes('not found') || error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('Cannot ship') || error.message.includes('cancelled')) {
            return res.status(400).json({ success: false, error: { message: error.message }});
        }
        
        res.status(500).json({ success: false, error: { message: 'Server error creating shipment' }});
    }
};

// @desc    Update a shipment
// @route   PATCH /api/v1/admin/shipments/:shipmentId
// @access  Private/Admin
export const updateAdminShipment = async (req, res) => {
    try {
        const { carrier, trackingNumber, trackingUrl, estimatedDeliveryDate, status, note } = req.body;
        
        const shipment = await Shipment.findById(req.params.shipmentId);
        if (!shipment) return res.status(404).json({ success: false, error: { message: 'Shipment not found' }});

        const order = await Order.findById(shipment.orderId);
        if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' }});

        const updates = {};
        let statusChanged = false;

        if (carrier && carrier.trim() !== '') updates.carrier = carrier;
        if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
        if (trackingUrl !== undefined) {
            if (trackingUrl && !isValidUrl(trackingUrl)) {
                return res.status(400).json({ success: false, error: { message: 'Invalid tracking URL' }});
            }
            updates.trackingUrl = trackingUrl;
        }
        if (estimatedDeliveryDate !== undefined) updates.estimatedDeliveryDate = estimatedDeliveryDate;

        if (status && status !== shipment.status) {
            const allowedTransitions = VALID_SHIPMENT_TRANSITIONS[shipment.status];
            if (!allowedTransitions || !allowedTransitions.includes(status)) {
                return res.status(409).json({ success: false, error: { message: `Invalid shipment status transition from ${shipment.status} to ${status}` }});
            }
            updates.status = status;
            statusChanged = true;
        }

        // Apply updates
        Object.assign(shipment, updates);

        if (statusChanged) {
            shipment.events.push({
                status,
                note: note || `Status updated to ${status}`,
                adminId: req.user._id
            });
        }

        await shipment.save();

        // If shipment is delivered, update order status if not already delivered
        if (status === 'delivered' && order.orderStatus !== 'delivered') {
            order.orderStatus = 'delivered';
            await order.save();
        }

        // If shipment is in transit, update order status to shipped if pending/processing
        if (['in_transit', 'handed_to_carrier'].includes(status) && ['pending_payment', 'processing'].includes(order.orderStatus)) {
            order.orderStatus = 'shipped';
            await order.save();
        }

        // Audit Log
        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SHIPMENT_UPDATED',
            resourceType: 'Shipment',
            resourceId: shipment._id,
            previousState: { status: shipment.status },
            newState: updates,
            metadata: { orderNumber: shipment.orderNumber }
        });

        // Notifications
        if (statusChanged) {
            let type = 'SHIPMENT_UPDATE';
            let title = 'Shipment Update';
            let message = `Your shipment for order #${shipment.orderNumber} is now ${status.replace(/_/g, ' ')}.`;

            if (status === 'in_transit') {
                type = 'SHIPMENT_IN_TRANSIT';
                title = 'Order Shipped';
                message = `Your order #${shipment.orderNumber} is now in transit via ${shipment.carrier}.`;
            } else if (status === 'out_for_delivery') {
                type = 'OUT_FOR_DELIVERY';
                title = 'Out for Delivery';
                message = `Your order #${shipment.orderNumber} is out for delivery today.`;
            } else if (status === 'delivered') {
                type = 'DELIVERED';
                title = 'Order Delivered';
                message = `Your order #${shipment.orderNumber} has been delivered!`;
            }

            createCustomerNotification({
                userId: shipment.userId,
                type,
                title,
                message,
                orderNumber: shipment.orderNumber,
                idempotencyKey: `SHIPMENT_${status.toUpperCase()}_${shipment._id}`
            }).catch(console.error);
        }

        res.json({ success: true, data: shipment });
    } catch (error) {
        console.error(`Error in updateAdminShipment: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error updating shipment' }});
    }
};
