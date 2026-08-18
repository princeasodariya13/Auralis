import mongoose from 'mongoose';

const reviewVoteSchema = new mongoose.Schema({
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
    value: {
        type: Number,
        enum: [1, -1],
        required: true
    }
}, {
    timestamps: true
});

// Prevent multiple votes by the same user on the same review
reviewVoteSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const ReviewVote = mongoose.model('ReviewVote', reviewVoteSchema);

export default ReviewVote;
