import mongoose from 'mongoose';

const customerNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'ORDER_PLACED',
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'ORDER_PROCESSING',
            'ORDER_SHIPPED',
            'ORDER_DELIVERED',
            'ORDER_CANCELLED'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Compound index for efficient unread counts and pagination per user
customerNotificationSchema.index({ userId: 1, createdAt: -1 });
customerNotificationSchema.index({ userId: 1, isRead: 1 });

const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);

export default CustomerNotification;
