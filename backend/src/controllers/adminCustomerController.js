import { getCustomersIntelligence, getCustomerDetailIntelligence } from '../services/customerAnalyticsService.js';
import { logger } from '../utils/logger.js';

// @desc    Get customer intelligence list
// @route   GET /api/v1/admin/customers
// @access  Private/Admin
export const getCustomers = async (req, res) => {
    try {
        const { search, segment, page, limit, sortField, sortOrder } = req.query;

        const data = await getCustomersIntelligence({
            search,
            segment,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sortField: sortField || 'createdAt',
            sortOrder: parseInt(sortOrder) || -1
        });

        logger.info(`Admin ${req.user?._id} fetched customer intelligence list`, { event: 'ADMIN_GET_CUSTOMERS', adminId: req.user?._id });

        res.json({
            success: true,
            ...data
        });
    } catch (error) {
        logger.error('Error fetching customers intelligence', { event: 'ADMIN_GET_CUSTOMERS_ERROR', error: error.message });
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};

// @desc    Get detailed customer intelligence
// @route   GET /api/v1/admin/customers/:id
// @access  Private/Admin
export const getCustomerDetails = async (req, res) => {
    try {
        const data = await getCustomerDetailIntelligence(req.params.id);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        if (error.message === 'Customer not found') {
            return res.status(404).json({ success: false, error: { message: error.message }});
        }
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};
