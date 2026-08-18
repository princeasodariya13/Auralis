import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    refundAmount: { type: Number, required: true, min: 0 } // Proportional refund amount for this item qty
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    items: [returnItemSchema],
    reason: {
        type: String,
        required: true
    },
    customerNote: {
        type: String
    },
    adminNote: {
        type: String
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'received', 'refund_pending', 'refunded', 'cancelled'],
        default: 'requested'
    },
    refundAmount: {
        type: Number,
        required: true,
        min: 0
    },
    refundReference: {
        type: String // Razorpay Refund ID
    },
    idempotencyKey: {
        type: String,
        unique: true,
        required: true
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    receivedAt: { type: Date },
    refundedAt: { type: Date }
}, {
    timestamps: true
});

returnRequestSchema.index({ userId: 1, orderId: 1 });
returnRequestSchema.index({ orderNumber: 1 });
returnRequestSchema.index({ status: 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

export default ReturnRequest;
