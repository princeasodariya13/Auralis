import mongoose from 'mongoose';

const shipmentEventSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: false, timestamps: true });

const shipmentSchema = new mongoose.Schema({
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
    carrier: {
        type: String,
        required: true
    },
    trackingNumber: {
        type: String
    },
    trackingUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['created', 'packed', 'handed_to_carrier', 'in_transit', 'out_for_delivery', 'delivered', 'delivery_failed', 'returned_to_sender', 'cancelled'],
        default: 'created'
    },
    estimatedDeliveryDate: {
        type: Date
    },
    items: [{
        productId: { type: Number, required: true },
        productName: { type: String, required: true },
        productImage: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    events: [shipmentEventSchema]
}, {
    timestamps: true
});

shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ orderNumber: 1 });
shipmentSchema.index({ userId: 1, createdAt: -1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;
