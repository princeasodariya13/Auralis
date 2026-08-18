import mongoose from 'mongoose';

const backgroundJobSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    nextAttemptAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    lockedAt: {
        type: Date,
        default: null
    },
    lastError: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index for finding the next available job
backgroundJobSchema.index({ status: 1, nextAttemptAt: 1, lockedAt: 1 });

const BackgroundJob = mongoose.model('BackgroundJob', backgroundJobSchema);

export default BackgroundJob;
