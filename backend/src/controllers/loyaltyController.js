import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import { getLoyaltyBalance, getAvailablePoints } from '../services/loyaltyService.js';

// @desc    Get current user's loyalty balance and history
// @route   GET /api/v1/loyalty
// @access  Private
export const getMyLoyalty = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const balance = await getLoyaltyBalance(req.user._id);
        const availablePoints = await getAvailablePoints(req.user._id);
        
        const total = await LoyaltyTransaction.countDocuments({ userId: req.user._id });
        const transactions = await LoyaltyTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('orderId', 'orderNumber')
            .populate('returnRequestId', 'orderNumber');

        res.json({
            success: true,
            data: {
                balance,
                availablePoints,
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
        console.error('Error fetching loyalty:', error);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving loyalty details' } });
    }
};
