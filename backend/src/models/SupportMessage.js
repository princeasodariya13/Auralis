import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportTicket',
        required: true,
        index: true
    },
    senderType: {
        type: String,
        enum: ['CUSTOMER', 'ADMIN', 'SYSTEM'],
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Optional for SYSTEM
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    isInternal: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
export default SupportMessage;
