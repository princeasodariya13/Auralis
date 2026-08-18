import mongoose from 'mongoose';

const orderNoteSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    adminNameSnapshot: {
        type: String,
        required: true
    },
    note: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    }
}, {
    timestamps: true
});

orderNoteSchema.index({ orderId: 1, createdAt: -1 });

const OrderNote = mongoose.model('OrderNote', orderNoteSchema);

export default OrderNote;
