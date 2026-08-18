import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    resourceType: {
        type: String,
        required: true,
        index: true
    },
    resourceId: {
        type: String, // String to accommodate ObjectIds or string IDs like order numbers
        required: true,
        index: true
    },
    success: {
        type: Boolean,
        default: true
    },
    previousState: {
        type: mongoose.Schema.Types.Mixed
    },
    newState: {
        type: mongoose.Schema.Types.Mixed
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    failureReason: {
        type: String
    }
}, {
    timestamps: true // Automatically creates createdAt, updatedAt
});

// Compound index for chronological querying of a specific resource
adminAuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

// Compound index for an admin's actions
adminAuditLogSchema.index({ adminUserId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
