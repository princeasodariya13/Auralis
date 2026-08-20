import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { calculateCheckoutTotals } from '../services/discountService.js';
import { createCustomerNotification } from '../services/customerNotificationService.js';
import { executeFullRefundAndRestock } from '../services/refundService.js';
import { logger } from '../utils/logger.js';

const generateOrderNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `AUR-${date}-${randomStr}`;
};

// @desc    Preview checkout totals
// @route   POST /api/v1/checkout/preview
export const previewCheckout = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Cart is empty' }});
        }

        const productIds = cart.items.map(i => i.productId);
        const products = await Product.find({ id: { $in: productIds } });

        let subtotal = 0;
        const items = [];

        for (const cartItem of cart.items) {
            const product = products.find(p => p.id === cartItem.productId);
            
            // If product was completely deleted from DB, it's a stale cart item that the frontend 
            // has already hidden from the user. We must safely skip it to prevent soft-locking.
            if (!product) continue; 
            
            if (!product.isActive) {
                return res.status(400).json({ success: false, error: { message: `Product "${product.name}" is no longer available for purchase` }});
            }

            if (cartItem.quantity > product.stockQuantity) {
                return res.status(400).json({ success: false, error: { message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available.` }});
            }

            const lineTotal = product.price * cartItem.quantity;
            subtotal += lineTotal;

            items.push({
                productId: product.id,
                productName: product.name,
                productImage: product.image,
                quantity: cartItem.quantity,
                unitPrice: product.price,
                lineTotal
            });
        }

        if (items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Your cart contains no valid items' }});
        }

        const { couponCode, pointsToRedeem } = req.body || {};
        const totals = await calculateCheckoutTotals(subtotal, couponCode, req.user._id, parseInt(pointsToRedeem) || 0);

        res.json({
            success: true,
            data: {
                items,
                ...totals,
                currency: 'INR'
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error generating preview' }});
    }
};

// @desc    Create new order
// @route   POST /api/v1/orders
export const createOrder = async (req, res) => {
    try {
        const { addressId, couponCode, pointsToRedeem } = req.body;

        if (!addressId) {
            return res.status(400).json({ success: false, error: { message: 'Shipping address is required' }});
        }

        // 1. Verify Address
        const address = await Address.findOne({ _id: addressId, userId: req.user._id });
        if (!address) {
            return res.status(403).json({ success: false, error: { message: 'Invalid address or unauthorized' }});
        }

        // 2. Verify Cart
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Cart is empty' }});
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 3. Lock user to serialize checkouts for this user
            await mongoose.model('User').findOneAndUpdate(
                { _id: req.user._id },
                { $currentDate: { updatedAt: true } },
                { session, new: true }
            );

            // 4. Fetch real products and calculate totals
            const productIds = cart.items.map(i => i.productId);
            const products = await Product.find({ id: { $in: productIds } }).session(session);

        let subtotal = 0;
        const items = [];

        // Concurrency/Reservation note: 
        // We validate stock here, but we do NOT permanently decrement it yet.
        // Razorpay flow will implement safe temporary reservation or decrement upon successful payment hook.
        // For now, this just guarantees they can't create an order if stock is literally already 0.

        for (const cartItem of cart.items) {
            const product = products.find(p => p.id === cartItem.productId);
            
            // Skip products that were deleted from DB (handled on frontend by cartController hiding them)
            if (!product) continue;

            if (!product.isActive) {
                return res.status(400).json({ success: false, error: { message: `Product "${product.name}" is no longer available for purchase` }});
            }

            if (cartItem.quantity > product.stockQuantity) {
                return res.status(400).json({ success: false, error: { message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available.` }});
            }

            const lineTotal = product.price * cartItem.quantity;
            subtotal += lineTotal;

            items.push({
                productId: product.id,
                productName: product.name,
                productImage: product.image,
                quantity: cartItem.quantity,
                unitPrice: product.price,
                lineTotal
            });
        }

        if (items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Your cart contains no valid items' }});
        }

        const totals = await calculateCheckoutTotals(subtotal, couponCode, req.user._id, parseInt(pointsToRedeem) || 0, session);

        // 5. Create address snapshot
        const shippingAddressSnapshot = {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country
        };

        // 6. Generate unique order number
        let orderNumber = generateOrderNumber();
        let isUnique = false;
        let retries = 3;
        while (!isUnique && retries > 0) {
            const existing = await Order.findOne({ orderNumber });
            if (!existing) {
                isUnique = true;
            } else {
                orderNumber = generateOrderNumber();
                retries--;
            }
        }

        if (!isUnique) {
            throw new Error('Failed to generate unique order number');
        }

        // 7. Save order
        const orderArr = await Order.create([{
            userId: req.user._id,
            orderNumber,
            items,
            shippingAddress: shippingAddressSnapshot,
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount,
            loyaltyPointsRedeemed: totals.loyaltyPointsRedeemed || 0,
            loyaltyDiscount: totals.loyaltyDiscount || 0,
            shippingCost: totals.shippingCost,
            tax: totals.tax,
            total: totals.total,
            currency: 'INR',
            couponCode: totals.coupon?.code || null,
            couponId: totals.coupon?._id || null,
            discountType: totals.coupon?.discountType || null,
            discountValue: totals.coupon?.discountValue || null,
            paymentStatus: 'pending',
            orderStatus: 'pending_payment'
        }], { session });
        const order = orderArr[0];
        
        logger.info(`Order ${order.orderNumber} created successfully`, { event: 'ORDER_CREATED', orderId: order._id, userId: req.user._id, total: order.total });

        // 8. Cart preservation
        // Intentionally NOT clearing the cart here. Cart will be cleared after successful payment in Step 10.

        await session.commitTransaction();
        session.endSession();

        // 9. Trigger customer notification securely (post-transaction)
        createCustomerNotification({
            userId: req.user._id,
            type: 'ORDER_PLACED',
            title: 'Order Placed successfully',
            message: `Your order #${orderNumber} has been placed and is pending payment.`,
            orderNumber: orderNumber,
            idempotencyKey: `ORDER_PLACED_${order._id}`
        }).catch(console.error);

        res.status(201).json({ success: true, data: order });

        } catch (txnError) {
            await session.abortTransaction();
            session.endSession();
            throw txnError;
        }

    } catch (error) {
        if (error.message.includes('Invalid coupon') || error.message.includes('Coupon') || error.message.includes('order value') || error.message.includes('Failed to generate unique order number')) {
            logger.warn('Order creation validation failed', { event: 'ORDER_CREATION_VALIDATION_FAILED', error: error.message });
            return res.status(400).json({ success: false, error: { message: error.message }});
        }
        logger.error('Order creation failed', { event: 'ORDER_CREATION_FAILED', error: error.message });
        res.status(500).json({ success: false, error: { message: 'Server error creating order' }});
    }
};

