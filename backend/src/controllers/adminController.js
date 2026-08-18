import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Get admin dashboard metrics
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
export const getDashboard = async (req, res) => {
    try {
        // Run aggregations concurrently for performance
        const [
            totalCustomers,
            productsStats,
            ordersStats,
            recentOrders,
            lowStockProducts
        ] = await Promise.all([
            User.countDocuments({ role: 'customer' }),
            
            // Product metrics
            Product.aggregate([
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        active: [{ $match: { isActive: true } }, { $count: "count" }],
                        inactive: [{ $match: { isActive: false } }, { $count: "count" }],
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
            ]),
            
            // Order metrics
            Order.aggregate([
                {
                    $facet: {
                        totalOrders: [{ $count: "count" }],
                        pendingOrders: [{ $match: { orderStatus: { $in: ['pending_payment', 'processing'] } } }, { $count: "count" }],
                        shippedOrders: [{ $match: { orderStatus: 'shipped' } }, { $count: "count" }],
                        deliveredOrders: [{ $match: { orderStatus: 'delivered' } }, { $count: "count" }],
                        cancelledOrders: [{ $match: { orderStatus: 'cancelled' } }, { $count: "count" }],
                        
                        // Total Order Value (all non-cancelled orders)
                        totalOrderValue: [
                            { $match: { orderStatus: { $ne: 'cancelled' } } },
                            { $group: { _id: null, sum: { $sum: "$total" } } }
                        ],
                        
                        // Confirmed Revenue (only paid orders - which will be > 0 when Razorpay is added)
                        confirmedRevenue: [
                            { $match: { paymentStatus: 'paid' } },
                            { $group: { _id: null, sum: { $sum: "$total" } } }
                        ],
                        
                        // Today's orders
                        todaysOrders: [
                            { 
                                $match: { 
                                    createdAt: { 
                                        $gte: new Date(new Date().setHours(0,0,0,0)) 
                                    } 
                                } 
                            },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            
            // Recent orders (last 5)
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'name email')
                .lean(),
                
            // Specific low stock products for the dashboard section
            Product.find({ 
                $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
                isActive: true
            }).limit(5).select('name sku stockQuantity image').lean()
        ]);
        
        // Format product stats
        const pStats = productsStats[0];
        const productMetrics = {
            total: pStats.total[0]?.count || 0,
            active: pStats.active[0]?.count || 0,
            inactive: pStats.inactive[0]?.count || 0,
            outOfStock: pStats.outOfStock[0]?.count || 0,
            lowStock: pStats.lowStock[0]?.count || 0
        };
        
        // Format order stats
        const oStats = ordersStats[0];
        const orderMetrics = {
            total: oStats.totalOrders[0]?.count || 0,
            pending: oStats.pendingOrders[0]?.count || 0,
            shipped: oStats.shippedOrders[0]?.count || 0,
            delivered: oStats.deliveredOrders[0]?.count || 0,
            cancelled: oStats.cancelledOrders[0]?.count || 0,
            todaysOrders: oStats.todaysOrders[0]?.count || 0,
            totalOrderValue: oStats.totalOrderValue[0]?.sum || 0,
            confirmedRevenue: oStats.confirmedRevenue[0]?.sum || 0, // Should be 0 for now
        };
        
        orderMetrics.averageOrderValue = orderMetrics.total > 0 
            ? orderMetrics.totalOrderValue / (orderMetrics.total - orderMetrics.cancelled) 
            : 0;

        res.json({
            success: true,
            data: {
                customers: {
                    total: totalCustomers
                },
                products: productMetrics,
                orders: orderMetrics,
                recentOrders: recentOrders.map(order => ({
                    orderNumber: order.orderNumber,
                    customerName: order.userId?.name || 'Unknown',
                    total: order.total,
                    status: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    createdAt: order.createdAt
                })),
                lowStockProducts
            }
        });
        
    } catch (error) {
        console.error(`Admin Dashboard Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving dashboard data' }});
    }
};
