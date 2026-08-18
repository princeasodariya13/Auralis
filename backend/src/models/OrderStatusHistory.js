import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    orderNumber: {
        type: String,
        required: true
    },
    previousStatus: {
        type: String,
        required: true
    },
    newStatus: {
        type: String,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    adminNameSnapshot: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

orderStatusHistorySchema.index({ orderId: 1, createdAt: -1 });

const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);

export default OrderStatusHistory;
