import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpay.service.js';
import { sendOrderConfirmation, sendPaymentFailedNotification, sendInventoryAlert } from '../services/notificationService.js';
import { notifyPaymentSuccess, notifyPaymentFailed } from '../services/customerNotificationService.js';
import mongoose from 'mongoose';

// Helper function to safely fulfill an order
const fulfillOrder = async (order, razorpay_payment_id) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Atomic Inventory Deduction
        const productIds = order.items.map(item => item.productId);
        const products = await Product.find({ id: { $in: productIds } }).session(session);
        
        let inventorySufficient = true;
        let failingProduct = null;
        
        for (const item of order.items) {
            const product = products.find(p => p.id === item.productId);
            if (!product || product.stockQuantity < item.quantity) {
                inventorySufficient = false;
                failingProduct = product ? product.name : item.productName;
                break;
            }
        }
        
        if (!inventorySufficient) {
            await session.abortTransaction();
            session.endSession();
            
            // Re-fetch without transaction to update just the payment status
            const orderNoTx = await Order.findOne({ _id: order._id });
            orderNoTx.paymentStatus = 'paid';
            orderNoTx.razorpayPaymentId = razorpay_payment_id;
            orderNoTx.paymentVerifiedAt = new Date();
            orderNoTx.orderStatus = 'processing';
            await orderNoTx.save();
            
            return { success: true, inventoryIssue: true, message: `Payment successful but ${failingProduct} is out of stock. Support will contact you.` };
        }
        
        // Deduct inventory
        for (const item of order.items) {
            const product = products.find(p => p.id === item.productId);
            const oldStock = product.stockQuantity;
            product.stockQuantity -= item.quantity;
            await product.save({ session });
            
            await InventoryLog.create([{
                productId: product._id,
                sku: product.sku,
                type: 'sale',
                quantity: item.quantity,
                previousStock: oldStock,
                newStock: product.stockQuantity,
                reason: `Order ${order.orderNumber} fulfilled`,
                reference: order.orderNumber,
                performedBy: order.userId._id || order.userId // Handles populated or unpopulated user
            }], { session });

            if (product.stockQuantity === 0) {
                sendInventoryAlert(product, 'out_of_stock').catch(console.error);
            } else if (product.stockQuantity <= (process.env.LOW_STOCK_THRESHOLD || 5)) {
                sendInventoryAlert(product, 'low_stock').catch(console.error);
            }
        }
        
        // Update Order
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpay_payment_id;
        order.paymentVerifiedAt = new Date();
        order.orderStatus = 'processing';
        await order.save({ session });
        
        // Record Coupon Usage
        if (order.couponId && order.discountAmount > 0) {
            await CouponUsage.create([{
                couponId: order.couponId,
                userId: order.userId._id || order.userId,
                orderId: order._id,
                discountAmount: order.discountAmount
            }], { session });
            
            await Coupon.findByIdAndUpdate(
                order.couponId,
                { $inc: { usedCount: 1 } },
                { session }
            );
        }
        
        await OrderStatusHistory.create([{
            orderId: order._id,
            status: 'processing',
            notes: 'Payment verified and inventory deducted.',
            updatedBy: order.userId._id || order.userId,
            userType: 'customer'
        }], { session });
        
        // Clear Cart
        await Cart.findOneAndUpdate(
            { userId: order.userId._id || order.userId },
            { $set: { items: [] } },
            { session }
        );
        
        await session.commitTransaction();
        session.endSession();
        
        // Fire confirmation email safely in background
        sendOrderConfirmation(order, order.userId).catch(console.error);
        notifyPaymentSuccess(order).catch(console.error);

        return { success: true, inventoryIssue: false };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// @desc    Create Razorpay Order for an existing Auralis order
