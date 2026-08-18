import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    lineTotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCost: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    couponCode: {
        type: String
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed']
    },
    discountValue: {
        type: Number,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    loyaltyPointsRedeemed: {
        type: Number,
        default: 0,
        min: 0
    },
    loyaltyDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending_payment'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    paymentVerifiedAt: {
        type: Date
    },
    refunds: [{
        refundId: { type: String, required: true },
        amount: { type: Number, required: true },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Indexes for order lookup
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ orderNumber: 1, userId: 1 }); // Optimize lookups for a user's specific order

const Order = mongoose.model('Order', orderSchema);

export default Order;
