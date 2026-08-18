import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        ref: 'Product' // Note: This references the custom 'id' field, not '_id'
    },
    sku: {
        type: String,
        required: true
    },
    productNameSnapshot: {
        type: String,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    adjustmentType: {
        type: String,
        required: true,
        enum: ['stock_in', 'stock_out', 'correction']
    },
    changeQuantity: {
        type: Number,
        required: true
    },
    previousQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    newQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for faster querying of history
inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ adminId: 1, createdAt: -1 });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;
