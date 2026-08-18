import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
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
    discountAmount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Enforce per-user limit queries effectively
couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ orderId: 1 }, { unique: true });

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

export default CouponUsage;
