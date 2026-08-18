import { getBusinessAnalytics } from '../services/analyticsService.js';

// @desc    Get admin business analytics
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (req, res) => {
    try {
        const { range } = req.query;
        // Validate range parameter
        const validRanges = ['today', '7d', '30d', 'year', 'all'];
        const sanitizedRange = validRanges.includes(range) ? range : '30d';

        const data = await getBusinessAnalytics(sanitizedRange);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(`Admin Analytics Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving analytics data' }});
    }
};
