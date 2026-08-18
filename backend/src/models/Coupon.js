import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true, // Automatically normalize casing
        index: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minimumOrderValue: {
        type: Number,
        default: 0,
        min: 0
    },
    maximumDiscount: {
        type: Number,
        min: 0 // Only applies if type is percentage
    },
    startsAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    usageLimit: {
        type: Number, // Total times this coupon can be used
        default: null, // Null means unlimited
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    perUserLimit: {
        type: Number, // Total times a single user can use this
        default: 1,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
