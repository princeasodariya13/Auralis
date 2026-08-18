import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/v1/products
export const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort } = req.query;

        let query = {};

        // Helper to escape regex special characters
        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 0. Only active products
        query.isActive = true;

        // 1. Search filter (case-insensitive regex on name or description)
        if (search && search.trim() !== '') {
            const cleanSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: cleanSearch, $options: 'i' } },
                { description: { $regex: cleanSearch, $options: 'i' } }
            ];
        }

        // 2. Category filter
        if (category && category.toLowerCase() !== 'all') {
            const cleanCategory = escapeRegex(category.trim());
            query.category = { $regex: new RegExp(`^${cleanCategory}$`, 'i') };
        }

        // 3. Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
        }

        // 4. Sort
        let sortOption = {};
        switch (sort) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'name_asc':
                sortOption = { name: 1 };
                break;
            case 'name_desc':
                sortOption = { name: -1 };
                break;
            default:
                sortOption = { id: 1 }; // Default deterministic sort
        }

        // 5. Pagination
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
        const skip = (pageNum - 1) * limitNum;

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);

        // Strip internal fields, compute availability state
        const safeProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            image: p.image,
            description: p.description,
            isBestSeller: p.isBestSeller,
            stockQuantity: p.stockQuantity,
            availability: p.stockQuantity === 0 ? 'out_of_stock' 
                        : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
        }));

        res.json({
            success: true,
            data: {
                products: safeProducts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getProducts: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving products' }
        });
    }
};

// @desc    Get product by ID
// @route   GET /api/v1/products/:id
export const getProductById = async (req, res) => {
    try {
        // We query by the custom 'id' field, not MongoDB's '_id', and ensure it's active
        const p = await Product.findOne({ id: parseInt(req.params.id), isActive: true });
        
        if (p) {
            const safeProduct = {
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: p.image,
                description: p.description,
                isBestSeller: p.isBestSeller,
                stockQuantity: p.stockQuantity,
                availability: p.stockQuantity === 0 ? 'out_of_stock' 
                            : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
            };
            
            res.json({
                success: true,
                data: safeProduct
            });
        } else {
            res.status(404).json({
                success: false,
                error: { message: 'Product not found or unavailable' }
            });
        }
    } catch (error) {
        console.error(`Error in getProductById: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving product' }
        });
    }
};

// @desc    Get all categories
// @route   GET /api/v1/categories
export const getCategories = async (req, res) => {
    try {
        // Find unique categories from existing products
        const uniqueCategories = await Product.distinct('category');
        
        // Map to structure expected by frontend
        const categories = uniqueCategories.map(cat => {
            // Provide fallback images based on category name
            let img = 'https://images.unsplash.com/photo-1599669500515-9b4b92c58f59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
            if (cat.toLowerCase() === 'speakers') img = 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
            if (cat.toLowerCase() === 'accessories') img = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

            return {
                id: cat.toLowerCase(),
                name: cat,
                image: img
            };
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error(`Error in getCategories: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving categories' }
        });
    }
};