// @route   POST /api/v1/payments/create-order
export const createPaymentOrder = async (req, res) => {
    try {
        const { orderNumber } = req.body;
        
        if (!orderNumber) {
            return res.status(400).json({ success: false, error: { message: 'Order number is required' }});
        }
        
        const order = await Order.findOne({ orderNumber, userId: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }
        
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, error: { message: 'Order is already paid' }});
        }
        
        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({ success: false, error: { message: 'Order is cancelled' }});
        }
        
        // Ensure Razorpay keys are configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
             return res.status(500).json({ success: false, error: { message: 'Razorpay is not configured on the server' }});
        }

        // Create Razorpay order
        // Use INR for Razorpay. Since the store uses USD visually, we might need a conversion, 
        // but as per requirements, we will use INR directly or keep USD if Razorpay supports it.
        // Let's use 'INR' as requested: "Currency should be INR unless the existing business configuration explicitly says otherwise."
        // Auralis stores currency as 'USD' by default. Let's send USD to Razorpay, as Razorpay supports international payments, 
        // or just send 'INR' and pretend 1 USD = 1 INR for test mode?
        // Wait, the requirement says: "Currency should be INR unless the existing business configuration explicitly says otherwise."
        // The existing business config uses `currency: 'USD'`. I will use `order.currency`.
        const rzpOrder = await createRazorpayOrder(order.total, order.currency || 'INR', order.orderNumber);
        
        // Update Auralis order with Razorpay order ID
        order.razorpayOrderId = rzpOrder.id;
        await order.save();
        
        res.json({
            success: true,
            data: {
                razorpayOrderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                key: process.env.RAZORPAY_KEY_ID // fallback just in case frontend needs it from backend
            }
        });
        
    } catch (error) {
        console.error(`Create Payment Order Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Failed to initiate payment' }});
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/v1/payments/verify
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderNumber } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderNumber) {
            return res.status(400).json({ success: false, error: { message: 'Missing payment details' }});
        }
        
        const order = await Order.findOne({ orderNumber, userId: req.user._id }).populate('userId', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }
        
        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ success: false, error: { message: 'Order mismatch' }});
        }
        
        if (order.paymentStatus === 'paid') {
            return res.json({ success: true, message: 'Order was already paid' });
        }
        
        const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({ success: false, error: { message: 'Invalid payment signature' }});
        }
        
        const result = await fulfillOrder(order, razorpay_payment_id);
        
        if (result.inventoryIssue) {
            return res.status(200).json({ 
                success: true, 
                message: result.message,
                inventoryIssue: true
            });
        }
        
        res.json({ success: true, data: order });
        
    } catch (error) {
        console.error(`Verify Payment Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Failed to verify payment' }});
    }
};

// @desc    Razorpay Webhook Endpoint
// @route   POST /api/v1/payments/webhook
export const handleWebhook = async (req, res) => {
    // Note: This endpoint must receive raw body to verify signature.
    // The routing layer should use express.raw({ type: 'application/json' }) for this route.
    
    try {
        const signature = req.headers['x-razorpay-signature'];
        
        if (!signature) {
            return res.status(400).send('Missing signature');
        }
        
        const isValid = verifyWebhookSignature(req.body, signature);
        
        if (!isValid) {
            return res.status(400).send('Invalid signature');
        }
        
        // Since body is raw buffer, parse it now
        const payload = JSON.parse(req.body.toString());
        
        if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
            const paymentEntity = payload.payload.payment.entity;
            const rzpOrderId = paymentEntity.order_id;
            
            // Find the order and populate user for email
            const order = await Order.findOne({ razorpayOrderId: rzpOrderId }).populate('userId', 'name email');
            
            if (order && order.paymentStatus !== 'paid') {
                // Background idempotent fulfillment using the shared robust logic
                await fulfillOrder(order, paymentEntity.id);
            }
        } else if (payload.event === 'payment.failed') {
            const paymentEntity = payload.payload.payment.entity;
            const rzpOrderId = paymentEntity.order_id;
            const order = await Order.findOne({ razorpayOrderId: rzpOrderId }).populate('userId', 'name email');
            
            if (order && order.paymentStatus === 'pending') {
                // Update to failed
                order.paymentStatus = 'failed';
                await order.save();
                
                await OrderStatusHistory.create({
                    orderId: order._id,
                    status: order.orderStatus,
                    notes: 'Payment failed via webhook.',
                    updatedBy: order.userId._id,
                    userType: 'customer'
                });
                
                sendPaymentFailedNotification(order, order.userId).catch(console.error);
                notifyPaymentFailed(order).catch(console.error);
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Server Error');
    }
};
