import AdminAuditLog from '../models/AdminAuditLog.js';

// @desc    Get paginated admin audit logs
// @route   GET /api/v1/admin/audit-logs
// @access  Private/Admin
export const getAuditLogs = async (req, res) => {
    try {
        const { action, resourceType, adminUserId, success, startDate, endDate, page, limit } = req.query;
        let query = {};

        if (action && action !== 'ALL') query.action = action;
        if (resourceType && resourceType !== 'ALL') query.resourceType = resourceType;
        if (adminUserId && adminUserId !== 'ALL') query.adminUserId = adminUserId;
        
        if (success !== undefined && success !== 'ALL') {
            query.success = success === 'true';
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        const total = await AdminAuditLog.countDocuments(query);
        const logs = await AdminAuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('adminUserId', 'name email');

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error retrieving audit logs: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving audit logs' } });
    }
};

// @desc    Get audit log filters (unique actions, resource types, admins)
// @route   GET /api/v1/admin/audit-logs/filters
// @access  Private/Admin
export const getAuditFilters = async (req, res) => {
    try {
        const [actions, resourceTypes, adminIds] = await Promise.all([
            AdminAuditLog.distinct('action'),
            AdminAuditLog.distinct('resourceType'),
            AdminAuditLog.distinct('adminUserId')
        ]);
        
        // Populate admin names for the dropdown
        const mongoose = (await import('mongoose')).default;
        const User = mongoose.model('User');
        const admins = await User.find({ _id: { $in: adminIds } }).select('name email');

        res.json({
            success: true,
            data: {
                actions: actions.sort(),
                resourceTypes: resourceTypes.sort(),
                admins
            }
        });
    } catch (error) {
        console.error(`Error retrieving audit filters: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving audit filters' } });
    }
};
