import mongoose from 'mongoose';

const loyaltyTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['EARN', 'REDEEM', 'REFUND_REVERSAL', 'CANCELLATION_REVERSAL', 'ADMIN_ADJUSTMENT', 'EXPIRATION'],
        required: true
    },
    points: {
        type: Number,
        required: true
        // Can be positive (EARN) or negative (REDEEM, REVERSAL)
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    source: {
        type: String,
        required: true,
        trim: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    returnRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReturnRequest'
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    },
    notes: {
        type: String,
        trim: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);

export default LoyaltyTransaction;
