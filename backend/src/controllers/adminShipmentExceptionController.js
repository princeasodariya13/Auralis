import ShipmentException from '../models/ShipmentException.js';
import { recordAdminAction } from '../services/adminAuditService.js';

// @desc    Get shipment exceptions
// @route   GET /api/v1/admin/shipment-exceptions
// @access  Private/Admin
export const getShipmentExceptions = async (req, res) => {
    try {
        const { status, severity, type, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (severity && severity !== 'ALL') query.severity = severity;
        if (type && type !== 'ALL') query.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const exceptions = await ShipmentException.find(query)
            .sort({ detectedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('shipmentId', 'carrier trackingNumber status orderNumber')
            .populate('userId', 'name email');

        const total = await ShipmentException.countDocuments(query);

        res.json({
            success: true,
            data: exceptions,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching shipment exceptions:', error);
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};

// @desc    Get exceptions summary
// @route   GET /api/v1/admin/shipment-exceptions/summary
// @access  Private/Admin
export const getExceptionsSummary = async (req, res) => {
    try {
        const summary = await ShipmentException.aggregate([
            { $match: { status: { $in: ['OPEN', 'ACKNOWLEDGED'] } } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        const totalActive = await ShipmentException.countDocuments({ status: { $in: ['OPEN', 'ACKNOWLEDGED'] } });
        
        const typeCounts = {
            OVERDUE_DELIVERY: 0,
            STUCK_CREATED: 0,
            STUCK_PACKED: 0,
            STUCK_IN_TRANSIT: 0,
            DELIVERY_FAILED: 0,
            RETURNED_TO_SENDER: 0,
            PARTIAL_ORDER_DELAY: 0
        };

        summary.forEach(item => {
            typeCounts[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                totalActive,
                byType: typeCounts
            }
        });
    } catch (error) {
        console.error('Error getting exception summary:', error);
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};

// @desc    Acknowledge exception
// @route   PATCH /api/v1/admin/shipment-exceptions/:id/acknowledge
// @access  Private/Admin
export const acknowledgeException = async (req, res) => {
    try {
        const exception = await ShipmentException.findById(req.params.id);
        
        if (!exception) {
            return res.status(404).json({ success: false, error: { message: 'Exception not found' }});
        }
        
        if (exception.status !== 'OPEN') {
            return res.status(400).json({ success: false, error: { message: 'Exception is not OPEN' }});
        }

        exception.status = 'ACKNOWLEDGED';
        exception.acknowledgedAt = new Date();
        exception.acknowledgedBy = req.user._id;

        await exception.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SHIPMENT_EXCEPTION_ACKNOWLEDGED',
            resourceType: 'ShipmentException',
            resourceId: exception._id,
            newState: { status: 'ACKNOWLEDGED' },
            metadata: { type: exception.type, orderNumber: exception.orderNumber }
        });

        res.json({ success: true, data: exception });
    } catch (error) {
        console.error('Error acknowledging exception:', error);
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};

// @desc    Resolve exception
// @route   PATCH /api/v1/admin/shipment-exceptions/:id/resolve
// @access  Private/Admin
export const resolveException = async (req, res) => {
    try {
        const { resolutionNote } = req.body;
        const exception = await ShipmentException.findById(req.params.id);
        
        if (!exception) {
            return res.status(404).json({ success: false, error: { message: 'Exception not found' }});
        }
        
        if (exception.status === 'RESOLVED') {
            return res.status(400).json({ success: false, error: { message: 'Exception is already RESOLVED' }});
        }

        const previousStatus = exception.status;
        
        exception.status = 'RESOLVED';
        exception.resolvedAt = new Date();
        exception.resolvedBy = req.user._id;
        if (resolutionNote) {
            exception.resolutionNote = resolutionNote;
        }

        await exception.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'SHIPMENT_EXCEPTION_RESOLVED',
            resourceType: 'ShipmentException',
            resourceId: exception._id,
            previousState: { status: previousStatus },
            newState: { status: 'RESOLVED', resolutionNote },
            metadata: { type: exception.type, orderNumber: exception.orderNumber }
        });

        res.json({ success: true, data: exception });
    } catch (error) {
        console.error('Error resolving exception:', error);
        res.status(500).json({ success: false, error: { message: 'Server Error' }});
    }
};
