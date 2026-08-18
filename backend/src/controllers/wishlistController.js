import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
        }

        // Fetch actual product details
        const productIds = wishlist.products.map(p => p.productId);
        const products = await Product.find({ id: { $in: productIds } });

        // Map them cleanly
        const populatedProducts = products.map(product => {
            const addedAt = wishlist.products.find(p => p.productId === product.id)?.addedAt;
            let availability = product.isActive && product.stockQuantity > 0 
                ? (product.stockQuantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock')
                : 'out_of_stock';
            if (!product.isActive) availability = 'inactive';

            return {
                ...product.toObject(),
                availability,
                addedAt
            };
        });

        res.json({
            success: true,
            data: populatedProducts
        });
    } catch (error) {
        console.error(`Error in getWishlist: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving wishlist' }
        });
    }
};

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid product ID' } });
        }

        // Verify product exists
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: { message: 'Product not found' }
            });
        }

        let wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
        }

        // Verify not already present
        const alreadyAdded = wishlist.products.find(p => p.productId === productId);
        if (alreadyAdded) {
            return res.status(400).json({
                success: false,
                error: { message: 'Product already in wishlist' }
            });
        }

        wishlist.products.push({ productId });
        await wishlist.save();

        res.json({
            success: true,
            message: 'Product added to wishlist'
        });
    } catch (error) {
        console.error(`Error in addToWishlist: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error adding to wishlist' }
        });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid product ID' } });
        }

        let wishlist = await Wishlist.findOne({ userId: req.user._id });
        if (!wishlist) {
            return res.json({ success: true, message: 'Removed' }); // Silently succeed
        }

        wishlist.products = wishlist.products.filter(p => p.productId !== productId);
        await wishlist.save();

        res.json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        console.error(`Error in removeFromWishlist: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error removing from wishlist' }
        });
    }
};

// @desc    Clear wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { products: [] } },
            { upsert: true }
        );

        res.json({
            success: true,
            message: 'Wishlist cleared'
        });
    } catch (error) {
        console.error(`Error in clearWishlist: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error clearing wishlist' }
        });
    }
};
