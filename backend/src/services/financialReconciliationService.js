import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Product from '../models/Product.js';
import CouponUsage from '../models/CouponUsage.js';
import mongoose from 'mongoose';

export const getReconciliationSummary = async () => {
    // Basic summary metrics
    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] } });
    const refundedOrders = await Order.countDocuments({ paymentStatus: { $in: ['refunded', 'partially_refunded'] } });

    // Aggregate total refunded amount
    const refundAggr = await Order.aggregate([
        { $unwind: "$refunds" },
        { $group: { _id: null, totalRefunded: { $sum: "$refunds.amount" } } }
    ]);
    const totalRefunded = refundAggr[0]?.totalRefunded || 0;

    // Detect critical and high anomalies dynamically using aggregation where possible
    const [
        missingPaymentRefs,
        overRefunded,
        missingRefundRefs,
        negativeInventory
    ] = await Promise.all([
        Order.countDocuments({ paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] }, razorpayPaymentId: { $exists: false } }),
        Order.aggregate([
            { $unwind: "$refunds" },
            { $group: { _id: "$_id", totalRefund: { $sum: "$refunds.amount" }, orderTotal: { $first: "$total" } } },
            { $match: { $expr: { $gt: ["$totalRefund", "$orderTotal"] } } }
        ]).then(res => res.length),
        Order.countDocuments({ paymentStatus: { $in: ['refunded', 'partially_refunded'] }, 'refunds.0': { $exists: false } }),
        Product.countDocuments({ stockQuantity: { $lt: 0 } })
    ]);

    const criticalIssues = overRefunded + negativeInventory;
    const highIssues = missingPaymentRefs + missingRefundRefs;

    return {
        totalOrders,
        paidOrders,
        refundedOrders,
        totalRefunded,
        criticalIssues,
        highIssues
    };
};

