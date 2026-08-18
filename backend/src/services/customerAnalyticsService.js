import User from '../models/User.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
import SupportTicket from '../models/SupportTicket.js';
import Cart from '../models/Cart.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';

export const getCustomersIntelligence = async ({ search = '', segment = 'ALL', page = 1, limit = 20, sortField = 'createdAt', sortOrder = -1 }) => {
    // We only want to analyze customers (not admins)
    const matchStage = { role: 'customer' };
    
    if (search) {
        matchStage.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Build the aggregation pipeline
    const pipeline = [
        { $match: matchStage },
        // Lookup paid orders for this user
        {
            $lookup: {
                from: 'orders',
                let: { userId: '$_id' },
                pipeline: [
                    { 
                        $match: { 
                            $expr: { $eq: ['$userId', '$$userId'] },
                            paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] }
                        }
                    },
                    {
                        $project: { total: 1, createdAt: 1, paymentStatus: 1, refunds: 1 }
                    }
                ],
                as: 'paidOrders'
            }
        },
        // Calculate metrics
        {
            $addFields: {
                paidOrderCount: { $size: '$paidOrders' },
                lifetimeRevenue: {
                    $sum: {
                        $map: {
                            input: '$paidOrders',
                            as: 'order',
                            in: '$$order.total'
                        }
                    }
                },
                lastPurchaseDate: { $max: '$paidOrders.createdAt' },
                firstPurchaseDate: { $min: '$paidOrders.createdAt' }
            }
        },
        // Determine Segment deterministically
        {
            $addFields: {
                segment: {
                    $switch: {
                        branches: [
                            // VIP: >3 orders and >$1000 spent
                            { 
                                case: { $and: [{ $gt: ['$paidOrderCount', 3] }, { $gt: ['$lifetimeRevenue', 1000] }] }, 
                                then: 'VIP' 
                            },
                            // INACTIVE: Had orders but last purchase was > 180 days ago
                            { 
                                case: { 
                                    $and: [
                                        { $gt: ['$paidOrderCount', 0] },
                                        { $lt: ['$lastPurchaseDate', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)] }
                                    ]
                                }, 
                                then: 'INACTIVE' 
                            },
                            // AT_RISK: Had orders but last purchase was > 90 days ago
                            { 
                                case: { 
                                    $and: [
                                        { $gt: ['$paidOrderCount', 0] },
                                        { $lt: ['$lastPurchaseDate', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)] }
                                    ]
                                }, 
                                then: 'AT_RISK' 
                            },
                            // REPEAT: 2+ orders
                            { 
                                case: { $gte: ['$paidOrderCount', 2] }, 
                                then: 'REPEAT' 
                            },
                            // ONE_TIME: Exactly 1 order
                            { 
                                case: { $eq: ['$paidOrderCount', 1] }, 
                                then: 'ONE_TIME' 
                            }
                        ],
                        // NEW: 0 orders
                        default: 'NEW'
                    }
                }
            }
        }
    ];

    // Filter by segment if provided
    if (segment && segment !== 'ALL') {
        pipeline.push({ $match: { segment } });
    }

    // Determine sort
    const validSortFields = ['createdAt', 'paidOrderCount', 'lifetimeRevenue', 'lastPurchaseDate', 'name'];
    const sortObj = {};
    if (validSortFields.includes(sortField)) {
        sortObj[sortField] = parseInt(sortOrder) === 1 ? 1 : -1;
    } else {
        sortObj['createdAt'] = -1; // Default
    }

    // To get total count after segmentation filter, we need to facet or count
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const facetPipeline = [
        ...pipeline,
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $sort: sortObj },
                    { $skip: skip },
                    { $limit: parseInt(limit) },
                    { 
                        $project: { 
                            passwordHash: 0, 
                            paidOrders: 0 // Exclude raw orders array to save bandwidth
                        }
                    }
                ]
            }
        }
    ];

    const result = await User.aggregate(facetPipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const data = result[0].data;

    // Optional: decorate with return indicators or cart indicators efficiently 
    // for the fetched page only (to avoid heavy joins on the whole DB).
    const userIds = data.map(u => u._id);
    
    // Find active abandoned carts for these users
    const abandonedCarts = await Cart.find({
        userId: { $in: userIds },
        'items.0': { $exists: true }
    });
    const activeCartUserIds = new Set(abandonedCarts.map(c => c.userId.toString()));

    // Find return count
    const returnCounts = await ReturnRequest.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const returnMap = new Map();
    returnCounts.forEach(rc => returnMap.set(rc._id.toString(), rc.count));

    // Support tickets
    const ticketCounts = await SupportTicket.aggregate([
        { $match: { userId: { $in: userIds }, status: 'open' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const ticketMap = new Map();
    ticketCounts.forEach(tc => ticketMap.set(tc._id.toString(), tc.count));

    // Loyalty balances
    const loyaltyBalances = await LoyaltyTransaction.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', lastTx: { $first: '$$ROOT' } } }
    ]);
    const loyaltyMap = new Map();
    loyaltyBalances.forEach(lb => loyaltyMap.set(lb._id.toString(), lb.lastTx.balanceAfter));

    const enrichedData = data.map(user => ({
        ...user,
        averageOrderValue: user.paidOrderCount > 0 ? (user.lifetimeRevenue / user.paidOrderCount) : 0,
        hasAbandonedCart: activeCartUserIds.has(user._id.toString()),
        returnCount: returnMap.get(user._id.toString()) || 0,
        openSupportTickets: ticketMap.get(user._id.toString()) || 0,
        loyaltyBalance: loyaltyMap.get(user._id.toString()) || 0
    }));

    return {
        data: enrichedData,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
    };
};

export const getCustomerDetailIntelligence = async (userId) => {
    // Basic user info
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) throw new Error('Customer not found');

    // All paid orders for financial metrics
    const paidOrders = await Order.find({
        userId,
        paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] }
    }).sort({ createdAt: -1 });

    const paidOrderCount = paidOrders.length;
    const lifetimeRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = paidOrderCount > 0 ? lifetimeRevenue / paidOrderCount : 0;
    const firstPurchaseDate = paidOrderCount > 0 ? paidOrders[paidOrderCount - 1].createdAt : null;
    const lastPurchaseDate = paidOrderCount > 0 ? paidOrders[0].createdAt : null;

    // Segment logic
    let segment = 'NEW';
    const now = Date.now();
    if (paidOrderCount > 3 && lifetimeRevenue > 1000) {
        segment = 'VIP';
    } else if (paidOrderCount > 0 && lastPurchaseDate && (now - new Date(lastPurchaseDate).getTime() > 180 * 24 * 60 * 60 * 1000)) {
        segment = 'INACTIVE';
    } else if (paidOrderCount > 0 && lastPurchaseDate && (now - new Date(lastPurchaseDate).getTime() > 90 * 24 * 60 * 60 * 1000)) {
        segment = 'AT_RISK';
    } else if (paidOrderCount >= 2) {
        segment = 'REPEAT';
    } else if (paidOrderCount === 1) {
        segment = 'ONE_TIME';
    }

    // Product interests summary
    const categoryCounts = {};
    const purchasedProducts = new Set();
    paidOrders.forEach(order => {
        order.items.forEach(item => {
            purchasedProducts.add(item.productName);
        });
    });

    // Recent orders (latest 5)
    const recentOrders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5).select('orderNumber total paymentStatus orderStatus createdAt');

    // Returns
    const returnRequests = await ReturnRequest.find({ userId }).sort({ createdAt: -1 });
    const returnCount = returnRequests.length;

    // Support
    const supportTickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });
    
    // Cart
    const cart = await Cart.findOne({ userId });
    const hasAbandonedCart = cart && cart.items && cart.items.length > 0;
    
    // Loyalty Balance
    const lastLoyaltyTx = await LoyaltyTransaction.findOne({ userId }).sort({ createdAt: -1 });
    const loyaltyBalance = lastLoyaltyTx ? lastLoyaltyTx.balanceAfter : 0;

    return {
        customer: {
            ...user.toObject(),
            segment
        },
        metrics: {
            paidOrderCount,
            lifetimeRevenue,
            averageOrderValue,
            firstPurchaseDate,
            lastPurchaseDate,
            loyaltyBalance
        },
        recentOrders,
        returns: {
            total: returnCount,
            recent: returnRequests.slice(0, 3)
        },
        support: {
            total: supportTickets.length,
            open: supportTickets.filter(t => t.status === 'open').length,
            recent: supportTickets.slice(0, 3)
        },
        interests: {
            uniqueProductsPurchased: Array.from(purchasedProducts)
        },
        cart: {
            hasAbandonedCart,
            updatedAt: cart ? cart.updatedAt : null,
            recoveryStage: cart ? cart.recovery?.stage : 0
        }
    };
};
