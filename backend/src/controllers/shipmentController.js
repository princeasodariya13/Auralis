import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';

// @desc    Get shipments by order number
// @route   GET /api/v1/orders/:orderNumber/shipments
// @access  Private
export const getShipmentsByOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber, userId: req.user._id }).select('_id');
        if (!order) {
            return res.status(404).json({ success: false, error: { message: 'Order not found' }});
        }

        const shipments = await Shipment.find({ orderId: order._id }).select('-events.adminId');
        
        res.json({ success: true, data: shipments });
    } catch (error) {
        console.error(`Error in getShipmentsByOrder: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving shipments' }});
    }
};
