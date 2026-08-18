import mongoose from 'mongoose';

const reviewReportSchema = new mongoose.Schema({
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['inappropriate', 'spam', 'misleading', 'offensive', 'suspicious', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Prevent duplicate reports by the same user for the same review
reviewReportSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const ReviewReport = mongoose.model('ReviewReport', reviewReportSchema);

export default ReviewReport;
