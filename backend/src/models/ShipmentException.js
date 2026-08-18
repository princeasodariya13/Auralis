import mongoose from 'mongoose';

const shipmentExceptionSchema = new mongoose.Schema({
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        default: null,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    orderNumber: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'OVERDUE_DELIVERY',
            'STUCK_CREATED',
            'STUCK_PACKED',
            'STUCK_IN_TRANSIT',
            'DELIVERY_FAILED',
            'RETURNED_TO_SENDER',
            'PARTIAL_ORDER_DELAY'
        ],
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
        default: 'OPEN',
        index: true
    },
    detectedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    acknowledgedAt: {
        type: Date,
        default: null
    },
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolutionNote: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Idempotency: Prevent duplicate active exceptions of the same type for a shipment.
// A shipment or order should only have one OPEN or ACKNOWLEDGED exception of a specific type.
shipmentExceptionSchema.index(
    { orderId: 1, type: 1, shipmentId: 1 }, 
    { unique: true, partialFilterExpression: { status: { $in: ['OPEN', 'ACKNOWLEDGED'] } } }
);

// We should also be able to query quickly by status + severity + detectedAt
shipmentExceptionSchema.index({ status: 1, severity: 1, detectedAt: -1 });

const ShipmentException = mongoose.model('ShipmentException', shipmentExceptionSchema);

export default ShipmentException;