export const getAnomalies = async (page = 1, limit = 50, filters = {}) => {
    const anomalies = [];
    
    // Anomaly Type 1: PAID_ORDER_MISSING_PAYMENT_REFERENCE (HIGH)
    if (!filters.type || filters.type === 'PAID_ORDER_MISSING_PAYMENT_REFERENCE') {
        if (!filters.severity || filters.severity === 'HIGH') {
            const missingRefs = await Order.find({ 
                paymentStatus: { $in: ['paid', 'refunded', 'partially_refunded'] }, 
                razorpayPaymentId: { $exists: false } 
            }).limit(limit);

            missingRefs.forEach(order => {
                anomalies.push({
                    _id: `ANO-PAY-${order._id}`,
                    severity: 'HIGH',
                    type: 'PAID_ORDER_MISSING_PAYMENT_REFERENCE',
                    message: `Paid order #${order.orderNumber} is missing a Razorpay payment reference.`,
                    relatedModel: 'Order',
                    relatedId: order._id,
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt
                });
            });
        }
    }

    // Anomaly Type 2: OVER_REFUND (CRITICAL)
    if (!filters.type || filters.type === 'OVER_REFUND') {
        if (!filters.severity || filters.severity === 'CRITICAL') {
            const overRefundedOrders = await Order.aggregate([
                { $unwind: "$refunds" },
                { $group: { 
                    _id: "$_id", 
                    orderNumber: { $first: "$orderNumber" }, 
                    totalRefund: { $sum: "$refunds.amount" }, 
                    orderTotal: { $first: "$total" },
                    createdAt: { $first: "$createdAt" }
                } },
                { $match: { $expr: { $gt: ["$totalRefund", "$orderTotal"] } } },
                { $limit: limit }
            ]);

            overRefundedOrders.forEach(order => {
                anomalies.push({
                    _id: `ANO-OVREF-${order._id}`,
                    severity: 'CRITICAL',
                    type: 'OVER_REFUND',
                    message: `Order #${order.orderNumber} has total refunds ($${order.totalRefund}) exceeding original order total ($${order.orderTotal}).`,
                    relatedModel: 'Order',
                    relatedId: order._id,
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt
                });
            });
        }
    }

    // Anomaly Type 3: REFUND_WITHOUT_GATEWAY_REFERENCE (HIGH)
    if (!filters.type || filters.type === 'REFUND_WITHOUT_GATEWAY_REFERENCE') {
        if (!filters.severity || filters.severity === 'HIGH') {
            const missingRefundRefs = await Order.find({ 
                paymentStatus: { $in: ['refunded', 'partially_refunded'] }, 
                'refunds.0': { $exists: false } 
            }).limit(limit);

            missingRefundRefs.forEach(order => {
                anomalies.push({
                    _id: `ANO-NOREF-${order._id}`,
                    severity: 'HIGH',
                    type: 'REFUND_WITHOUT_GATEWAY_REFERENCE',
                    message: `Order #${order.orderNumber} is marked as refunded but has no refund records or gateway references.`,
                    relatedModel: 'Order',
                    relatedId: order._id,
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt
                });
            });
            
            // Also check ReturnRequests directly
            const badReturns = await ReturnRequest.find({
                status: 'refunded',
                refundReference: { $exists: false }
            }).limit(limit);
            
            badReturns.forEach(req => {
                anomalies.push({
                    _id: `ANO-RETREF-${req._id}`,
                    severity: 'HIGH',
                    type: 'REFUND_WITHOUT_GATEWAY_REFERENCE',
                    message: `Return request for order #${req.orderNumber} is marked as refunded but has no gateway reference.`,
                    relatedModel: 'ReturnRequest',
                    relatedId: req._id,
                    orderNumber: req.orderNumber,
                    createdAt: req.createdAt
                });
            });
        }
    }

    // Anomaly Type 4: INVALID_RETURN_STATE (WARNING)
    if (!filters.type || filters.type === 'INVALID_RETURN_STATE') {
        if (!filters.severity || filters.severity === 'WARNING') {
            const badStateReturns = await ReturnRequest.find({
                status: 'refunded',
                receivedAt: { $exists: false }
            }).limit(limit);

            badStateReturns.forEach(req => {
                anomalies.push({
                    _id: `ANO-RETST-${req._id}`,
                    severity: 'WARNING',
                    type: 'INVALID_RETURN_STATE',
                    message: `Return request for order #${req.orderNumber} was refunded without being marked as received.`,
                    relatedModel: 'ReturnRequest',
                    relatedId: req._id,
                    orderNumber: req.orderNumber,
                    createdAt: req.createdAt
                });
            });
        }
    }

    // Anomaly Type 5: INVENTORY_NEGATIVE (CRITICAL)
    if (!filters.type || filters.type === 'INVENTORY_NEGATIVE') {
        if (!filters.severity || filters.severity === 'CRITICAL') {
            const negativeStock = await Product.find({ stockQuantity: { $lt: 0 } }).limit(limit);

            negativeStock.forEach(product => {
                anomalies.push({
                    _id: `ANO-INV-${product._id}`,
                    severity: 'CRITICAL',
                    type: 'INVENTORY_NEGATIVE',
                    message: `Product ${product.name} (SKU: ${product.sku}) has negative stock (${product.stockQuantity}).`,
                    relatedModel: 'Product',
                    relatedId: product._id,
                    orderNumber: 'N/A',
                    createdAt: product.updatedAt
                });
            });
        }
    }
    
    // Sort anomalies by date descending (in memory sort since they come from multiple collections)
    anomalies.sort((a, b) => b.createdAt - a.createdAt);
    
    // Since we gather multiple types, manual pagination is required over the combined array
    const startIndex = (page - 1) * limit;
    const paginatedAnomalies = anomalies.slice(startIndex, startIndex + limit);
    
    return {
        anomalies: paginatedAnomalies,
        pagination: {
            total: anomalies.length, // Approximate total of detected up to limit
            page,
            limit,
            pages: Math.ceil(anomalies.length / limit)
        }
    };
};
