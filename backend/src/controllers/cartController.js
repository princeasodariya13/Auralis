import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const MAX_QTY = 20;

// Helper: Enrich cart with DB products and calculate totals
const populateCart = async (cartItems) => {
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ id: { $in: productIds } });
    
    let subtotal = 0;
    const enrichedItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null; // Invalid/deleted product
        
        // Let frontend know if product is out of stock or inactive, but keep it in cart
        // so they can remove or adjust it
        let adjustedQuantity = item.quantity;
        let itemSubtotal = product.price * adjustedQuantity;
        let availability = product.isActive && product.stockQuantity > 0 
            ? (product.stockQuantity <= product.lowStockThreshold ? 'low_stock' : 'in_stock')
            : 'out_of_stock';
        if (!product.isActive) availability = 'inactive';

        // Do not count out-of-stock items towards the subtotal dynamically?
        // Let's count it based on adjustedQuantity but mark it for frontend
        // Actually, if it's inactive or out of stock, we probably shouldn't charge them.
        // Wait, the checkout validation will reject it entirely anyway.
        // For cart view, let's keep the price total so user sees what it would cost.
        subtotal += itemSubtotal;
        
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: adjustedQuantity,
            subtotal: itemSubtotal,
            stockQuantity: product.stockQuantity,
            availability
        };
    }).filter(Boolean); // Remove nulls
    
    return {
        items: enrichedItems,
        totalItems: enrichedItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal
    };
};

// @desc    Get user cart
// @route   GET /api/v1/cart
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }
        
        const cartData = await populateCart(cart.items);
        res.json({ success: true, data: cartData });
    } catch (error) {
        console.error(`Get Cart Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving cart' }});
    }
};

// @desc    Add item to cart
// @route   POST /api/v1/cart/items
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        if (!productId || quantity < 1 || quantity > MAX_QTY) {
            return res.status(400).json({ success: false, error: { message: 'Invalid product or quantity' }});
        }

        const productExists = await Product.findOne({ id: productId });
        if (!productExists || !productExists.isActive) {
            return res.status(404).json({ success: false, error: { message: 'Product not found or unavailable' }});
        }

        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
        let newQty = quantity;
        
        if (existingItemIndex >= 0) {
            newQty = cart.items[existingItemIndex].quantity + quantity;
        }

        // Validate stock
        if (newQty > productExists.stockQuantity) {
            return res.status(400).json({ success: false, error: { message: `Insufficient stock. Only ${productExists.stockQuantity} available.` }});
        }

        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity = Math.min(newQty, MAX_QTY);
        } else {
            cart.items.push({ productId, quantity: Math.min(quantity, MAX_QTY) });
        }

        await cart.save();
        
        const cartData = await populateCart(cart.items);
        res.json({ success: true, data: cartData });
    } catch (error) {
        console.error(`Add to Cart Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error adding to cart' }});
    }
};

// @desc    Update item quantity
// @route   PATCH /api/v1/cart/items/:productId
export const updateCartItem = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1 || quantity > MAX_QTY) {
            return res.status(400).json({ success: false, error: { message: 'Invalid quantity' }});
        }

        const productExists = await Product.findOne({ id: productId });
        if (!productExists || !productExists.isActive) {
            return res.status(404).json({ success: false, error: { message: 'Product not found or unavailable' }});
        }

        if (quantity > productExists.stockQuantity) {
            return res.status(400).json({ success: false, error: { message: `Insufficient stock. Only ${productExists.stockQuantity} available.` }});
        }

        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, error: { message: 'Cart not found' }});
        }

        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, error: { message: 'Item not in cart' }});
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        
        const cartData = await populateCart(cart.items);
        res.json({ success: true, data: cartData });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error updating cart' }});
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:productId
export const removeFromCart = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, error: { message: 'Cart not found' }});
        }

        cart.items = cart.items.filter(item => item.productId !== productId);
        await cart.save();
        
        const cartData = await populateCart(cart.items);
        res.json({ success: true, data: cartData });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error removing item' }});
    }
};

// @desc    Clear cart
// @route   DELETE /api/v1/cart
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ success: true, data: { items: [], totalItems: 0, subtotal: 0 } });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error clearing cart' }});
    }
};

// @desc    Merge guest cart into user cart
// @route   POST /api/v1/cart/merge
export const mergeCart = async (req, res) => {
    try {
        const { guestItems } = req.body; // Array of { id, quantity }
        
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }

        if (!Array.isArray(guestItems) || guestItems.length === 0) {
            const cartData = await populateCart(cart.items);
            return res.json({ success: true, data: cartData });
        }

        // Validate products
        const guestProductIds = guestItems.map(item => item.id || item.productId);
        const validProducts = await Product.find({ id: { $in: guestProductIds }, isActive: true });
        const validProductMap = new Map(validProducts.map(p => [p.id, p]));

        for (const guestItem of guestItems) {
            const pId = guestItem.id || guestItem.productId;
            const product = validProductMap.get(pId);
            if (!product) continue; // Skip invalid or inactive products

            const qty = parseInt(guestItem.quantity) || 1;
            if (qty < 1) continue;

            const existingIndex = cart.items.findIndex(item => item.productId === pId);
            let newQty = qty;
            
            if (existingIndex >= 0) {
                newQty = cart.items[existingIndex].quantity + qty;
            }

            // Cap at available stock or MAX_QTY
            const cappedQty = Math.min(newQty, product.stockQuantity, MAX_QTY);

            if (cappedQty > 0) {
                if (existingIndex >= 0) {
                    cart.items[existingIndex].quantity = cappedQty;
                } else {
                    cart.items.push({ productId: pId, quantity: cappedQty });
                }
            }
        }

        await cart.save();
        
        const cartData = await populateCart(cart.items);
        res.json({ success: true, data: cartData });
    } catch (error) {
        console.error(`Merge Cart Error: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error merging cart' }});
    }
};
