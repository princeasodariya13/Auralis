import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        enum: ['PRODUCT_VIEWED', 'ADD_TO_CART', 'CHECKOUT_STARTED', 'PAYMENT_INITIATED'],
        required: true,
        index: true
    },
    productId: {
        type: Number,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }
}, {
    timestamps: true
});

// Index for time-range funnel queries
analyticsEventSchema.index({ eventType: 1, createdAt: 1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
