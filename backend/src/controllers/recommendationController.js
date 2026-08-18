import { getRelatedProductsService, getFrequentlyBoughtTogetherService } from '../services/recommendationService.js';
import Product from '../models/Product.js';

// @desc    Get related products for a specific product
// @route   GET /api/v1/recommendations/related/:id
// @access  Public
export const getRelatedProducts = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 4;
        
        // Ensure product exists
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' } });
        }

        const relatedProducts = await getRelatedProductsService(productId, product.category, limit);

        // Format for frontend
        const formatted = relatedProducts.map(p => ({
            ...p,
            availability: p.stockQuantity === 0 ? 'out_of_stock' 
                        : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error(`Error in getRelatedProducts: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Failed to fetch related products' }});
    }
};

// @desc    Get frequently bought together products
// @route   GET /api/v1/recommendations/frequently-bought/:id
// @access  Public
export const getFrequentlyBoughtTogether = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit) || 4;

        const fbtProducts = await getFrequentlyBoughtTogetherService(productId, limit);

        // Format for frontend
        const formatted = fbtProducts.map(p => ({
            ...p,
            availability: p.stockQuantity === 0 ? 'out_of_stock' 
                        : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error(`Error in getFrequentlyBoughtTogether: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Failed to fetch frequently bought together products' }});
    }
};
