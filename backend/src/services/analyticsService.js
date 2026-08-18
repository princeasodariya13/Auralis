import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const getBusinessAnalytics = async (range) => {
    const now = new Date();
    let startDate;
    
    switch(range) {
        case 'today': 
            startDate = new Date(now.setHours(0,0,0,0)); 
            break;
        case '7d': 
            startDate = new Date(new Date().setDate(now.getDate() - 7)); 
            break;
        case '30d': 
            startDate = new Date(new Date().setDate(now.getDate() - 30)); 
            break;
        case 'year': 
            startDate = new Date(now.getFullYear(), 0, 1); 
            break;
        case 'all':
        default: 
            startDate = new Date(0); 
            break;
    }

    // 1. Revenue & Orders
    const orderMetrics = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                successfulOrders: {
                    $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] }
                },
                failedOrders: {
                    $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] }
                },
                pendingOrders: {
                    $sum: { $cond: [{ $in: ["$paymentStatus", ["pending", "pending_payment"]] }, 1, 0] }
                },
                totalRevenue: {
                    $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] }
                },
                totalDiscounts: {
                    $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$discountAmount", 0] }
                }
            }
        }
    ]);

    // 2. Customers
    const newCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: startDate }
    });
    
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 3. Products
    const productsStats = await Product.aggregate([
        {
            $facet: {
                total: [{ $count: "count" }],
                outOfStock: [{ $match: { stockQuantity: 0 } }, { $count: "count" }],
                lowStock: [
                    { 
                        $match: { 
                            $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
                            stockQuantity: { $gt: 0 }
                        } 
                    }, 
                    { $count: "count" }
                ]
            }
        }
    ]);

    // 4. Best Selling Products (Derived from fulfilled orders in the period)
    const bestSellers = await Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                name: { $first: "$items.productName" },
                quantitySold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
    ]);
    
    // 5. Revenue Over Time (Daily for <= 30d, Monthly for > 30d)
    let timeGroup = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    if (range === 'year' || range === 'all') {
        timeGroup = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    }
    
    const revenueOverTime = await Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: timeGroup,
                revenue: { $sum: "$total" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // 6. Operational Health
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();

    return {
        period: range,
        revenue: orderMetrics[0]?.totalRevenue || 0,
        orders: {
            total: orderMetrics[0]?.totalOrders || 0,
            successful: orderMetrics[0]?.successfulOrders || 0,
            failed: orderMetrics[0]?.failedOrders || 0,
            pending: orderMetrics[0]?.pendingOrders || 0,
            avgOrderValue: orderMetrics[0]?.successfulOrders > 0 
                ? (orderMetrics[0]?.totalRevenue / orderMetrics[0]?.successfulOrders) 
                : 0
        },
        discounts: orderMetrics[0]?.totalDiscounts || 0,
        customers: {
            new: newCustomers,
            total: totalCustomers
        },
        inventory: {
            total: productsStats[0]?.total[0]?.count || 0,
            lowStock: productsStats[0]?.lowStock[0]?.count || 0,
            outOfStock: productsStats[0]?.outOfStock[0]?.count || 0
        },
        bestSellers,
        revenueOverTime,
        health: {
            dbStatus,
            uptime: Math.floor(uptime / 3600) + 'h ' + Math.floor((uptime % 3600) / 60) + 'm',
            nodeEnv: process.env.NODE_ENV
        }
    };
};
