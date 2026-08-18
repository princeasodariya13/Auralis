import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    lowStockThreshold: {
        type: Number,
        required: true,
        default: 5,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
