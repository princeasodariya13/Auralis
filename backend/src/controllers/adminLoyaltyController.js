import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import { adminAdjustPoints, getLoyaltyBalance } from '../services/loyaltyService.js';
import { recordAdminAction } from '../services/adminAuditService.js';

// @desc    Get loyalty transactions for a specific customer
// @route   GET /api/v1/admin/customers/:id/loyalty
// @access  Private/Admin
export const getCustomerLoyalty = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const balance = await getLoyaltyBalance(userId);
        
        const total = await LoyaltyTransaction.countDocuments({ userId });
        const transactions = await LoyaltyTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('orderId', 'orderNumber')
            .populate('returnRequestId', 'orderNumber')
            .populate('adminId', 'name');

        res.json({
            success: true,
            data: {
                balance,
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching admin loyalty:', error);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving loyalty details' } });
    }
};

// @desc    Manually adjust customer points
// @route   POST /api/v1/admin/customers/:id/loyalty-adjustment
// @access  Private/Admin
export const adjustCustomerLoyalty = async (req, res) => {
    try {
        const userId = req.params.id;
        const { points, notes } = req.body;

        if (!points || isNaN(points)) {
            return res.status(400).json({ success: false, error: { message: 'Valid points amount is required' }});
        }
        if (!notes || notes.trim().length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Notes are required for manual adjustments' }});
        }

        const tx = await adminAdjustPoints(userId, req.user._id, points, notes);

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'LOYALTY_ADJUSTED',
            resourceType: 'User',
            resourceId: userId,
            metadata: {
                pointsAdjusted: points,
                balanceAfter: tx.balanceAfter,
                notes
            }
        });

        res.json({ success: true, data: tx });
    } catch (error) {
        console.error('Error adjusting loyalty:', error);
        res.status(500).json({ success: false, error: { message: 'Server error adjusting loyalty points' } });
    }
};
