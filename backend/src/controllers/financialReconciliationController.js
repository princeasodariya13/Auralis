import { getReconciliationSummary, getAnomalies } from '../services/financialReconciliationService.js';

// @desc    Get reconciliation summary metrics
// @route   GET /api/v1/admin/reconciliation/summary
// @access  Private/Admin
export const getSummary = async (req, res) => {
    try {
        const summary = await getReconciliationSummary();
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error(`Reconciliation Summary Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error generating reconciliation summary' } });
    }
};

// @desc    Get paginated anomalies
// @route   GET /api/v1/admin/reconciliation/anomalies
// @access  Private/Admin
export const listAnomalies = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        
        const filters = {};
        if (req.query.severity && req.query.severity !== 'ALL') {
            filters.severity = req.query.severity;
        }
        if (req.query.type && req.query.type !== 'ALL') {
            filters.type = req.query.type;
        }

        const data = await getAnomalies(page, limit, filters);
        res.json({ success: true, data });
    } catch (error) {
        console.error(`Reconciliation Anomalies Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving anomalies' } });
    }
};
