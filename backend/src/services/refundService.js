import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import { createRazorpayRefund } from './razorpay.service.js';
import mongoose from 'mongoose';

/**
 * Execute a full refund and inventory restock for a cancelled order
 */
export const executeFullRefundAndRestock = async (orderId, adminId = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        // Only restock if order was 'processing' or beyond, meaning stock was deducted
        if (['processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
            // Restock inventory
            for (const item of order.items) {
                const product = await Product.findOne({ id: item.productId }).session(session);
                if (product) {
                    const oldStock = product.stockQuantity;
                    product.stockQuantity += item.quantity;
                    await product.save({ session });

                    await InventoryLog.create([{
                        productId: product._id,
                        sku: product.sku,
                        type: 'restock',
                        quantity: item.quantity,
                        previousStock: oldStock,
                        newStock: product.stockQuantity,
                        reason: `Order ${order.orderNumber} cancelled/returned`,
                        reference: order.orderNumber,
                        performedBy: adminId || order.userId
                    }], { session });
                }
            }
        }

        // Refund payment if paid
        if (order.paymentStatus === 'paid' && order.razorpayPaymentId) {
            // Important: Call Razorpay API outside of transaction to avoid blocking,
            // or inside if we know it's fast. Razorpay calls can take time.
            // Better to commit transaction if Razorpay succeeds.
            const refund = await createRazorpayRefund(
                order.razorpayPaymentId, 
                order.total, 
                `REFUND_${order.orderNumber}`
            );
            
            order.paymentStatus = 'refunded';
            // order.orderStatus = 'cancelled'; // Handled by caller
            await order.save({ session });
        }

        await session.commitTransaction();
        session.endSession();
        return true;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('executeFullRefundAndRestock Error:', error);
        throw error;
    }
};

/**
 * Calculate the accurate refund amount for a set of returned items
 * Applies proportional discount and tax deduction.
 * Shipping is non-refundable.
 */
export const calculateRefundAmount = (order, returnItems) => {
    let rawItemTotal = 0;
    
    // Map of order items for quick lookup
    const orderItemsMap = {};
    for (const item of order.items) {
        orderItemsMap[item.productId] = item;
    }

    for (const ri of returnItems) {
        const oi = orderItemsMap[ri.productId];
        if (!oi) throw new Error(`Product ${ri.productId} not found in order`);
        if (ri.quantity > oi.quantity) throw new Error(`Cannot return more than purchased quantity for product ${ri.productId}`);
        
        rawItemTotal += oi.unitPrice * ri.quantity;
    }

    // Proportion of this return relative to the whole order's original subtotal
    const proportion = rawItemTotal / order.subtotal;

    // Prorate discount
    const proratedDiscount = order.discountAmount * proportion;

    // The subtotal of the returned items after their portion of the discount
    const discountedItemTotal = rawItemTotal - proratedDiscount;

    // Prorate tax (tax rate is calculated on the discounted subtotal historically)
    let taxRate = 0;
    if (order.subtotal > order.discountAmount) {
        taxRate = order.tax / (order.subtotal - order.discountAmount);
    }
    
    const proratedTax = discountedItemTotal * taxRate;

    // Total refund is the discounted item total + the prorated tax. Shipping is not refunded.
    let totalRefund = discountedItemTotal + proratedTax;
    
    // Ensure we never refund more than the total order amount
    totalRefund = Math.min(totalRefund, order.total);

    // Format to 2 decimal places
    return Number(totalRefund.toFixed(2));
};
