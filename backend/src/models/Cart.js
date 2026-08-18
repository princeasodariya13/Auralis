import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1'],
        max: [20, 'Maximum quantity allowed is 20']
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    items: [cartItemSchema],
    recovery: {
        stage: { type: Number, default: 0 },
        lastSentAt: { type: Date, default: null }
    }
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
