import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: ['ORDER', 'PAYMENT', 'REFUND', 'RETURN', 'PRODUCT', 'ACCOUNT', 'OTHER'],
        required: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        default: 'NORMAL'
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'],
        default: 'OPEN',
        index: true
    },
    orderNumber: {
        type: String, // Optional reference to order
        trim: true
    },
    returnRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReturnRequest'
    },
    assignedAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    lastActivityAt: {
        type: Date,
        default: Date.now,
        index: -1
    }
}, {
    timestamps: true
});

// Index for filtering
supportTicketSchema.index({ status: 1, priority: 1, lastActivityAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