// @desc    Get user orders
// @route   GET /api/v1/orders
export const getMyOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        
        // Safety bounds for pagination
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(Math.max(1, limit), 50);
        
        const startIndex = (safePage - 1) * safeLimit;
        
        const total = await Order.countDocuments({ userId: req.user._id });
        
        const orders = await Order.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(safeLimit)
            .lean();
            
        res.json({ 
            success: true, 
            data: {
                orders,
                pagination: {
                    total,
                    page: safePage,
                    limit: safeLimit,
                    pages: Math.ceil(total / safeLimit)
                }
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving orders' }});
    }
};

// @desc    Get order by order number
// @route   GET /api/v1/orders/:orderNumber
export const getOrderByNumber = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber, userId: req.user._id }).lean();
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving order' }});
    }
};

// @desc    Cancel an order
// @route   POST /api/v1/orders/:orderNumber/cancel
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber, userId: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }
        
        // Only allow cancellation if pending or processing
        if (!['pending_payment', 'processing'].includes(order.orderStatus)) {
            return res.status(400).json({ success: false, error: { message: `Order cannot be cancelled in ${order.orderStatus} status` }});
        }
        
        if (order.paymentStatus === 'paid') {
            await executeFullRefundAndRestock(order._id, req.user._id);
        }

        await Order.updateOne({ _id: order._id }, { $set: { orderStatus: 'cancelled' } });
        
        createCustomerNotification({
            userId: req.user._id,
            type: 'ORDER_CANCELLED',
            title: 'Order Cancelled',
            message: `Your order #${order.orderNumber} has been successfully cancelled and your payment has been refunded.`,
            orderNumber: order.orderNumber,
            idempotencyKey: `ORDER_CANCELLED_${order._id}`
        }).catch(console.error);

        res.json({ success: true, data: order });
    } catch (error) {
        logger.error('Cancel order failed', { event: 'ORDER_CANCELLATION_FAILED', error: error.message, orderNumber: req.params.orderNumber });
        res.status(500).json({ success: false, error: { message: 'Server error cancelling order' }});
    }
};
