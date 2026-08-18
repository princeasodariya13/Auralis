import CustomerNotification from '../models/CustomerNotification.js';

// @desc    Get user notifications
// @route   GET /api/v1/users/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;

        const query = { userId: req.user._id };

        const notifications = await CustomerNotification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await CustomerNotification.countDocuments(query);
        const unreadCount = await CustomerNotification.countDocuments({ ...query, isRead: false });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getUserNotifications: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server Error retrieving notifications' } });
    }
};

// @desc    Get unread notification count
// @route   GET /api/v1/users/notifications/unread-count
// @access  Private
export const getUnreadNotificationCount = async (req, res) => {
    try {
        const unreadCount = await CustomerNotification.countDocuments({ 
            userId: req.user._id, 
            isRead: false 
        });

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error(`Error in getUnreadNotificationCount: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server Error retrieving unread count' } });
    }
};

// @desc    Mark a notification as read
// @route   PATCH /api/v1/users/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res) => {
    try {
        // Enforce ownership explicitly
        const notification = await CustomerNotification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error(`Error in markNotificationAsRead: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server Error marking notification as read' } });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/users/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        // Enforce ownership
        await CustomerNotification.updateMany(
            { userId: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error(`Error in markAllNotificationsAsRead: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server Error marking all notifications as read' } });
    }
};
