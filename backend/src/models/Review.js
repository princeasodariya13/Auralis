import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: Number,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 1000
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    moderationStatus: {
        type: String,
        enum: ['approved', 'pending', 'rejected', 'flagged'],
        default: 'approved',
        index: true
    }
}, {
    timestamps: true
});

// Ensure one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, moderationStatus: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
