import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import { calculateRefundAmount } from '../services/refundService.js';
import crypto from 'crypto';

const RETURN_WINDOW_DAYS = 30;

// @desc    Get eligibility for return for a specific order
// @route   GET /api/v1/returns/eligibility/:orderNumber
// @access  Private
export const getReturnEligibility = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber, userId: req.user._id });
        
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' } });
        }

        if (order.paymentStatus !== 'paid') {
            return res.json({ success: true, data: { eligible: false, reason: 'Order is not paid' } });
        }

        if (!['shipped', 'delivered'].includes(order.orderStatus)) {
            return res.json({ success: true, data: { eligible: false, reason: 'Order must be shipped or delivered to request a return.' } });
        }

        const now = new Date();
        const orderDate = new Date(order.createdAt);
        const diffDays = Math.ceil(Math.abs(now - orderDate) / (1000 * 60 * 60 * 24));

        if (diffDays > RETURN_WINDOW_DAYS) {
            return res.json({ success: true, data: { eligible: false, reason: `Return window of ${RETURN_WINDOW_DAYS} days has expired.` } });
        }

        // Find existing return requests to see which items have already been returned
        const existingReturns = await ReturnRequest.find({ orderId: order._id, status: { $ne: 'cancelled' } });
        
        const returnedQuantities = {};
        for (const req of existingReturns) {
            for (const item of req.items) {
                returnedQuantities[item.productId] = (returnedQuantities[item.productId] || 0) + item.quantity;
            }
        }

        const eligibleItems = order.items.map(item => {
            const returnedQty = returnedQuantities[item.productId] || 0;
            const returnableQty = item.quantity - returnedQty;
            return {
                productId: item.productId,
                productName: item.productName,
                productImage: item.productImage,
                purchasedQuantity: item.quantity,
                returnedQuantity: returnedQty,
                returnableQuantity: Math.max(0, returnableQty),
                unitPrice: item.unitPrice
            };
        });

        const canReturnAnything = eligibleItems.some(i => i.returnableQuantity > 0);

        if (!canReturnAnything) {
            return res.json({ success: true, data: { eligible: false, reason: 'All items in this order have already been returned or requested.' } });
        }

        res.json({
            success: true,
            data: {
                eligible: true,
                returnWindowDays: RETURN_WINDOW_DAYS,
                daysSincePurchase: diffDays,
                items: eligibleItems
            }
        });

    } catch (error) {
        console.error(`Get Return Eligibility Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving eligibility' } });
    }
};

// @desc    Create a return request
// @route   POST /api/v1/returns
// @access  Private
export const createReturnRequest = async (req, res) => {
    try {
        const { orderNumber, items, reason, customerNote } = req.body;

        if (!orderNumber || !items || !Array.isArray(items) || items.length === 0 || !reason) {
            return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
        }

        const order = await Order.findOne({ orderNumber, userId: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' } });
        }

        if (order.paymentStatus !== 'paid' || !['shipped', 'delivered'].includes(order.orderStatus)) {
            return res.status(400).json({ success: false, error: { message: 'Order is not eligible for return' } });
        }

        // Validate quantities
        const existingReturns = await ReturnRequest.find({ orderId: order._id, status: { $ne: 'cancelled' } });
        const returnedQuantities = {};
        for (const r of existingReturns) {
            for (const i of r.items) {
                returnedQuantities[i.productId] = (returnedQuantities[i.productId] || 0) + i.quantity;
            }
        }

        const requestedItems = [];
        for (const reqItem of items) {
            const orderItem = order.items.find(i => i.productId === reqItem.productId);
            if (!orderItem) {
                return res.status(400).json({ success: false, error: { message: `Product ${reqItem.productId} not found in order` } });
            }

            const alreadyReturned = returnedQuantities[reqItem.productId] || 0;
            const maxReturnable = orderItem.quantity - alreadyReturned;

            if (reqItem.quantity <= 0 || reqItem.quantity > maxReturnable) {
                return res.status(400).json({ success: false, error: { message: `Invalid return quantity for ${orderItem.productName}` } });
            }

            requestedItems.push({
                productId: reqItem.productId,
                quantity: reqItem.quantity,
                refundAmount: 0 // Will calculate total, item-level isn't strictly necessary but helpful. We'll set total.
            });
        }

        // Calculate secure total refund amount server-side
        const totalRefundAmount = calculateRefundAmount(order, requestedItems);

        // Generate Idempotency Key based on order and timestamp hash to prevent exact duplicate requests in tight loops
        const hashStr = items.map(i => `${i.productId}-${i.quantity}`).join('|');
        const idempotencyKey = crypto.createHash('sha256').update(`RETURN_${order._id}_${hashStr}_${Date.now()}`).digest('hex');

        const returnRequest = await ReturnRequest.create({
            userId: req.user._id,
            orderId: order._id,
            orderNumber: order.orderNumber,
            items: requestedItems,
            reason,
            customerNote,
            refundAmount: totalRefundAmount,
            idempotencyKey
        });

        res.status(201).json({ success: true, data: returnRequest });

    } catch (error) {
        console.error(`Create Return Request Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error creating return request' } });
    }
};

// @desc    Get my return requests
// @route   GET /api/v1/returns
// @access  Private
export const getMyReturns = async (req, res) => {
    try {
        const returns = await ReturnRequest.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: returns });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving returns' } });
    }
};

// @desc    Get return request details
// @route   GET /api/v1/returns/:id
// @access  Private
export const getReturnDetails = async (req, res) => {
    try {
        const returnRequest = await ReturnRequest.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!returnRequest) {
            return res.status(404).json({ success: false, error: { message: 'Return request not found' } });
        }

        res.json({ success: true, data: returnRequest });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving return details' } });
    }
};

// @desc    Cancel a return request
// @route   PATCH /api/v1/returns/:id/cancel
// @access  Private
export const cancelReturnRequest = async (req, res) => {
    try {
        const returnRequest = await ReturnRequest.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!returnRequest) {
            return res.status(404).json({ success: false, error: { message: 'Return request not found' } });
        }

        if (returnRequest.status !== 'requested') {
            return res.status(400).json({ success: false, error: { message: `Cannot cancel return request in ${returnRequest.status} state` } });
        }

        returnRequest.status = 'cancelled';
        await returnRequest.save();

        res.json({ success: true, data: returnRequest });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error cancelling return request' } });
    }
};
