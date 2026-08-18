import Order from '../models/Order.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import OrderNote from '../models/OrderNote.js';
import { sendOrderStatusUpdate } from '../services/notificationService.js';
import { notifyOrderStatusChange } from '../services/customerNotificationService.js';

// Valid Transitions Map
const VALID_TRANSITIONS = {
    'pending_payment': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': [],
    'cancelled': []
};

// Helper to escape regex
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all orders
// @route   GET /api/v1/admin/orders
export const getAdminOrders = async (req, res) => {
    try {
        const { search, status, paymentStatus, dateFilter, page, limit } = req.query;
        let query = {};

        // Search
        if (search && search.trim() !== '') {
            const cleanSearch = escapeRegex(search.trim());
            // Since we need to search by customer email/name, we need to populate or use lookup.
            // For simplicity and performance, if search matches orderNumber we find it.
            // If we want to search by User fields, we'd do a subquery or aggregate.
            // For this implementation, we will search by orderNumber primarily. 
            // We can also find Users matching the search and then match their ObjectIds.
            
            import('../models/User.js').then(async ({ default: User }) => {
                const users = await User.find({
                    $or: [
                        { name: { $regex: cleanSearch, $options: 'i' } },
                        { email: { $regex: cleanSearch, $options: 'i' } }
                    ]
                }).select('_id');
                const userIds = users.map(u => u._id);
                
                query.$or = [
                    { orderNumber: { $regex: cleanSearch, $options: 'i' } },
                    { userId: { $in: userIds } }
                ];
            }).catch(e => console.error("Error loading User model", e));
        }

        if (status && status !== 'All') {
            query.orderStatus = status;
        }

        if (paymentStatus && paymentStatus !== 'All') {
            query.paymentStatus = paymentStatus.toLowerCase();
        }

        if (dateFilter) {
            const now = new Date();
            if (dateFilter === 'Today') {
                now.setHours(0,0,0,0);
                query.createdAt = { $gte: now };
            } else if (dateFilter === 'Last 7 Days') {
                const past = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                query.createdAt = { $gte: past };
            } else if (dateFilter === 'Last 30 Days') {
                const past = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                query.createdAt = { $gte: past };
            }
        }

        // Delay slight execution to ensure User module loaded if search is provided
        if (search && search.trim() !== '') {
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email');

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    orderNumber: order.orderNumber,
                    customerName: order.userId?.name || 'Unknown User',
                    customerEmail: order.userId?.email || 'No email',
                    createdAt: order.createdAt,
                    itemsCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
                    total: order.total,
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.orderStatus
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });

    } catch (error) {
        console.error(`Error in getAdminOrders: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving orders' }});
    }
};

// @desc    Get order by order number
// @route   GET /api/v1/admin/orders/:orderNumber
export const getAdminOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber })
            .populate('userId', 'name email');
            
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        console.error(`Error in getAdminOrderDetails: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving order details' }});
    }
};

// @desc    Update order status
// @route   PATCH /api/v1/admin/orders/:orderNumber/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, error: { message: 'Status is required' }});
        }

        const order = await Order.findOne({ orderNumber: req.params.orderNumber }).populate('userId', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }

        const currentStatus = order.orderStatus;
        
        if (currentStatus === status) {
            return res.status(400).json({ success: false, error: { message: 'Order is already in this status' }});
        }

        // Validate transition
        const allowedTransitions = VALID_TRANSITIONS[currentStatus];
        if (!allowedTransitions || !allowedTransitions.includes(status)) {
            return res.status(409).json({ success: false, error: { message: `Invalid status transition from ${currentStatus} to ${status}` }});
        }

        // Atomic update checking current state
        const updatedOrder = await Order.findOneAndUpdate(
            { orderNumber: req.params.orderNumber, orderStatus: currentStatus },
            { $set: { orderStatus: status } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(409).json({ success: false, error: { message: 'Concurrent modification detected. Order status changed during update.' }});
        }

        // Create history log
        await OrderStatusHistory.create({
            orderId: updatedOrder._id,
            orderNumber: updatedOrder.orderNumber,
            previousStatus: currentStatus,
            newStatus: status,
            adminId: req.user._id,
            adminNameSnapshot: req.user.name,
            note: `Status updated via Admin`
        });

        // Fire notification in the background (don't await so we don't slow down the response)
        sendOrderStatusUpdate(updatedOrder, order.userId, status).catch(err => {
            console.error('Failed to send order status update email background task', err);
        });
        notifyOrderStatusChange(updatedOrder, status).catch(console.error);

        res.json({ success: true, data: { orderStatus: updatedOrder.orderStatus } });

    } catch (error) {
        console.error(`Error in updateOrderStatus: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error updating order status' }});
    }
};

// @desc    Get order history
// @route   GET /api/v1/admin/orders/:orderNumber/history
export const getOrderHistory = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const history = await OrderStatusHistory.find({ orderNumber: req.params.orderNumber })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await OrderStatusHistory.countDocuments({ orderNumber: req.params.orderNumber });

        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getOrderHistory: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving order history' }});
    }
};

// @desc    Get order notes
// @route   GET /api/v1/admin/orders/:orderNumber/notes
export const getOrderNotes = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select('_id');
        if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' }});

        const notes = await OrderNote.find({ orderId: order._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: notes });
    } catch (error) {
        console.error(`Error in getOrderNotes: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving order notes' }});
    }
};

// @desc    Add order note
// @route   POST /api/v1/admin/orders/:orderNumber/notes
export const addOrderNote = async (req, res) => {
    try {
        const { note } = req.body;
        if (!note || note.trim().length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Note content is required' }});
        }
        if (note.length > 2000) {
            return res.status(400).json({ success: false, error: { message: 'Note exceeds 2000 characters' }});
        }

        const order = await Order.findOne({ orderNumber: req.params.orderNumber }).select('_id');
        if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' }});

        const newNote = await OrderNote.create({
            orderId: order._id,
            adminId: req.user._id,
            adminNameSnapshot: req.user.name,
            note: note.trim()
        });

        res.status(201).json({ success: true, data: newNote });
    } catch (error) {
        console.error(`Error in addOrderNote: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error adding note' }});
    }
};
