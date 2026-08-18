import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    addressLine2: {
        type: String,
        trim: true,
        maxlength: 255
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    country: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// User index for quick retrieval
addressSchema.index({ userId: 1 });

const Address = mongoose.model('Address', addressSchema);

export default Address;
