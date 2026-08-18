import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
    eventKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventType: {
        type: String,
        required: true
    },
    recipientEmail: {
        type: String
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        default: 'sent'
    },
    errorDetails: {
        type: String
    }
}, {
    timestamps: true
});

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
